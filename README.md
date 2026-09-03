# RecoverAI — Autonomous Revenue Recovery Agent

> **Fintech Simulation Disclosure**: This project demonstrates bounded autonomous revenue recovery using synthetic transactions. Razorpay Test Mode is utilized where supported (e.g. Test Mode payment links); unsupported recovery operations are managed through a deterministic, reproducible recovery simulator. Simulated revenue recovery must not be interpreted as real production Razorpay payment recovery.

---

## 1. Overview
**RecoverAI** is a bounded autonomous AI revenue-recovery agent engineered specifically for failed payment workflows (e.g., Razorpay checkout drop-offs, mandate declines, and bank timeouts). 

The system couples **Google Gemini** diagnostic reasoning with an **authoritative deterministic policy engine** and an **immutable pre-execution audit ledger**. It ensures that no recovery action is executed without strict guardrails, idempotency verification, and causal holdout protection.

```
Payment Failure
      ↓
Revenue-at-Risk Detection
      ↓
Root Cause Diagnosis
      ↓
Gemini + Deterministic Recommendation
      ↓
Confidence Check (≥ 0.80)
      ↓
Deterministic Policy / Guardrail Engine
      ↓
Idempotency Verification (txn_id + ":" + action)
      ↓
MANDATORY PRE-EXECUTION AUDIT (PENDING_EXECUTION)
      ↓
Recovery Execution (Razorpay Test Mode / Simulator)
      ↓
Outcome Observation (SUCCESS / FAILED / FALLBACK)
      ↓
Metrics + Audit Trail Update
      ↓
Manual Review Queue (if escalated)
```

---

## 2. Problem Statement
Every day, digital businesses lose between 5% and 15% of their gross merchandise value (GMV) to payment failures. Common failure modes include:
- Bank issuer timeouts and network dropouts
- Temporary insufficient customer balance
- Card validity expirations
- Abandoned 3DS OTP challenges
- Off-session subscription mandate clearing rejections

Traditional solutions either do nothing (relying entirely on customer initiative) or execute unconstrained, aggressive retries that spam payment networks, trigger bank fraud blocks, and annoy customers.

---

## 3. Why Revenue Recovery Matters
- **High ROI**: Recovering failed payments has virtually zero customer acquisition cost (CAC).
- **Reduced Churn**: Involuntary churn (subscription failure due to card expiry or bank decline) accounts for >30% of total SaaS churn.
- **Brand Protection**: Respecting customer frequency caps (e.g., max 2 nudges/24h) prevents harassment and negative sentiment.

---

## 4. RecoverAI Solution
RecoverAI bridges intelligence with financial safety:
1. **Advisory Gemini Classifier**: Generates contextual diagnoses, confidence scores, and empathetic recovery messages.
2. **Authoritative Deterministic Policy Engine**: Gemini has **ZERO execution authority**. Only actions that pass all 8 deterministic guardrails can proceed.
3. **Pre-Execution Audit Enforcement**: Actions are logged with status `PENDING_EXECUTION` *before* hitting any API.
4. **Causal Holdout Baseline**: 20% of transactions are permanently isolated as an untreated control group to prove true incremental lift.

---

## 5. Architectural Diagram

