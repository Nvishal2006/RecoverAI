from typing import List, Optional
from backend.config import (
    MAX_AUTO_RETRIES_PER_CUSTOMER,
    MAX_NUDGES_PER_CUSTOMER,
    MAX_VOUCHER_AMOUNT_PAISE,
    HIGH_VALUE_THRESHOLD_PAISE,
    MIN_AI_CONFIDENCE,
    RecoveryAction,
    PolicyDecision
)
from backend.models import Transaction, AIRecommendation, PolicyCheckResult, PolicyCheckItem

def evaluate_policy_guardrails(
    txn: Transaction,
    recommendation: AIRecommendation,
    customer_retries: int = 0,
    customer_nudges: int = 0,
    voucher_amount_paise: int = 0
) -> PolicyCheckResult:
    """
    Deterministic Bounded Action Engine:
    The final authority on all recovery interventions.
    Gemini recommendations must strictly pass every deterministic check.
    """
    checks: List[PolicyCheckItem] = []
    
    # 1. Holdout Protection
    is_holdout = txn.is_holdout
    checks.append(PolicyCheckItem(
        name="Holdout Protection",
        passed=not is_holdout,
        details="Holdout control group member" if is_holdout else "Active treatment group member"
    ))
    if is_holdout:
        return PolicyCheckResult(
            passed=False,
            decision=PolicyDecision.NO_ACTION,
            final_action=RecoveryAction.NO_ACTION,
            reason="Transaction belongs to 20% holdout baseline group. Automated recovery strictly prohibited.",
            checks=checks
        )

    # 2. Already Successful / Recovered Check
    is_already_recovered = txn.status.upper() in ["SUCCESS", "RECOVERED"]
    checks.append(PolicyCheckItem(
        name="Status Check",
        passed=not is_already_recovered,
        details=f"Current status: {txn.status}"
    ))
    if is_already_recovered:
        return PolicyCheckResult(
            passed=False,
            decision=PolicyDecision.NO_ACTION,
            final_action=RecoveryAction.NO_ACTION,
            reason="Transaction is already successful or recovered. Further recovery action prohibited.",
            checks=checks
        )

    # 3. Blocked Customer Tier Check
    is_blocked = txn.customer_tier.lower() == "blocked"
    checks.append(PolicyCheckItem(
        name="Customer Tier Check",
        passed=not is_blocked,
        details=f"Customer tier: {txn.customer_tier}"
    ))
    if is_blocked:
        return PolicyCheckResult(
            passed=False,
            decision=PolicyDecision.MANUAL_REVIEW,
            final_action=RecoveryAction.MANUAL_REVIEW,
            reason="Customer is flagged as BLOCKED. Automated recovery prohibited; escalated to Fraud/Risk team.",
            checks=checks
        )

    # 4. High-Value Threshold Check
    is_high_value = txn.amount_paise > HIGH_VALUE_THRESHOLD_PAISE
    checks.append(PolicyCheckItem(
        name="High-Value Boundary Check",
        passed=not is_high_value,
        details=f"Amount: ₹{txn.amount_paise / 100:,.2f} (Limit: ₹{HIGH_VALUE_THRESHOLD_PAISE / 100:,.2f})"
    ))
    if is_high_value:
        return PolicyCheckResult(
            passed=False,
            decision=PolicyDecision.MANUAL_REVIEW,
            final_action=RecoveryAction.MANUAL_REVIEW,
            reason=f"Transaction value ₹{txn.amount_paise / 100:,.2f} exceeds ₹50,000 threshold. Manual approval required.",
            checks=checks
        )

    # 5. AI Confidence Threshold Check
    is_confidence_sufficient = recommendation.confidence >= MIN_AI_CONFIDENCE
    checks.append(PolicyCheckItem(
        name="Confidence Threshold Check",
        passed=is_confidence_sufficient,
        details=f"AI Confidence: {recommendation.confidence:.2f} (Required: {MIN_AI_CONFIDENCE:.2f})"
    ))
    if not is_confidence_sufficient:
        return PolicyCheckResult(
            passed=False,
            decision=PolicyDecision.MANUAL_REVIEW,
            final_action=RecoveryAction.MANUAL_REVIEW,
            reason=f"AI confidence ({recommendation.confidence:.2f}) below {MIN_AI_CONFIDENCE:.2f} threshold. Escalated to manual review.",
            checks=checks
        )

    # 6. Customer 24-Hour Retry Limit Check
    if recommendation.recommended_action == RecoveryAction.RETRY_PAYMENT:
        retry_exceeded = customer_retries >= MAX_AUTO_RETRIES_PER_CUSTOMER
        checks.append(PolicyCheckItem(
            name="Retry Cap Check",
            passed=not retry_exceeded,
            details=f"Customer retries: {customer_retries}/{MAX_AUTO_RETRIES_PER_CUSTOMER}"
        ))
        if retry_exceeded:
            return PolicyCheckResult(
                passed=False,
                decision=PolicyDecision.MANUAL_REVIEW,
                final_action=RecoveryAction.MANUAL_REVIEW,
                reason=f"Customer retry cap ({MAX_AUTO_RETRIES_PER_CUSTOMER} per 24h) reached. Escalated to manual review.",
                checks=checks
            )
    else:
        checks.append(PolicyCheckItem(
            name="Retry Cap Check",
            passed=True,
            details="Not a RETRY_PAYMENT action"
        ))

    # 7. Customer 24-Hour Nudge Limit Check
    if recommendation.recommended_action == RecoveryAction.SEND_NUDGE:
        nudge_exceeded = customer_nudges >= MAX_NUDGES_PER_CUSTOMER
        checks.append(PolicyCheckItem(
            name="Nudge Cap Check",
            passed=not nudge_exceeded,
            details=f"Customer nudges: {customer_nudges}/{MAX_NUDGES_PER_CUSTOMER}"
        ))
        if nudge_exceeded:
            return PolicyCheckResult(
                passed=False,
                decision=PolicyDecision.MANUAL_REVIEW,
                final_action=RecoveryAction.MANUAL_REVIEW,
                reason=f"Customer nudge cap ({MAX_NUDGES_PER_CUSTOMER} per 24h) reached. Escalated to manual review.",
                checks=checks
            )
    else:
        checks.append(PolicyCheckItem(
            name="Nudge Cap Check",
            passed=True,
            details="Not a SEND_NUDGE action"
        ))

    # 8. Voucher Limit Check
    if recommendation.recommended_action == RecoveryAction.OFFER_VOUCHER:
        voucher_exceeded = voucher_amount_paise > MAX_VOUCHER_AMOUNT_PAISE
        checks.append(PolicyCheckItem(
            name="Voucher Cap Check",
            passed=not voucher_exceeded,
            details=f"Voucher: ₹{voucher_amount_paise / 100:.2f} (Limit: ₹{MAX_VOUCHER_AMOUNT_PAISE / 100:.2f})"
        ))
        if voucher_exceeded:
            return PolicyCheckResult(
                passed=False,
                decision=PolicyDecision.REJECTED,
                final_action=RecoveryAction.NO_ACTION,
                reason=f"Voucher amount ₹{voucher_amount_paise / 100:.2f} exceeds ₹50 limit. Action rejected.",
                checks=checks
            )
    else:
        checks.append(PolicyCheckItem(
            name="Voucher Cap Check",
            passed=True,
            details="Not an OFFER_VOUCHER action"
        ))

    # All checks passed!
    return PolicyCheckResult(
        passed=True,
        decision=PolicyDecision.APPROVED,
        final_action=recommendation.recommended_action,
        reason="All deterministic safety guardrails passed.",
        checks=checks
    )
