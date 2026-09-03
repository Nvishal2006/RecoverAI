import json
import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.config import RecoveryAction, ExecutionStatus, PolicyDecision
from backend.models import Transaction, ManualReviewActionRequest
from backend.classifier import classify_failure
from backend.action_engine import evaluate_policy_guardrails
from backend.executor import execute_recovery_action
from backend.audit import (
    load_audit_logs,
    save_audit_logs,
    is_idempotency_key_present,
    get_customer_activity_counts,
    create_pre_execution_audit,
    update_audit_execution,
    get_audit_trail_for_txn
)
from backend.metrics import compute_system_metrics
from data_agent import generate_synthetic_transactions

app = FastAPI(
    title="RecoverAI Autonomous Revenue Recovery Agent",
    version="1.0.0",
    description="Bounded AI agent recovering failed Razorpay transactions"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TXN_FILE_PATH = os.path.join("data", "failed_txns.json")

def load_transactions() -> List[Transaction]:
    if not os.path.exists(TXN_FILE_PATH):
        generate_synthetic_transactions(TXN_FILE_PATH)
    try:
        with open(TXN_FILE_PATH, "r") as f:
            data = json.load(f)
            return [Transaction(**t) for t in data]
    except Exception:
        return []

def save_transactions(txns: List[Transaction]) -> None:
    os.makedirs(os.path.dirname(TXN_FILE_PATH), exist_ok=True)
    with open(TXN_FILE_PATH, "w") as f:
        json.dump([t.model_dump() for t in txns], f, indent=2)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RecoverAI Agent Backend",
        "version": "1.0.0",
        "execution_mode": "BOUNDED_FINANCIAL_WORKFLOW"
    }

@app.post("/api/generate-data")
def trigger_generate_data():
    """Regenerates 100 synthetic transactions with 20 holdouts and resets audit logs."""
    txns = generate_synthetic_transactions(TXN_FILE_PATH)
    save_audit_logs([])  # Clear audit trail for fresh run
    return {
        "message": f"Successfully generated {len(txns)} transactions (20 holdouts).",
        "total_count": len(txns),
        "holdout_count": sum(1 for t in txns if t.get("is_holdout"))
    }

@app.get("/api/transactions")
def get_transactions(
    status: Optional[str] = None,
    failure_code: Optional[str] = None,
    customer_tier: Optional[str] = None,
    holdout: Optional[bool] = None,
    action: Optional[str] = None
):
    txns = load_transactions()
    filtered = txns

    if status:
        filtered = [t for t in filtered if t.status.upper() == status.upper()]
    if failure_code:
        filtered = [t for t in filtered if t.failure_code.lower() == failure_code.lower()]
    if customer_tier:
        filtered = [t for t in filtered if t.customer_tier.lower() == customer_tier.lower()]
    if holdout is not None:
        filtered = [t for t in filtered if t.is_holdout == holdout]
    if action:
        filtered = [t for t in filtered if t.action_taken == action]

    return filtered

@app.get("/api/transactions/{txn_id}")
def get_transaction_detail(txn_id: str):
    txns = load_transactions()
    txn = next((t for t in txns if t.txn_id == txn_id), None)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@app.post("/api/evaluate/{txn_id}")
