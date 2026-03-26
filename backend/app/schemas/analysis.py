from pydantic import BaseModel
from typing import Optional

class AIAnalysisResult(BaseModel):
    summary: str
    impact: str         # The "So What"
    action: str         # The "Now What"
    risk_score: int
    risk_level: Optional[str] = "LOW"
    
    # Note: 'reasoning' field intentionally omitted per API contract.