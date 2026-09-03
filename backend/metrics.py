from typing import Dict, Any, List
from backend.models import Transaction
from backend.audit import load_audit_logs
from backend.config import RecoveryAction, ExecutionStatus

def compute_system_metrics(txns: List[Transaction]) -> Dict[str, Any]:
    """
    Computes real-time system metrics based on current transactions and audit logs.
    Zero hardcoded values. Everything computed strictly from data.
    """
    logs = load_audit_logs()
    
    total_txns = len(txns)
    if total_txns == 0:
        return {}

    holdout_txns = [t for t in txns if t.is_holdout]
    non_holdout_txns = [t for t in txns if not t.is_holdout]
    
    total_revenue_at_risk_paise = sum(t.amount_paise for t in txns)
    
    # Check outcomes
    ai_recovered_txns = [t for t in non_holdout_txns if t.status.upper() in ["RECOVERED", "SUCCESS"]]
    ai_recovered_paise = sum(t.recovered_amount_paise or t.amount_paise for t in ai_recovered_txns)
    
    holdout_recovered_txns = [t for t in holdout_txns if t.status.upper() in ["RECOVERED", "SUCCESS"]]
    holdout_recovered_paise = sum(t.recovered_amount_paise or t.amount_paise for t in holdout_recovered_txns)
    
    actioned_txns = [t for t in non_holdout_txns if t.action_taken and t.action_taken != RecoveryAction.NO_ACTION]
    
    ai_recovery_rate = (len(ai_recovered_txns) / len(non_holdout_txns)) if non_holdout_txns else 0.0
    holdout_recovery_rate = (len(holdout_recovered_txns) / len(holdout_txns)) if holdout_txns else 0.0
    
    absolute_lift = ai_recovery_rate - holdout_recovery_rate
    relative_lift = (
        (absolute_lift / holdout_recovery_rate)
        if holdout_recovery_rate > 0
        else (ai_recovery_rate * 1.0)
    )
    
    incremental_revenue_paise = max(0, ai_recovered_paise - holdout_recovered_paise)
    
    # Calculate recovery cost from audit logs
    total_cost_paise = sum(rec.get("cost_paise", 0) for rec in logs)
    
    # Manual review count
    manual_review_count = sum(
        1 for t in txns if t.status.upper() == "MANUAL_REVIEW" or t.action_taken == RecoveryAction.MANUAL_REVIEW
    )
    
    # Policy Violations check:
    # Any holdout transaction actioned? Any blocked customer automatically retried?
    policy_violations = 0
    for rec in logs:
        # Check if holdout was executed
        txn_rec = next((t for t in txns if t.txn_id == rec.get("txn_id")), None)
        if txn_rec:
            if txn_rec.is_holdout and rec.get("status") in [ExecutionStatus.SUCCESS, ExecutionStatus.PENDING_EXECUTION]:
                if rec.get("action") not in [RecoveryAction.NO_ACTION, RecoveryAction.MANUAL_REVIEW]:
                    policy_violations += 1
            if txn_rec.customer_tier.lower() == "blocked" and rec.get("action") == RecoveryAction.RETRY_PAYMENT:
                policy_violations += 1
            if txn_rec.amount_paise > 5000000 and rec.get("policy_decision") == "APPROVED":
                policy_violations += 1

    # Audit coverage: ratio of actioned transactions having audit entries
    actioned_ids = {t.txn_id for t in non_holdout_txns if t.action_taken}
    audited_ids = {rec.get("txn_id") for rec in logs}
    audit_coverage = (
        len(actioned_ids.intersection(audited_ids)) / len(actioned_ids)
        if actioned_ids
        else 1.0
    )

    # Recovery Funnel
    diagnosed_count = sum(1 for t in txns if t.failure_code)
    actionable_count = len(non_holdout_txns)
    executed_count = sum(1 for rec in logs if rec.get("status") in [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED, ExecutionStatus.FALLBACK])
    
    recovery_funnel = {
        "failed": total_txns,
        "diagnosed": diagnosed_count,
        "actionable": actionable_count,
        "action_executed": executed_count,
        "recovered": len(ai_recovered_txns),
        "manual_review": manual_review_count
    }

    # Recovery by failure code
    failure_codes = sorted(list({t.failure_code for t in txns}))
    by_failure_code = []
    for code in failure_codes:
        code_txns = [t for t in non_holdout_txns if t.failure_code == code]
        code_recovered = [t for t in code_txns if t.status.upper() in ["RECOVERED", "SUCCESS"]]
        rec_rate = (len(code_recovered) / len(code_txns)) if code_txns else 0.0
        by_failure_code.append({
            "failure_code": code,
            "total": len(code_txns),
            "recovered": len(code_recovered),
            "recovery_rate": round(rec_rate, 3)
        })

    # Recovery by customer tier
    tiers = ["standard", "vip", "blocked"]
    by_customer_tier = []
    for tier in tiers:
        tier_txns = [t for t in non_holdout_txns if t.customer_tier.lower() == tier]
        tier_recovered = [t for t in tier_txns if t.status.upper() in ["RECOVERED", "SUCCESS"]]
        rec_rate = (len(tier_recovered) / len(tier_txns)) if tier_txns else 0.0
        by_customer_tier.append({
            "customer_tier": tier,
            "total": len(tier_txns),
            "recovered": len(tier_recovered),
            "recovery_rate": round(rec_rate, 3)
        })

    # Action distribution
    action_counts = {}
    for rec in logs:
        act = rec.get("action", "UNKNOWN")
        action_counts[act] = action_counts.get(act, 0) + 1
    action_distribution = [{"action": k, "count": v} for k, v in action_counts.items()]

    return {
        "total_transactions": total_txns,
        "holdout_transactions": len(holdout_txns),
        "actioned_transactions": len(actioned_txns),
        "total_revenue_at_risk_paise": total_revenue_at_risk_paise,
        "ai_recovered_revenue_paise": ai_recovered_paise,
        "holdout_recovered_revenue_paise": holdout_recovered_paise,
        "incremental_revenue_paise": incremental_revenue_paise,
        "ai_recovery_rate": round(ai_recovery_rate, 4),
        "holdout_recovery_rate": round(holdout_recovery_rate, 4),
        "absolute_lift": round(absolute_lift, 4),
        "relative_lift": round(relative_lift, 4),
        "cost_to_recover_paise": total_cost_paise,
        "manual_review_count": manual_review_count,
        "policy_violations": policy_violations,
        "audit_coverage": round(audit_coverage, 4),
        "recovery_funnel": recovery_funnel,
        "by_failure_code": by_failure_code,
        "by_customer_tier": by_customer_tier,
        "action_distribution": action_distribution
    }