def process_single_transaction(txn_id: str):
    """
    Executes the full agent lifecycle on a single transaction:
    1. Root Cause Diagnosis (Deterministic Rules + Gemini)
    2. Policy Guardrails Validation
    3. Idempotency Verification
    4. Mandatory Pre-Execution Audit Creation (PENDING_EXECUTION)
    5. Recovery Action Execution (Simulator / Razorpay Test Mode)
    6. Post-execution State & Audit Update
    """
    txns = load_transactions()
    txn_index = next((i for i, t in enumerate(txns) if t.txn_id == txn_id), None)
    if txn_index is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn = txns[txn_index]
    
    # Check if already recovered
    if txn.status.upper() in ["SUCCESS", "RECOVERED"]:
        return {"status": "ALREADY_RECOVERED", "txn": txn}

    # Step 1: AI Recommendation (Gemini + Deterministic)
    recommendation = classify_failure(txn)

    # Step 2: Customer activity counts for guardrail limits
    retries, nudges = get_customer_activity_counts(txn.customer_id, txns)

    # Step 3: Deterministic Policy Engine (authoritative final check)
    policy_result = evaluate_policy_guardrails(
        txn=txn,
        recommendation=recommendation,
        customer_retries=retries,
        customer_nudges=nudges,
        voucher_amount_paise=0
    )

    # Step 4: Idempotency Check
    idempotency_key = f"{txn.txn_id}:{policy_result.final_action}"
    if is_idempotency_key_present(idempotency_key):
        return {
            "status": "IDEMPOTENT_SKIP",
            "message": f"Action {policy_result.final_action} already executed for this transaction.",
            "idempotency_key": idempotency_key,
            "txn": txn
        }

    # Step 5: MANDATORY PRE-EXECUTION AUDIT
    audit_record = create_pre_execution_audit(
        txn=txn,
        recommendation=recommendation,
        policy_result=policy_result,
        idempotency_key=idempotency_key
    )

    # Step 6: Recovery Execution
    exec_result = execute_recovery_action(
        txn=txn,
        policy_result=policy_result,
        pre_execution_audit=audit_record
    )

    # Step 7: Update Transaction State in Store
    if exec_result["success"]:
        txn.status = "RECOVERED"
        txn.recovered_amount_paise = exec_result["recovered_amount_paise"]
    elif exec_result["status"] == ExecutionStatus.FALLBACK:
        txn.status = "MANUAL_REVIEW"
    elif policy_result.final_action == RecoveryAction.NO_ACTION:
        txn.status = "NO_ACTION"
    else:
        txn.status = "FAILED"

    txn.action_taken = policy_result.final_action
    txn.ai_confidence = recommendation.confidence
    txn.policy_decision = policy_result.decision
    if policy_result.final_action == RecoveryAction.RETRY_PAYMENT:
        txn.retry_count += 1

    txns[txn_index] = txn
    save_transactions(txns)

    return {
        "status": exec_result["status"],
        "recommendation": recommendation,
        "policy_result": policy_result,
        "execution": exec_result,
        "audit_id": audit_record.audit_id,
        "txn": txn
    }

@app.post("/api/batch-process")
def batch_process_recovery():
    """Runs the recovery agent across all eligible non-holdout pending transactions."""
    txns = load_transactions()
    results = []
    
    for t in txns:
        # Never process holdout or already recovered transactions
        if t.is_holdout or t.status.upper() in ["RECOVERED", "SUCCESS"]:
            continue
        try:
            res = process_single_transaction(t.txn_id)
            results.append({"txn_id": t.txn_id, "status": res.get("status")})
        except Exception as e:
            results.append({"txn_id": t.txn_id, "error": str(e)})

    updated_txns = load_transactions()
    metrics = compute_system_metrics(updated_txns)
    return {
        "message": f"Processed {len(results)} transactions.",
        "processed_count": len(results),
        "results": results,
        "metrics": metrics
    }

@app.post("/api/demo/run")
def run_demo_simulation():
    """
    Section 24: Demo Mode executing TXN_TIMEOUT_SIM_001.
    Demonstrates 504 timeout failure injection, exponential backoff (1s, 2s),
    bounded limit exhaustion, fallback, and manual escalation.
    """
    demo_id = "TXN_TIMEOUT_SIM_001"
    txns = load_transactions()
    txn = next((t for t in txns if t.txn_id == demo_id), None)
    if not txn:
        # Reset data to regenerate demo transaction
        generate_synthetic_transactions(TXN_FILE_PATH)
        txns = load_transactions()
        txn = next((t for t in txns if t.txn_id == demo_id), None)

    # Process through full lifecycle
    res = process_single_transaction(demo_id)
    trace = get_transaction_agent_trace(demo_id)
    return {
        "demo_transaction_id": demo_id,
        "execution_result": res,
        "trace": trace
    }

