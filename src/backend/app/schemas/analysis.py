from pydantic import BaseModel
from typing import Optional

class AIAnalysisResult(BaseModel):
    summary: str
    impact: str         # The "So What"
    action: str         # The "Now What"
    risk_score: int
    risk_level: Optional[str] = "LOW"
    
    # ---------------------------------------------------------
    # IMPORTANT: The 'reasoning' field is DELETED.
    # If you see "reasoning: str" here, DELETE IT IMMEDIATELY.
    # ---------------------------------------------------------