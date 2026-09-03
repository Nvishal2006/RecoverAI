import pytest
import os
import json
from backend.models import Transaction, AIRecommendation, PolicyCheckResult
from backend.config import RecoveryAction, ExecutionStatus, PolicyDecision
from backend.audit import (
    create_pre_execution_audit,
    update_audit_execution,
    load_audit_logs,
    save_audit_logs,
    AUDIT_FILE_PATH
)

def test_pre_execution_audit_creation():
    # Setup test transaction and decision
    txn = Transaction(
        txn_id="TXN_AUDIT_TEST",
        customer_id="CUST_AUDIT",
        amount_paise=499900,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    rec = AIRecommendation(
        cause="Network timeout",
        confidence=0.94,
        recommended_action=RecoveryAction.RETRY_PAYMENT,
        explanation="Transient error",
        message="Retrying..."
    )
    policy_res = PolicyCheckResult(
        passed=True,
        decision=PolicyDecision.APPROVED,
        final_action=RecoveryAction.RETRY_PAYMENT,
        reason="Passed all guardrails"
    )
    idempotency_key = f"{txn.txn_id}:{policy_res.final_action}"

    initial_log_count = len(load_audit_logs())

    # Pre-execution audit created BEFORE any execution
    audit_rec = create_pre_execution_audit(
        txn=txn,
        recommendation=rec,
        policy_result=policy_res,
        idempotency_key=idempotency_key
    )

    # Verify status is strictly PENDING_EXECUTION
    assert audit_rec.status == ExecutionStatus.PENDING_EXECUTION
    assert audit_rec.txn_id == "TXN_AUDIT_TEST"
    assert audit_rec.idempotency_key == idempotency_key

    # Verify persisted in file immediately
    logs = load_audit_logs()
    assert len(logs) == initial_log_count + 1
    persisted = next((r for r in logs if r["audit_id"] == audit_rec.audit_id), None)
    assert persisted is not None
    assert persisted["status"] == ExecutionStatus.PENDING_EXECUTION

    # Simulate post-execution update
    updated = update_audit_execution(
        audit_id=audit_rec.audit_id,
        status=ExecutionStatus.SUCCESS,
        execution_id="EXEC_TEST_123",
        api_response={"result": "recovered"},
        cost_paise=0
    )
    assert updated is not None
    assert updated.status == ExecutionStatus.SUCCESS

    # Verify record was modified in-place and not deleted
    final_logs = load_audit_logs()
    assert len(final_logs) == initial_log_count + 1
