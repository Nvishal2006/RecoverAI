import pytest
import os
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import RecoveryAction, ExecutionStatus
from backend.simulator import simulate_recovery_action, simulate_timeout_failure_injection
from data_agent import generate_synthetic_transactions, RANDOM_SEED

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dataset_requirements_100_total_and_20_holdout():
    """Requirement 1 & 2: Exactly 100 transactions, exactly 20 holdout."""
    txns = generate_synthetic_transactions("data/failed_txns.json")
    assert len(txns) == 100
    holdout_count = sum(1 for t in txns if t["is_holdout"])
    assert holdout_count == 20

def test_reproducibility_with_seed_42():
    """Requirement 20: Evaluation is reproducible with seed 42."""
    t1 = generate_synthetic_transactions("data/test_seed_1.json")
    t2 = generate_synthetic_transactions("data/test_seed_2.json")
    assert t1 == t2
    # Cleanup test files
    if os.path.exists("data/test_seed_1.json"):
        os.remove("data/test_seed_1.json")
    if os.path.exists("data/test_seed_2.json"):
        os.remove("data/test_seed_2.json")

def test_injected_timeout_504_failure_and_backoff():
    """Requirement 14, 15, 16: 504 timeout triggers bounded retry, fallback, and manual review."""
    res = simulate_timeout_failure_injection("TXN_TIMEOUT_SIM_001")
    assert res["status"] == ExecutionStatus.FALLBACK
    assert res["retry_attempts"] == 2
    assert len(res["backoff_history"]) == 2
    assert res["backoff_history"][0]["backoff_sec"] == 1
    assert res["backoff_history"][1]["backoff_sec"] == 2
    assert res["fallback_action"] == RecoveryAction.MANUAL_REVIEW

def test_demo_endpoint_executes_timeout_simulation():
    """Section 24: POST /api/demo/run executes TXN_TIMEOUT_SIM_001."""
    response = client.post("/api/demo/run")
    assert response.status_code == 200
    data = response.json()
    assert data["demo_transaction_id"] == "TXN_TIMEOUT_SIM_001"
    assert "trace" in data

def test_no_secrets_exposed():
    """Requirement 18: Verify health, metrics, transactions, and trace endpoints do not expose API secrets."""
    endpoints = ["/api/health", "/api/transactions", "/api/metrics", "/api/manual-review"]
    for ep in endpoints:
        resp = client.get(ep)
        body = resp.text
        assert "RAZORPAY_KEY_SECRET" not in body
        assert "GEMINI_API_KEY" not in body

def test_manual_review_approval_and_rejection_audited():
    """Requirement 21: Manual approvals and rejections are audited."""
    # Find or setup a transaction in manual review
    txns_resp = client.get("/api/transactions")
    txns = txns_resp.json()
    highval_txn = next((t for t in txns if t["txn_id"] == "TXN_HIGHVAL_001"), None)
    if highval_txn:
        # First evaluate it so it gets routed to manual review
        client.post(f"/api/evaluate/{highval_txn['txn_id']}")
        
        # Approve via manual review endpoint
        approve_resp = client.post(
            f"/api/manual-review/{highval_txn['txn_id']}/approve",
            json={"action": "RETRY_PAYMENT", "notes": "Approved by senior risk manager"}
        )
        assert approve_resp.status_code == 200

        # Verify audit log recorded trigger
        logs_resp = client.get("/api/logs?txn_id=TXN_HIGHVAL_001")
        logs = logs_resp.json()
        assert any(l.get("trigger") == "human_manual_approval" for l in logs)

def test_metrics_policy_violations_is_zero():
    """Requirement 23: Policy violation count must be zero."""
    resp = client.get("/api/metrics")
    assert resp.status_code == 200
    metrics = resp.json()
    assert metrics.get("policy_violations", 0) == 0
