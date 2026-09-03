import pytest
from backend.models import Transaction, AIRecommendation, PolicyCheckResult
from backend.config import RecoveryAction, PolicyDecision
from backend.audit import (
    create_pre_execution_audit,
    is_idempotency_key_present,
    load_audit_logs,
    save_audit_logs
)

def test_idempotency_key_generation_and_detection():
    txn_id = "TXN_IDEM_001"
    action = RecoveryAction.RETRY_PAYMENT
    idempotency_key = f"{txn_id}:{action}"

    # Initially key should not exist
    # (Clean any existing from prior runs for this specific key)
    logs = [r for r in load_audit_logs() if r.get("idempotency_key") != idempotency_key]
    save_audit_logs(logs)
    assert not is_idempotency_key_present(idempotency_key)

    txn = Transaction(
        txn_id=txn_id,
        customer_id="CUST_IDEM",
        amount_paise=29900,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    rec = AIRecommendation(
        cause="Network timeout",
        confidence=0.92,
        recommended_action=action,
        explanation="Transient error",
        message="Retrying"
    )
    policy_res = PolicyCheckResult(
        passed=True,
        decision=PolicyDecision.APPROVED,
        final_action=action,
        reason="Guardrails passed"
    )

    # First execution logs pre-audit
    create_pre_execution_audit(
        txn=txn,
        recommendation=rec,
        policy_result=policy_res,
        idempotency_key=idempotency_key
    )

    # Key now exists
    assert is_idempotency_key_present(idempotency_key)

    # A duplicate attempt with the same idempotency key must be detected
    duplicate_detected = is_idempotency_key_present(idempotency_key)
    assert duplicate_detected is True
