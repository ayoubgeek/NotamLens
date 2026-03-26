from fastapi import APIRouter, Body, HTTPException # <--- Added HTTPException here
from app.services.ai_engine import AIEngine
from app.schemas.analysis import AIAnalysisResult
from app.core.exceptions import AIAnalysisException

router = APIRouter()

@router.post("/", response_model=AIAnalysisResult)
async def analyze_risk(
    raw_text: str = Body(..., embed=True, description="The raw NOTAM text to analyze")
):
    # Segregated from standard search due to inference latency and API cost.
    # Executed on-demand exclusively.
    
    ai = AIEngine()

    try:
        analysis = ai.analyze_risk(raw_text)
        
        return analysis

    except AIAnalysisException:
        raise
    except Exception as e:
        print(f"CRITICAL: AI Logic failed: {e}")
        raise HTTPException(status_code=500, detail="AI Engine Offline")