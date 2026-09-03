import json
import logging
from typing import Dict, Any, Optional
from backend.config import GEMINI_API_KEY, RecoveryAction
from backend.models import AIRecommendation, Transaction

logger = logging.getLogger("recoverai.classifier")

# Deterministic Knowledge Base for Failure Diagnosis
DETERMINISTIC_RULES = {
    "network_error": {
        "recommended_action": RecoveryAction.RETRY_PAYMENT,
        "confidence": 0.94,
        "cause": "Transient network layer timeout",
        "explanation": "Network transmission dropped during authorization. The failure appears transient and is suitable for a bounded retry.",
        "message": "Your payment could not be completed due to a temporary network issue. We are retrying your payment automatically."
    },
    "bank_timeout": {
        "recommended_action": RecoveryAction.RETRY_PAYMENT,
        "confidence": 0.92,
        "cause": "Issuer bank gateway response timeout",
        "explanation": "The issuing bank gateway timed out before acknowledging the debit. A bounded smart retry after backoff is optimal.",
        "message": "The issuing bank took too long to respond. We will retry your transaction shortly."
    },
    "insufficient_funds": {
        "recommended_action": RecoveryAction.SEND_NUDGE,
        "confidence": 0.88,
        "cause": "Insufficient customer balance or credit limit",
        "explanation": "Payment declined due to insufficient balance. Sending an SMS/WhatsApp nudge with a delayed retry option.",
        "message": "Your recent payment couldn't be completed due to insufficient funds. Click here to retry with an alternate method or account."
    },
    "card_expired": {
        "recommended_action": RecoveryAction.SEND_NUDGE,
        "confidence": 0.89,
        "cause": "Card validity date expired",
        "explanation": "Card expiry date reached. An automated retry will fail; customer requires a payment method update link.",
        "message": "Your card on file appears to have expired. Please update your card details to keep your service active."
    },
    "3ds_dropoff": {
        "recommended_action": RecoveryAction.SEND_NUDGE,
        "confidence": 0.87,
        "cause": "Two-factor OTP/3DS authentication abandoned",
        "explanation": "The customer abandoned the 3DS verification challenge. Send a 1-click secure payment completion nudge.",
        "message": "We noticed you didn't finish OTP verification. Click here to resume your checkout securely."
    },
    "mandate_failure": {
        "recommended_action": RecoveryAction.SCHEDULE_MANDATE_RETRY,
        "confidence": 0.90,
        "cause": "Recurring auto-debit mandate processing failure",
        "explanation": "Recurring mandate debit failed during off-session settlement. Schedule mandate re-attempt in next RBI window.",
        "message": "Your subscription auto-debit failed. We have scheduled a re-attempt in the next clearing cycle."
    }
}

def get_deterministic_recommendation(txn: Transaction) -> AIRecommendation:
    """Fallback deterministic recommendation engine."""
    rule = DETERMINISTIC_RULES.get(txn.failure_code)
    if rule:
        return AIRecommendation(
            cause=rule["cause"],
            confidence=rule["confidence"],
            recommended_action=rule["recommended_action"],
            explanation=rule["explanation"],
            message=rule["message"],
            is_llm_generated=False
        )
    
    # Unknown failure code
    return AIRecommendation(
        cause=f"Unclassified failure code: {txn.failure_code}",
        confidence=0.65,
        recommended_action=RecoveryAction.MANUAL_REVIEW,
        explanation="Failure pattern not present in deterministic rulebook. Flagged for risk team review.",
        message="Your transaction requires manual verification.",
        is_llm_generated=False
    )

def classify_failure(txn: Transaction) -> AIRecommendation:
    """
    Hybrid Classifier:
    1. Check if GEMINI_API_KEY is available.
    2. Attempt Gemini LLM structured analysis.
    3. If unavailable, error, or missing key, gracefully fall back to deterministic rules.
    """
    if not GEMINI_API_KEY:
        return get_deterministic_recommendation(txn)
        
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = f"""
You are the AI Recovery Diagnostic Agent for RecoverAI (failed payment recovery system).
Analyze the following failed Razorpay transaction and provide a recovery diagnosis.

Allowed Recovery Actions (ONLY choose one):
- RETRY_PAYMENT
- SEND_NUDGE
- OFFER_VOUCHER
- SCHEDULE_MANDATE_RETRY
- MANUAL_REVIEW
- NO_ACTION

Transaction Details:
- Transaction ID: {txn.txn_id}
- Customer ID: {txn.customer_id}
- Amount: ₹{txn.amount_paise / 100:.2f} ({txn.amount_paise} paise)
- Failure Code: {txn.failure_code}
- Customer Tier: {txn.customer_tier}
- Prior Retry Count: {txn.retry_count}

Return JSON with exact keys:
{{
  "cause": "<Concise technical root cause>",
  "confidence": <Float between 0.0 and 1.0>,
  "recommended_action": "<One of the allowed actions>",
  "explanation": "<Concise explainability rationale>",
  "message": "<Polite, customer-facing notification text>"
}}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        data = json.loads(response.text)
        action = data.get("recommended_action", "").upper()
        if action not in RecoveryAction.ALL:
            action = RecoveryAction.MANUAL_REVIEW
            
        confidence = float(data.get("confidence", 0.75))
        confidence = max(0.0, min(1.0, confidence))
        
        return AIRecommendation(
            cause=data.get("cause", "Diagnosed by Gemini"),
            confidence=confidence,
            recommended_action=action,
            explanation=data.get("explanation", "Reasoning generated by Gemini LLM"),
            message=data.get("message", "Payment recovery notice"),
            is_llm_generated=True
        )
    except Exception as exc:
        logger.warning(f"Gemini API call failed ({exc}). Using deterministic fallback.")
        return get_deterministic_recommendation(txn)
