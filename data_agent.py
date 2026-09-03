import json
import random
import os
from datetime import datetime, timedelta

RANDOM_SEED = 42

FAILURE_CODES = [
    "network_error",
    "bank_timeout",
    "insufficient_funds",
    "card_expired",
    "3ds_dropoff",
    "mandate_failure"
]

CUSTOMER_TIERS = ["standard", "vip", "blocked"]
TIER_WEIGHTS = [0.70, 0.20, 0.10]

def generate_synthetic_transactions(output_path: str = "data/failed_txns.json"):
    random.seed(RANDOM_SEED)
    
    # 50 unique customers to ensure some customers have multiple transactions
    customer_pool = [f"CUST_{i:03d}" for i in range(1, 51)]
    customer_tiers = {cust: random.choices(CUSTOMER_TIERS, weights=TIER_WEIGHTS)[0] for cust in customer_pool}
    
    # Ensure a few specific customers have known tiers for test consistency
    customer_tiers["CUST_BLOCKED_01"] = "blocked"
    customer_tiers["CUST_VIP_01"] = "vip"
    customer_tiers["CUST_VIP_02"] = "vip"
    customer_tiers["CUST_MULTI_01"] = "standard"  # Customer with frequent transactions to test caps
    
    base_time = datetime(2026, 9, 3, 10, 0, 0)
    txns = []
    
    # Stratified distribution setup: 100 transactions total
    # We will stratify holdout selection: 20 out of 100 (exactly 20%)
    for i in range(100):
        txn_num = i + 1
        
        # Injected timeout transaction at index 0 for predictable demo & test execution
        if i == 0:
            txn = {
                "txn_id": "TXN_TIMEOUT_SIM_001",
                "customer_id": "CUST_VIP_01",
                "amount_paise": 499900,  # ₹4,999
                "failure_code": "network_error",
                "timestamp": base_time.isoformat(),
                "customer_tier": "vip",
                "retry_count": 0,
                "is_holdout": False,
                "status": "FAILED"
            }
            txns.append(txn)
            continue
            
        # High value test transaction (> ₹50,000 / > 5000000 paise) at index 1
        if i == 1:
            txn = {
                "txn_id": "TXN_HIGHVAL_001",
                "customer_id": "CUST_VIP_02",
                "amount_paise": 7250000,  # ₹72,500
                "failure_code": "bank_timeout",
                "timestamp": (base_time + timedelta(minutes=5)).isoformat(),
                "customer_tier": "vip",
                "retry_count": 0,
                "is_holdout": False,
                "status": "FAILED"
            }
            txns.append(txn)
            continue
            
        # Blocked customer transaction at index 2
        if i == 2:
            txn = {
                "txn_id": "TXN_BLOCKED_001",
                "customer_id": "CUST_BLOCKED_01",
                "amount_paise": 250000,  # ₹2,500
                "failure_code": "insufficient_funds",
                "timestamp": (base_time + timedelta(minutes=10)).isoformat(),
                "customer_tier": "blocked",
                "retry_count": 0,
                "is_holdout": False,
                "status": "FAILED"
            }
            txns.append(txn)
            continue
            
        # Multi-transaction customer to test retry/nudge limits (indices 3, 4, 5, 6)
        if 3 <= i <= 6:
            cust_id = "CUST_MULTI_01"
            f_code = "network_error" if i in [3, 4, 5] else "insufficient_funds"
            amt_paise = 150000  # ₹1,500
            retry_cnt = i - 3
            txn = {
                "txn_id": f"TXN_{txn_num:04d}",
                "customer_id": cust_id,
                "amount_paise": amt_paise,
                "failure_code": f_code,
                "timestamp": (base_time + timedelta(minutes=15 * (i - 2))).isoformat(),
                "customer_tier": customer_tiers[cust_id],
                "retry_count": retry_cnt,
                "is_holdout": False,
                "status": "FAILED"
            }
            txns.append(txn)
            continue
            
        # General synthetic generation
        txn_id = f"TXN_{txn_num:04d}"
        cust_id = random.choice(customer_pool)
        failure_code = random.choice(FAILURE_CODES)
        # Amounts from ₹299 to ₹14,999 in integer paise
        amount_rupees = random.choice([299, 499, 999, 1499, 2499, 3999, 4999, 7999, 9999, 12999])
        amount_paise = amount_rupees * 100
        
        # Timestamp spread within last 48 hours
        time_offset = timedelta(hours=random.uniform(0, 48))
        txn_time = (base_time - time_offset).isoformat()
        
        retry_count = random.choice([0, 0, 0, 1, 2])
        
        txn = {
            "txn_id": txn_id,
            "customer_id": cust_id,
            "amount_paise": amount_paise,
            "failure_code": failure_code,
            "timestamp": txn_time,
            "customer_tier": customer_tiers[cust_id],
            "retry_count": retry_count,
            "is_holdout": False,  # assigned below via stratified sampling
            "status": "FAILED"
        }
        txns.append(txn)
    
    # Stratified holdout selection for exactly 20 holdout transactions (20% of 100)
    # Ensure injected test cases (indices 0..6) are not holdout
    eligible_indices = list(range(7, 100))
    random.seed(RANDOM_SEED)
    
    # Group eligible indices by failure code for stratified selection
    by_failure = {}
    for idx in eligible_indices:
        code = txns[idx]["failure_code"]
        by_failure.setdefault(code, []).append(idx)
        
    holdout_indices = []
    # Pick proportionally from each failure code
    for code, indices in by_failure.items():
        # ~3-4 from each category to total 20
        sample_size = max(1, round(len(indices) / len(eligible_indices) * 20))
        sampled = random.sample(indices, min(sample_size, len(indices)))
        holdout_indices.extend(sampled)
        
    # Adjust to exactly 20 holdouts
    if len(holdout_indices) > 20:
        holdout_indices = holdout_indices[:20]
    elif len(holdout_indices) < 20:
        remaining = [i for i in eligible_indices if i not in holdout_indices]
        holdout_indices.extend(random.sample(remaining, 20 - len(holdout_indices)))
        
    for idx in holdout_indices:
        txns[idx]["is_holdout"] = True
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(txns, f, indent=2)
        
    print(f"Generated {len(txns)} transactions in {output_path}")
    print(f"Holdout count: {sum(1 for t in txns if t['is_holdout'])} (Target: 20)")
    return txns

if __name__ == "__main__":
    generate_synthetic_transactions()
