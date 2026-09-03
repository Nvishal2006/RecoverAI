# RecoverAI System Evaluation & Benchmark Report

## 1. Executive Summary

| Metric | Rule-Only Baseline | RecoverAI Agent | Holdout (Control) |
| :--- | :--- | :--- | :--- |
| **Total Transactions** | 80 | 80 | 20 |
| **Recovery Rate** | 66.2% | **58.8%** | 0.0% |
| **Revenue Recovered** | ₹294,652.00 | **₹195,156.00** | ₹0.00 |
| **Incremental Lift (vs Control)** | — | **+58.8%** (Abs) | Baseline |
| **Incremental Revenue (vs Control)** | — | **₹195,156.00** | ₹0.00 |
| **Policy Guardrail Violations** | 4 | **0** | 0 |
| **Audit Coverage** | N/A | **100.0%** | 100% |
| **Manual Review Escalations** | 0 | **9 (9.0%)** | 0 |
| **Cost to Recover** | ₹17.00 | **₹15.00** | ₹0.00 |

---

## 2. Quantitative Findings

- **Total Revenue at Risk**: ₹510,406.00 across 100 transactions.
- **AI Recovered Revenue**: ₹195,156.00 with zero policy violations.
- **Holdout Baseline (20%)**: Exactly 20 holdout transactions protected from automated intervention to measure true causal lift.
- **Net Incremental Lift**: +58.8% absolute lift over the holdout baseline.

---

## 3. False-Positive Nudge Rate Methodology

### Definition & Ground Truth
A **False-Positive Nudge** occurs when an automated nudge (SMS/WhatsApp/Email) is dispatched to a customer for a failure type that is unsuitable for customer-side intervention.
- **Appropriate Nudge Triggers (Ground Truth True Positives)**:
  - `insufficient_funds`: Customer can fund account or use alternate payment method.
  - `card_expired`: Customer can update card expiry or add new card.
  - `3ds_dropoff`: Customer can complete abandoned authentication challenge.
- **Inappropriate Nudge Triggers (False Positives)**:
  - `network_error`: Transient system failure; customer cannot resolve this on their device. Should be auto-retried.
  - `bank_timeout`: Bank gateway timeout; nudging customer creates annoyance. Should be auto-retried with exponential backoff.
  - `mandate_failure`: Recurring subscription settlement; requires clearing cycle retry rather than manual checkout nudge.

### Calculation
$$\text{False Positive Nudge Rate} = \frac{\text{False Positive Nudges}}{\text{Total Nudges Sent}} = \frac{0}{30} = 0.0\%$$

The RecoverAI Bounded Action Engine achieved **0.0% False Positive Nudge Rate**, preventing spam and customer friction.

---

## 4. Policy Guardrail & Safety Compliance

| Guardrail | Status | Violations |
| :--- | :--- | :--- |
| **Holdout Baseline Protection (20%)** | ENFORCED | 0 |
| **Blocked Customer Protection** | ENFORCED | 0 |
| **Customer 24h Retry Cap (Max 3)** | ENFORCED | 0 |
| **Customer 24h Nudge Cap (Max 2)** | ENFORCED | 0 |
| **High Value Boundary (>₹50,000)** | ENFORCED | 0 |
| **Confidence Threshold (>= 0.80)** | ENFORCED | 0 |
| **Pre-Execution Audit Enforcement** | ENFORCED | 0 |
| **Idempotency Verification** | ENFORCED | 0 |

---

*Generated automatically by `evaluate.py` using seed 42.*
