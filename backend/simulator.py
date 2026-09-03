import random
import time
import hashlib
from typing import Dict, Any, Tuple
from backend.config import RecoveryAction, ExecutionStatus, RANDOM_SEED

# Deterministic base recovery probabilities given appropriate action
RECOVERY_PROBABILITIES = {
    ("network_error", RecoveryAction.RETRY_PAYMENT): 0.88,
    ("bank_timeout", RecoveryAction.RETRY_PAYMENT): 0.82,
    ("insufficient_funds", RecoveryAction.SEND_NUDGE): 0.62,
    ("card_expired", RecoveryAction.SEND_NUDGE): 0.65,
    ("3ds_dropoff", RecoveryAction.SEND_NUDGE): 0.76,
    ("mandate_failure", RecoveryAction.SCHEDULE_MANDATE_RETRY): 0.70,
}

def get_deterministic_float(seed_str: str) -> float:
    """Generates a deterministic float [0, 1) based on a string hash."""
    hasher = hashlib.sha256(f"{RANDOM_SEED}_{seed_str}".encode("utf-8"))
    hex_digest = hasher.hexdigest()
    # Convert first 8 hex characters to integer and normalize
    int_val = int(hex_digest[:8], 16)
    return int_val / 0xFFFFFFFF

def simulate_recovery_action(
    txn_id: str,
    failure_code: str,
    action: str,
    customer_tier: str = "standard",
    retry_count: int = 0
) -> Dict[str, Any]:
    """
    Deterministic payment recovery simulation.
    Yields reproducible payment outcomes based on action suitability, customer tier, and failure code.
    All outputs explicitly labeled as SIMULATED.
    """
    # Special Injected Failure Case: TXN_TIMEOUT_SIM_001
    if txn_id == "TXN_TIMEOUT_SIM_001":
        return simulate_timeout_failure_injection(txn_id)

    # If action is NO_ACTION or MANUAL_REVIEW, no automated execution occurs
    if action in [RecoveryAction.NO_ACTION, RecoveryAction.MANUAL_REVIEW]:
        return {
            "success": False,
            "status": ExecutionStatus.SKIPPED if action == RecoveryAction.NO_ACTION else ExecutionStatus.FALLBACK,
            "message": f"Action {action} requires no immediate automated execution",
            "execution_mode": "SIMULATED_RECOVERY_OPERATION",
            "is_simulated": True,
            "retry_attempts": 0,
            "latency_ms": 10
        }

    # Base probability calculation
    base_prob = RECOVERY_PROBABILITIES.get((failure_code, action), 0.15)
    
    # VIP tier bonus (+5%), repeated retry penalty (-10% per prior retry)
    tier_bonus = 0.05 if customer_tier.lower() == "vip" else 0.0
    retry_penalty = min(0.20, retry_count * 0.10)
    adjusted_prob = max(0.05, min(0.95, base_prob + tier_bonus - retry_penalty))
    
    # Deterministic roll based on txn_id and action
    roll = get_deterministic_float(f"{txn_id}:{action}:{retry_count}")
    success = roll < adjusted_prob
    
    status = ExecutionStatus.SUCCESS if success else ExecutionStatus.FAILED
    message = (
        f"Simulated {action} completed successfully"
        if success
        else f"Simulated {action} failed to recover payment"
    )

    return {
        "success": success,
        "status": status,
        "message": message,
        "execution_mode": "SIMULATED_RECOVERY_OPERATION",
        "is_simulated": True,
        "probability_score": round(adjusted_prob, 3),
        "roll_value": round(roll, 3),
        "retry_attempts": 1,
        "latency_ms": 120
    }

def simulate_timeout_failure_injection(txn_id: str) -> Dict[str, Any]:
    """
    Section 20 & 21: Failure Injection for TXN_TIMEOUT_SIM_001.
    Simulates:
      Attempt 1: 504 Gateway Timeout -> backoff 1s
      Attempt 2: 504 Gateway Timeout -> backoff 2s
      Bounded limit reached -> FALLBACK -> MANUAL_REVIEW
    """
    history = [
        {"attempt": 1, "status_code": 504, "error": "Gateway Timeout", "backoff_sec": 1},
        {"attempt": 2, "status_code": 504, "error": "Gateway Timeout", "backoff_sec": 2}
    ]
    
    return {
        "success": False,
        "status": ExecutionStatus.FALLBACK,
        "message": "Gateway Timeout 504 encountered across 2 bounded retry attempts with exponential backoff (1s, 2s). Bounded limit reached. Fallback to manual review.",
        "execution_mode": "SIMULATED_RECOVERY_OPERATION",
        "is_simulated": True,
        "retry_attempts": 2,
        "backoff_history": history,
        "fallback_action": RecoveryAction.MANUAL_REVIEW,
        "latency_ms": 3000
    }
