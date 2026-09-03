import pytest
from backend.models import Transaction, AIRecommendation
from backend.action_engine import evaluate_policy_guardrails
from backend.config import RecoveryAction, PolicyDecision

@pytest.fixture
def valid_recommendation():
    return AIRecommendation(
        cause="Network timeout",
        confidence=0.92,
        recommended_action=RecoveryAction.RETRY_PAYMENT,
        explanation="Transient network error suitable for retry",
        message="Retrying your payment."
    )

def test_holdout_protection(valid_recommendation):
    txn = Transaction(
        txn_id="TXN_HOLDOUT",
        customer_id="CUST_H",
        amount_paise=100000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=True,
        status="FAILED"
    )
    result = evaluate_policy_guardrails(txn, valid_recommendation)
    assert not result.passed
    assert result.decision == PolicyDecision.NO_ACTION
    assert result.final_action == RecoveryAction.NO_ACTION
    assert "holdout" in result.reason.lower()

def test_blocked_customer_guardrail(valid_recommendation):
    txn = Transaction(
        txn_id="TXN_BLOCKED",
        customer_id="CUST_B",
        amount_paise=100000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="blocked",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    result = evaluate_policy_guardrails(txn, valid_recommendation)
    assert not result.passed
    assert result.decision == PolicyDecision.MANUAL_REVIEW
    assert result.final_action == RecoveryAction.MANUAL_REVIEW
    assert "blocked" in result.reason.lower()

def test_high_value_transaction_guardrail(valid_recommendation):
    # ₹72,500 = 7250000 paise (exceeds ₹50,000 limit)
    txn = Transaction(
        txn_id="TXN_HIGHVAL",
        customer_id="CUST_VIP",
        amount_paise=7250000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="vip",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    result = evaluate_policy_guardrails(txn, valid_recommendation)
    assert not result.passed
    assert result.decision == PolicyDecision.MANUAL_REVIEW
    assert result.final_action == RecoveryAction.MANUAL_REVIEW
    assert "50,000" in result.reason

def test_confidence_threshold_guardrail():
    txn = Transaction(
        txn_id="TXN_LOW_CONF",
        customer_id="CUST_001",
        amount_paise=100000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    low_conf_rec = AIRecommendation(
        cause="Ambiguous failure",
        confidence=0.74,  # Below 0.80
        recommended_action=RecoveryAction.RETRY_PAYMENT,
        explanation="Low confidence diagnosis",
        message="Retry notice"
    )
    result = evaluate_policy_guardrails(txn, low_conf_rec)
    assert not result.passed
    assert result.decision == PolicyDecision.MANUAL_REVIEW
    assert result.final_action == RecoveryAction.MANUAL_REVIEW

def test_customer_retry_cap_guardrail(valid_recommendation):
    txn = Transaction(
        txn_id="TXN_RETRY_CAP",
        customer_id="CUST_RETRY",
        amount_paise=100000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=3,  # Already at max 3 retries
        is_holdout=False,
        status="FAILED"
    )
    result = evaluate_policy_guardrails(txn, valid_recommendation, customer_retries=3)
    assert not result.passed
    assert result.decision == PolicyDecision.MANUAL_REVIEW
    assert "retry cap" in result.reason.lower()

def test_customer_nudge_cap_guardrail():
    txn = Transaction(
        txn_id="TXN_NUDGE_CAP",
        customer_id="CUST_NUDGE",
        amount_paise=100000,
        failure_code="insufficient_funds",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    nudge_rec = AIRecommendation(
        cause="Insufficient funds",
        confidence=0.88,
        recommended_action=RecoveryAction.SEND_NUDGE,
        explanation="Nudge customer",
        message="Please retry"
    )
    result = evaluate_policy_guardrails(txn, nudge_rec, customer_nudges=2)
    assert not result.passed
    assert result.decision == PolicyDecision.MANUAL_REVIEW
    assert "nudge cap" in result.reason.lower()

def test_voucher_cap_guardrail():
    txn = Transaction(
        txn_id="TXN_VOUCHER_EXCEED",
        customer_id="CUST_V",
        amount_paise=100000,
        failure_code="insufficient_funds",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    voucher_rec = AIRecommendation(
        cause="Customer churn prevention",
        confidence=0.85,
        recommended_action=RecoveryAction.OFFER_VOUCHER,
        explanation="Offer voucher",
        message="Here is a voucher"
    )
    # Voucher amount ₹100 = 10000 paise (> ₹50 limit)
    result = evaluate_policy_guardrails(txn, voucher_rec, voucher_amount_paise=10000)
    assert not result.passed
    assert result.decision == PolicyDecision.REJECTED
    assert result.final_action == RecoveryAction.NO_ACTION

def test_already_successful_transaction(valid_recommendation):
    txn = Transaction(
        txn_id="TXN_ALREADY_SUCCESS",
        customer_id="CUST_OK",
        amount_paise=100000,
        failure_code="none",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="SUCCESS"
    )
    result = evaluate_policy_guardrails(txn, valid_recommendation)
    assert not result.passed
    assert result.decision == PolicyDecision.NO_ACTION
    assert "already successful" in result.reason.lower()
