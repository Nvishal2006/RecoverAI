import pytest
from backend.models import Transaction, AIRecommendation
from backend.classifier import classify_failure, get_deterministic_recommendation
from backend.config import RecoveryAction

def test_classifier_deterministic_rules():
    base_txn = {
        "txn_id": "TEST_001",
        "customer_id": "CUST_TEST",
        "amount_paise": 100000,
        "timestamp": "2026-09-03T10:00:00",
        "customer_tier": "standard",
        "retry_count": 0,
        "is_holdout": False,
        "status": "FAILED"
    }

    # network_error -> RETRY_PAYMENT
    t_net = Transaction(**{**base_txn, "failure_code": "network_error"})
    rec_net = get_deterministic_recommendation(t_net)
    assert rec_net.recommended_action == RecoveryAction.RETRY_PAYMENT
    assert rec_net.confidence >= 0.80

    # bank_timeout -> RETRY_PAYMENT
    t_bank = Transaction(**{**base_txn, "failure_code": "bank_timeout"})
    rec_bank = get_deterministic_recommendation(t_bank)
    assert rec_bank.recommended_action == RecoveryAction.RETRY_PAYMENT

    # insufficient_funds -> SEND_NUDGE
    t_funds = Transaction(**{**base_txn, "failure_code": "insufficient_funds"})
    rec_funds = get_deterministic_recommendation(t_funds)
    assert rec_funds.recommended_action == RecoveryAction.SEND_NUDGE

    # card_expired -> SEND_NUDGE
    t_card = Transaction(**{**base_txn, "failure_code": "card_expired"})
    rec_card = get_deterministic_recommendation(t_card)
    assert rec_card.recommended_action == RecoveryAction.SEND_NUDGE

    # 3ds_dropoff -> SEND_NUDGE
    t_3ds = Transaction(**{**base_txn, "failure_code": "3ds_dropoff"})
    rec_3ds = get_deterministic_recommendation(t_3ds)
    assert rec_3ds.recommended_action == RecoveryAction.SEND_NUDGE

    # mandate_failure -> SCHEDULE_MANDATE_RETRY
    t_mandate = Transaction(**{**base_txn, "failure_code": "mandate_failure"})
    rec_mandate = get_deterministic_recommendation(t_mandate)
    assert rec_mandate.recommended_action == RecoveryAction.SCHEDULE_MANDATE_RETRY

def test_classifier_advisory_only():
    """Verify Gemini / Classifier only produces advisory recommendation with no execution capability."""
    txn = Transaction(
        txn_id="TEST_ADV",
        customer_id="CUST_ADV",
        amount_paise=50000,
        failure_code="network_error",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    rec = classify_failure(txn)
    assert isinstance(rec, AIRecommendation)
    assert not hasattr(rec, "execute")
    assert not hasattr(rec, "mutate_payment")

def test_unclassified_failure_triggers_low_confidence():
    """Unknown failures should trigger low confidence & manual review."""
    txn = Transaction(
        txn_id="TEST_UNK",
        customer_id="CUST_UNK",
        amount_paise=50000,
        failure_code="mysterious_hardware_failure",
        timestamp="2026-09-03T10:00:00",
        customer_tier="standard",
        retry_count=0,
        is_holdout=False,
        status="FAILED"
    )
    rec = get_deterministic_recommendation(txn)
    assert rec.recommended_action == RecoveryAction.MANUAL_REVIEW
    assert rec.confidence < 0.80
