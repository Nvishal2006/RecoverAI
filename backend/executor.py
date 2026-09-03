import uuid
import logging
from typing import Dict, Any, Optional
from backend.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RecoveryAction, ExecutionStatus
from backend.models import Transaction, PolicyCheckResult, AuditRecord
from backend.simulator import simulate_recovery_action
from backend.audit import update_audit_execution

logger = logging.getLogger("recoverai.executor")

def execute_recovery_action(
    txn: Transaction,
    policy_result: PolicyCheckResult,
    pre_execution_audit: AuditRecord
) -> Dict[str, Any]:
    """
    Recovery Executor:
    Dispatches approved actions to either Razorpay Test Mode (where supported)
    or the Deterministic Recovery Simulator (for unsupported operations / simulations).
    Strictly updates the pre-execution audit record post-execution.
    """
    action = policy_result.final_action
    execution_id = f"EXEC_{uuid.uuid4().hex[:10].upper()}"

    # If action is NO_ACTION or MANUAL_REVIEW, update audit and return early
    if action == RecoveryAction.NO_ACTION:
        update_audit_execution(
            audit_id=pre_execution_audit.audit_id,
            status=ExecutionStatus.SKIPPED,
            execution_id=execution_id,
            api_response={"detail": "Action marked NO_ACTION by policy engine."},
            cost_paise=0,
            retry_attempts=0
        )
        return {
            "execution_id": execution_id,
            "status": ExecutionStatus.SKIPPED,
            "success": False,
            "recovered_amount_paise": 0,
            "execution_mode": "NO_ACTION_ENFORCED",
            "message": "No action executed per policy guardrail."
        }

    if action == RecoveryAction.MANUAL_REVIEW:
        update_audit_execution(
            audit_id=pre_execution_audit.audit_id,
            status=ExecutionStatus.FALLBACK,
            execution_id=execution_id,
            api_response={"detail": "Escalated to human-in-the-loop manual review."},
            cost_paise=0,
            retry_attempts=0,
            fallback_action=RecoveryAction.MANUAL_REVIEW
        )
        return {
            "execution_id": execution_id,
            "status": ExecutionStatus.FALLBACK,
            "success": False,
            "recovered_amount_paise": 0,
            "execution_mode": "MANUAL_REVIEW_ESCALATION",
            "message": "Escalated to human-in-the-loop manual review queue."
        }

    # Attempt Razorpay Test Mode payment link for nudges if credentials are provided
    if action == RecoveryAction.SEND_NUDGE and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        try:
            import razorpay
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            # Test mode payment link creation
            link_data = {
                "amount": txn.amount_paise,
                "currency": "INR",
                "accept_partial": False,
                "description": f"RecoverAI Payment Link for {txn.txn_id}",
                "customer": {
                    "name": txn.customer_id,
                    "contact": "+919876543210"
                },
                "notify": {"sms": False, "email": False},
                "reminder_enable": True
            }
            rzp_response = client.payment_link.create(link_data)
            logger.info(f"Razorpay Test Mode link created: {rzp_response.get('id')}")
            
            # Label clearly as Razorpay Test Mode Operation
            sim_result = simulate_recovery_action(
                txn_id=txn.txn_id,
                failure_code=txn.failure_code,
                action=action,
                customer_tier=txn.customer_tier,
                retry_count=txn.retry_count
            )
            sim_result["execution_mode"] = "RAZORPAY_TEST_MODE_OPERATION"
            sim_result["razorpay_link_id"] = rzp_response.get("id")
        except Exception as exc:
            logger.warning(f"Razorpay Test Mode call failed or skipped ({exc}). Falling back to simulator.")
            sim_result = simulate_recovery_action(
                txn_id=txn.txn_id,
                failure_code=txn.failure_code,
                action=action,
                customer_tier=txn.customer_tier,
                retry_count=txn.retry_count
            )
    else:
        # Route to Recovery Simulator (clearly labeled)
        sim_result = simulate_recovery_action(
            txn_id=txn.txn_id,
            failure_code=txn.failure_code,
            action=action,
            customer_tier=txn.customer_tier,
            retry_count=txn.retry_count
        )

    # Calculate execution cost in paise (e.g. ₹0.50 per SMS nudge = 50 paise, ₹0 for retry)
    cost_paise = 50 if action == RecoveryAction.SEND_NUDGE else 0
    if action == RecoveryAction.OFFER_VOUCHER:
        cost_paise = 5000  # ₹50 voucher

    recovered_paise = txn.amount_paise if sim_result["success"] else 0

    # Mandatory update to pre-execution audit record
    update_audit_execution(
        audit_id=pre_execution_audit.audit_id,
        status=sim_result["status"],
        execution_id=execution_id,
        api_response=sim_result,
        cost_paise=cost_paise,
        retry_attempts=sim_result.get("retry_attempts", 1),
        fallback_action=sim_result.get("fallback_action")
    )

    return {
        "execution_id": execution_id,
        "status": sim_result["status"],
        "success": sim_result["success"],
        "recovered_amount_paise": recovered_paise,
        "execution_mode": sim_result["execution_mode"],
        "message": sim_result["message"],
        "cost_paise": cost_paise,
        "details": sim_result
    }