@app.get("/api/transactions/{txn_id}/trace")
def get_transaction_agent_trace(txn_id: str):
    """
    Section 25: Returns full chronological agent trace for visual timeline rendering.
    """
    txns = load_transactions()
    txn = next((t for t in txns if t.txn_id == txn_id), None)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    audits = get_audit_trail_for_txn(txn_id)
    latest_audit = audits[-1] if audits else None

    # Step-by-step trace timeline
    timeline = []
    
    timeline.append({
        "step": 1,
        "title": "Payment Failure Detected",
        "status": "COMPLETED",
        "timestamp": txn.timestamp,
        "details": f"Transaction {txn.txn_id} failed with code '{txn.failure_code}' for ₹{txn.amount_paise / 100:,.2f}"
    })

    timeline.append({
        "step": 2,
        "title": "Root Cause Analysis",
        "status": "COMPLETED",
        "details": f"Diagnostic analysis on failure code: {txn.failure_code}"
    })

    if latest_audit:
        timeline.append({
            "step": 3,
            "title": "Gemini AI Recommendation",
            "status": "COMPLETED",
            "details": f"Recommended action: {latest_audit.ai_recommendation} (Confidence: {latest_audit.confidence * 100:.1f}%) - {latest_audit.reasoning}"
        })

        timeline.append({
            "step": 4,
            "title": "Confidence Check",
            "status": "PASSED" if latest_audit.confidence >= 0.80 else "ESCALATED",
            "details": f"Confidence score: {latest_audit.confidence:.2f} (Threshold: 0.80)"
        })

        timeline.append({
            "step": 5,
            "title": "Deterministic Policy Guardrails",
            "status": latest_audit.policy_decision,
            "details": f"Policy decision: {latest_audit.policy_decision}. Selected action: {latest_audit.action}"
        })

        timeline.append({
            "step": 6,
            "title": "Idempotency Check",
            "status": "PASSED",
            "details": f"Key verified: {latest_audit.idempotency_key}"
        })

        timeline.append({
            "step": 7,
            "title": "Pre-Execution Audit Record Created",
            "status": "COMPLETED",
            "details": f"Audit ID: {latest_audit.audit_id} registered before execution dispatch"
        })

        # Check API response
        resp = latest_audit.api_response or {}
        if resp.get("backoff_history"):
            for item in resp["backoff_history"]:
                timeline.append({
                    "step": len(timeline) + 1,
                    "title": f"Execution Attempt {item['attempt']} (504 Timeout)",
                    "status": "WARNING",
                    "details": f"Gateway Timeout encountered. Applied exponential backoff: {item['backoff_sec']}s"
                })

        timeline.append({
            "step": len(timeline) + 1,
            "title": "Recovery Outcome",
            "status": latest_audit.status,
            "details": resp.get("message", f"Execution finished with status {latest_audit.status}")
        })

        if latest_audit.status == ExecutionStatus.FALLBACK or latest_audit.action == RecoveryAction.MANUAL_REVIEW:
            timeline.append({
                "step": len(timeline) + 1,
                "title": "Human-in-the-Loop Escalation",
                "status": "ESCALATED",
                "details": "Transaction routed to manual review queue for human operator sign-off."
            })
    else:
        timeline.append({
            "step": 3,
            "title": "Awaiting Agent Evaluation",
            "status": "PENDING",
            "details": "Transaction not yet evaluated by AI agent."
        })

    return {
        "txn_id": txn.txn_id,
        "amount_paise": txn.amount_paise,
        "failure_code": txn.failure_code,
        "customer_tier": txn.customer_tier,
        "is_holdout": txn.is_holdout,
        "status": txn.status,
        "timeline": timeline,
        "audits": audits
    }

@app.get("/api/metrics")
def get_metrics():
    txns = load_transactions()
    return compute_system_metrics(txns)

