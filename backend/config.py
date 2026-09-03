import os
from dotenv import load_dotenv

load_dotenv()

# Guardrail & Safety Constants
MAX_AUTO_RETRIES_PER_CUSTOMER = 3  # Max retries per customer in 24 hours
MAX_NUDGES_PER_CUSTOMER = 2        # Max nudges per customer in 24 hours
MAX_VOUCHER_AMOUNT_PAISE = 5000    # ₹50 in integer paise
HIGH_VALUE_THRESHOLD_PAISE = 5000000  # ₹50,000 in integer paise
MIN_AI_CONFIDENCE = 0.80           # Minimum AI confidence required for automated action

RANDOM_SEED = 42

# Environment Variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "").strip()

# Canonical Recovery Action Vocabulary
class RecoveryAction:
    RETRY_PAYMENT = "RETRY_PAYMENT"
    SEND_NUDGE = "SEND_NUDGE"
    OFFER_VOUCHER = "OFFER_VOUCHER"
    SCHEDULE_MANDATE_RETRY = "SCHEDULE_MANDATE_RETRY"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    NO_ACTION = "NO_ACTION"
    
    ALL = [
        RETRY_PAYMENT,
        SEND_NUDGE,
        OFFER_VOUCHER,
        SCHEDULE_MANDATE_RETRY,
        MANUAL_REVIEW,
        NO_ACTION
    ]

# Policy Decision Codes
class PolicyDecision:
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    NO_ACTION = "NO_ACTION"

# Execution Status Codes
class ExecutionStatus:
    PENDING_EXECUTION = "PENDING_EXECUTION"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    FALLBACK = "FALLBACK"
    SKIPPED = "SKIPPED"
