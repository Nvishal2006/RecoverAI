from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class Transaction(BaseModel):
    txn_id: str
    customer_id: str
    amount_paise: int
    failure_code: str
    timestamp: str
    customer_tier: str = "standard"
    retry_count: int = 0
    is_holdout: bool = False
    status: str = "FAILED"
    recovered_amount_paise: int = 0
    action_taken: Optional[str] = None
    ai_confidence: Optional[float] = None
    policy_decision: Optional[str] = None

class AIRecommendation(BaseModel):
    cause: str
    confidence: float
    recommended_action: str
    explanation: str
    message: str
    is_llm_generated: bool = False

class PolicyCheckItem(BaseModel):
    name: str
    passed: bool
    details: str

class PolicyCheckResult(BaseModel):
    passed: bool
    decision: str
    final_action: str
    reason: str
    checks: List[PolicyCheckItem] = []

class AuditRecord(BaseModel):
    audit_id: str
    txn_id: str
    trigger: str = "payment_failure"
    failure_code: str
    ai_recommendation: str
    confidence: float
    reasoning: str
    policy_decision: str
    action: str
    amount_paise: int
    cost_paise: int = 0
    status: str
    idempotency_key: str
    execution_id: Optional[str] = None
    execution_attempt: int = 0
    api_response: Optional[Dict[str, Any]] = None
    retry_attempts: int = 0
    fallback_action: Optional[str] = None
    timestamp: str

class ManualReviewActionRequest(BaseModel):
    action: Optional[str] = None
    notes: Optional[str] = None