```
                             ┌──────────────────────────────────────┐
                             │       Fintech AI Ops Console         │
                             │  (React 18 + Vite + Tailwind/CSS)    │
                             └──────────────────┬───────────────────┘
                                                │ REST API
                                                ▼
                             ┌──────────────────────────────────────┐
                             │        FastAPI Backend Engine        │
                             │                                      │
                             │  ┌────────────────────────────────┐  │
                             │  │   Gemini Hybrid Classifier     │  │
                             │  │   (Advisory Only - No Exec)    │  │
                             │  └───────────────┬────────────────┘  │
                             │                  │                   │
                             │                  ▼                   │
                             │  ┌────────────────────────────────┐  │
                             │  │   Bounded Action Engine        │  │
                             │  │   (Authoritative Guardrails)   │  │
                             │  └───────────────┬────────────────┘  │
                             │                  │                   │
                             │                  ▼                   │
                             │  ┌────────────────────────────────┐  │
                             │  │   Pre-Execution Audit Chain    │  │
                             │  │   (PENDING_EXECUTION Log)      │  │
                             │  └───────────────┬────────────────┘  │
                             │                  │                   │
                             │                  ▼                   │
                             │  ┌────────────────────────────────┐  │
                             │  │       Recovery Executor        │  │
                             │  │   ┌───────────────┬──────────┐ │  │
                             │  │   │ Razorpay Test │ Simulator│ │  │
                             │  │   └───────────────┴──────────┘ │  │
                             │  └────────────────────────────────┘  │
                             └──────────────────┬───────────────────┘
                                                │
                                                ▼
                             ┌──────────────────────────────────────┐
                             │   Synthetic Data & Audit Ledger      │
                             │   - failed_txns.json                 │
                             │   - recovery_logs.json               │
                             └──────────────────────────────────────┘
```

---

## 6. Canonical Recovery Actions
RecoverAI enforces a strict 6-action vocabulary:
- `RETRY_PAYMENT`: Silent, automated payment re-authorization after exponential backoff.
- `SEND_NUDGE`: SMS/WhatsApp payment link notification.
- `OFFER_VOUCHER`: Promotional discount voucher to recover at-risk cart drop-offs.
- `SCHEDULE_MANDATE_RETRY`: Queued retry in next RBI recurring clearing window.
- `MANUAL_REVIEW`: Escalation to human operations queue for ambiguity or boundary violations.
- `NO_ACTION`: Enforced on 20% holdout group or resolved transactions.

---

## 7. Deterministic Guardrails Matrix

| Guardrail | Boundary Limit | Enforcement Behavior |
| :--- | :--- | :--- |
| **Holdout Protection** | Exactly 20% of transactions | Strictly assigned `NO_ACTION`. Never retried or nudged. |
| **Blocked Customer Protection** | Tier = `blocked` | Automated actions prohibited. Escalated to `MANUAL_REVIEW`. |
| **High Value Boundary** | Amount > ₹50,000 (5,000,000 paise) | Automated actions prohibited. Escalated to `MANUAL_REVIEW`. |
| **Customer Retry Cap** | Max 3 retries / customer / 24h | Further retries blocked. Escalated to `MANUAL_REVIEW`. |
| **Customer Nudge Cap** | Max 2 nudges / customer / 24h | Further nudges blocked. Escalated to `MANUAL_REVIEW`. |
| **Voucher Cap** | Max ₹50 (5,000 paise) | Any voucher exceeding ₹50 is `REJECTED`. |
| **Confidence Floor** | Minimum 0.80 confidence | Any score < 0.80 routed to `MANUAL_REVIEW`. |
| **Idempotency** | `txn_id + ":" + action` | Existing key blocks duplicate execution. |
| **Pre-Execution Audit** | Mandatory log creation | Action cannot execute without prior `PENDING_EXECUTION` entry. |

---

## 8. Quantitative Evaluation Benchmark Results

The evaluation benchmark (`evaluate.py`) ran against the identical dataset of 100 synthetic transactions (`RANDOM_SEED = 42`):

| Metric | Rule-Only Baseline | RecoverAI Agent | Holdout Control Group |
| :--- | :--- | :--- | :--- |
| **Total Transactions** | 80 | 80 | 20 |
| **Recovery Rate** | 66.3% | **58.8%** | 0.0% |
| **Recovered Revenue** | ₹294,652.00 | **₹195,156.00** | ₹0.00 |
| **Statistically Causal Lift** | — | **+58.8% (Absolute)** | Baseline |
| **Net Incremental Revenue** | — | **₹195,156.00** | ₹0.00 |
| **Policy Guardrail Violations** | 4 violations | **0 violations (100% safe)** | 0 |
| **Audit Trail Coverage** | 0% | **100.0% (Pre-Execution)** | 100% |
| **Manual Review Escalation**| 0% | **9.0% (9 transactions)** | 0% |
| **False-Positive Nudge Rate**| High (spams on network drops) | **0.0% (Only for funds/card/3DS)** | 0% |
| **Total Cost to Recover** | ₹17.00 | **₹15.00** | ₹0.00 |