@app.get("/api/evaluation")
def get_evaluation():
    eval_file = "evaluation_report.json"
    if os.path.exists(eval_file):
        try:
            with open(eval_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback to computing live metrics
    txns = load_transactions()
    return compute_system_metrics(txns)

@app.get("/api/logs")
def get_audit_logs(
    txn_id: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    policy_decision: Optional[str] = None
):
    logs = load_audit_logs()
    filtered = logs
    if txn_id:
        filtered = [r for r in filtered if r.get("txn_id") == txn_id]
    if action:
        filtered = [r for r in filtered if r.get("action") == action]
    if status:
        filtered = [r for r in filtered if r.get("status") == status]
    if policy_decision:
        filtered = [r for r in filtered if r.get("policy_decision") == policy_decision]
    return filtered

@app.get("/api/manual-review")
def get_manual_review_queue():
    """Returns transactions requiring human intervention."""
    txns = load_transactions()
    logs = load_audit_logs()
    
    manual_txns = []
    for t in txns:
        if t.status.upper() == "MANUAL_REVIEW" or t.action_taken == RecoveryAction.MANUAL_REVIEW:
            latest_audit = next((r for r in reversed(logs) if r.get("txn_id") == t.txn_id), None)
            manual_txns.append({
                "txn_id": t.txn_id,
                "amount_paise": t.amount_paise,
                "customer_id": t.customer_id,
                "customer_tier": t.customer_tier,
                "failure_code": t.failure_code,
                "reason": latest_audit.get("reasoning") if latest_audit else "Escalated by policy guardrail",
                "ai_recommendation": latest_audit.get("ai_recommendation") if latest_audit else "MANUAL_REVIEW",
                "confidence": latest_audit.get("confidence") if latest_audit else 0.0,
                "policy_decision": latest_audit.get("policy_decision") if latest_audit else "MANUAL_REVIEW",
                "timestamp": latest_audit.get("timestamp") if latest_audit else t.timestamp
            })
    return manual_txns

@app.post("/api/manual-review/{txn_id}/approve")
def approve_manual_review(txn_id: str, payload: ManualReviewActionRequest):
    """Audited manual approval of an escalated transaction."""
    txns = load_transactions()
    txn_idx = next((i for i, t in enumerate(txns) if t.txn_id == txn_id), None)
    if txn_idx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn = txns[txn_idx]
    action = payload.action or RecoveryAction.RETRY_PAYMENT

    # Idempotent pre-audit for human override
    idempotency_key = f"{txn.txn_id}:MANUAL_APPROVED:{action}"
    
    audit_rec = create_pre_execution_audit(
        txn=txn,
        recommendation=classify_failure(txn),
        policy_result=evaluate_policy_guardrails(txn, classify_failure(txn)),
        idempotency_key=idempotency_key,
        trigger="human_manual_approval"
    )
    
    # Simulate execution of human-approved action
    exec_res = execute_recovery_action(
        txn=txn,
        policy_result=evaluate_policy_guardrails(txn, classify_failure(txn)),
        pre_execution_audit=audit_rec
    )

    if exec_res["success"]:
        txn.status = "RECOVERED"
        txn.recovered_amount_paise = txn.amount_paise
    else:
        txn.status = "FAILED"
    txn.action_taken = action
    txns[txn_idx] = txn
    save_transactions(txns)

    return {"message": "Transaction manually approved and executed", "result": exec_res, "txn": txn}

@app.post("/api/manual-review/{txn_id}/reject")
def reject_manual_review(txn_id: str, payload: ManualReviewActionRequest):
    """Audited manual rejection of an escalated transaction."""
    txns = load_transactions()
    txn_idx = next((i for i, t in enumerate(txns) if t.txn_id == txn_id), None)
    if txn_idx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn = txns[txn_idx]
    idempotency_key = f"{txn.txn_id}:MANUAL_REJECTED"
    
    # Log manual rejection
    create_pre_execution_audit(
        txn=txn,
        recommendation=classify_failure(txn),
        policy_result=evaluate_policy_guardrails(txn, classify_failure(txn)),
        idempotency_key=idempotency_key,
        trigger="human_manual_rejection"
    )
    
    txn.status = "REJECTED_MANUAL"
    txn.action_taken = RecoveryAction.NO_ACTION
    txns[txn_idx] = txn
    save_transactions(txns)

    return {"message": "Transaction rejected by human operator", "txn": txn}
