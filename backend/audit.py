import json
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from backend.models import AuditRecord, Transaction, AIRecommendation, PolicyCheckResult
from backend.config import ExecutionStatus, RecoveryAction

AUDIT_FILE_PATH = os.path.join("data", "recovery_logs.json")

def load_audit_logs() -> List[Dict[str, Any]]:
    """Loads all records from the persistent audit file."""
    if not os.path.exists(AUDIT_FILE_PATH):
        return []
    try:
        with open(AUDIT_FILE_PATH, "r") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []

def save_audit_logs(logs: List[Dict[str, Any]]) -> None:
    """Appends/persists records to the audit file."""
    os.makedirs(os.path.dirname(AUDIT_FILE_PATH), exist_ok=True)
    with open(AUDIT_FILE_PATH, "w") as f:
        json.dump(logs, f, indent=2)

def is_idempotency_key_present(idempotency_key: str) -> bool:
    """Checks if an idempotency key already exists in the audit trail."""
    logs = load_audit_logs()
    return any(rec.get("idempotency_key") == idempotency_key for rec in logs)

def get_customer_activity_counts(customer_id: str, txns: List[Transaction]) -> Tuple[int, int]:
    """
    Returns (retries_count, nudges_count) for a given customer within the active window.
    Evaluates across audit logs and current transaction retry counts.
    """
    logs = load_audit_logs()
    # Find transactions associated with this customer
    cust_txn_ids = {t.txn_id for t in txns if t.customer_id == customer_id}
    
    retries = 0
    nudges = 0
    for rec in logs:
        if rec.get("txn_id") in cust_txn_ids:
            act = rec.get("action")
            if act == RecoveryAction.RETRY_PAYMENT:
                retries += 1
            elif act == RecoveryAction.SEND_NUDGE:
                nudges += 1
                
    # Also incorporate existing prior retry count from transactions
    for t in txns:
        if t.customer_id == customer_id:
            retries = max(retries, t.retry_count)
            
    return retries, nudges

def create_pre_execution_audit(
    txn: Transaction,
    recommendation: AIRecommendation,
    policy_result: PolicyCheckResult,
    idempotency_key: str,
    trigger: str = "payment_failure"
) -> AuditRecord:
    """
    MANDATORY PRE-EXECUTION AUDIT STEP:
    Logs the intent to execute BEFORE any external API call or simulator call.
    Status starts strictly as PENDING_EXECUTION (or SKIPPED if policy decision is NO_ACTION).
    """
    status = ExecutionStatus.PENDING_EXECUTION
    if policy_result.final_action == RecoveryAction.NO_ACTION:
        status = ExecutionStatus.SKIPPED
    elif policy_result.final_action == RecoveryAction.MANUAL_REVIEW:
        status = ExecutionStatus.FALLBACK

    audit_id = f"AUD_{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    record = AuditRecord(
        audit_id=audit_id,
        txn_id=txn.txn_id,
        trigger=trigger,
        failure_code=txn.failure_code,
        ai_recommendation=recommendation.recommended_action,
        confidence=recommendation.confidence,
        reasoning=recommendation.explanation,
        policy_decision=policy_result.decision,
        action=policy_result.final_action,
        amount_paise=txn.amount_paise,
        cost_paise=0,
        status=status,
        idempotency_key=idempotency_key,
        execution_id=None,
        execution_attempt=0,
        api_response=None,
        retry_attempts=0,
        fallback_action=None,
        timestamp=timestamp
    )

    logs = load_audit_logs()
    logs.append(record.model_dump())
    save_audit_logs(logs)
    return record

def update_audit_execution(
    audit_id: str,
    status: str,
    execution_id: str,
    api_response: Dict[str, Any],
    cost_paise: int = 0,
    retry_attempts: int = 0,
    fallback_action: Optional[str] = None
) -> Optional[AuditRecord]:
    """
    Updates the audit record post-execution with the real outcome.
    Audit records are never deleted.
    """
    logs = load_audit_logs()
    updated_record = None
    for rec in logs:
        if rec.get("audit_id") == audit_id:
            rec["status"] = status
            rec["execution_id"] = execution_id
            rec["api_response"] = api_response
            rec["cost_paise"] = cost_paise
            rec["retry_attempts"] = retry_attempts
            rec["fallback_action"] = fallback_action
            updated_record = AuditRecord(**rec)
            break
            
    if updated_record:
        save_audit_logs(logs)
    return updated_record

def get_audit_trail_for_txn(txn_id: str) -> List[AuditRecord]:
    """Retrieves all historical audit records for a transaction."""
    logs = load_audit_logs()
    return [AuditRecord(**rec) for rec in logs if rec.get("txn_id") == txn_id]