> **Key Insight**: While naive rule-only recovery claims higher revenue, it causes **4 severe policy violations** by attempting retries on blocked fraud accounts and unauthorized high-value transactions (>₹50,000). RecoverAI achieves **₹195,156.00 net recovered revenue with ZERO policy violations**.

---

## 9. Failure Injection: `TXN_TIMEOUT_SIM_001`
To demonstrate system resilience under external payment gateway outage:
1. `TXN_TIMEOUT_SIM_001` fails with `network_error` for ₹4,999.
2. Gemini diagnoses transient failure and recommends `RETRY_PAYMENT`.
3. Policy engine approves action and generates pre-execution audit record.
4. **Attempt 1**: Gateway returns `504 Gateway Timeout`. Agent applies **1-second exponential backoff**.
5. **Attempt 2**: Gateway returns `504 Gateway Timeout`. Agent applies **2-second exponential backoff**.
6. **Limit Reached**: Bounded retry cap reached. Status transitions to `FALLBACK`.
7. **Escalation**: Automatically routed to `MANUAL_REVIEW` queue without crashing.

---

## 10. Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
# 1. Clone / navigate to directory
cd RecoverAI

# 2. Create environment variables file
cp .env.example .env

# 3. Generate initial synthetic dataset (100 txns, 20 holdouts)
python data_agent.py

# 4. Run automated test suite
pytest backend/tests/ -v

# 5. Start FastAPI Backend Server (Runs on port 8000)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server (Runs on port 5173)
npm run dev
```

Visit the dashboard at `http://localhost:5173`.

---

## 11. Environment Variables (`.env`)

```ini
# Google Gemini API (Optional: uses robust deterministic fallback if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# Razorpay Test Mode (Optional: routes to simulator if omitted)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

---

## 12. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and execution mode |
| `POST` | `/api/generate-data` | Regenerates 100 synthetic transactions & resets audit trail |
| `GET` | `/api/transactions` | Filterable transaction ledger (`status`, `failure_code`, `customer_tier`, `holdout`) |
| `GET` | `/api/transactions/{id}` | Single transaction details |
| `POST` | `/api/evaluate/{id}` | Executes full agent lifecycle on transaction |
| `POST` | `/api/batch-process` | Executes recovery agent across all eligible non-holdout transactions |
| `POST` | `/api/demo/run` | Executes failure injection scenario (`TXN_TIMEOUT_SIM_001`) |
| `GET` | `/api/transactions/{id}/trace` | Chronological lifecycle trace and policy proofs |
| `GET` | `/api/metrics` | Real-time system metrics (recovery rate, lift, costs) |
| `GET` | `/api/evaluation` | Benchmark evaluation results (Rule-Only vs RecoverAI vs Holdout) |
| `GET` | `/api/logs` | Immutable audit log ledger |
| `GET` | `/api/manual-review` | Human-in-the-loop review queue |
| `POST` | `/api/manual-review/{id}/approve` | Audited manual operator approval |
| `POST` | `/api/manual-review/{id}/reject` | Audited manual operator rejection |

---

## 13. Automated Test Suite
RecoverAI includes 21 comprehensive unit and integration tests verifying all 24 safety boundary requirements:
```bash
pytest backend/tests/ -v
```
Verified Test Cases:
- Exact 100 transactions and 20 holdouts
- Holdout protection enforcement
- Blocked customer rejection
- High-value transaction escalation (>₹50,000)
- Confidence threshold floor (<0.80)
- Customer 24h retry cap (max 3)
- Customer 24h nudge cap (max 2)
- Voucher cap (max ₹50)
- Idempotency key deduplication
- Pre-execution audit logging prior to action execution
- 504 Gateway Timeout exponential backoff and fallback
- Zero policy violations guarantee
- Zero secret exposure across all public endpoints
