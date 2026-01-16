from fastapi import APIRouter, Body, HTTPException # <--- Added HTTPException here
from app.services.ai_engine import AIEngine
from app.schemas.analysis import AIAnalysisResult
from app.core.exceptions import AIAnalysisException

router = APIRouter()

@router.post("/", response_model=AIAnalysisResult)
async def analyze_risk(
    raw_text: str = Body(..., embed=True, description="The raw NOTAM text to analyze")
):
    # Intent: On-Demand Intelligence.
    # We separate this from search because AI is expensive ($) and slow (1-2s).
    # The frontend calls this ONLY when the user clicks "Analyze Risk".
    
    # 1. Setup
    # Initialize the brain. 
    # If the API Key is invalid, this will explode immediately (Fail Fast).
    ai = AIEngine()
    
    # 2. Processing
    try:
        # This is the heavy lifting.
        # We pass the text to Gemini and wait for the JSON response.
        analysis = ai.analyze_risk(raw_text)
        
        # 3. Return
        # Pydantic ensures 'analysis' matches the strict AIAnalysisResult schema.
        return analysis

    except AIAnalysisException:
        # Known failure (Safety filter triggered, quota exceeded).
        raise
    except Exception as e:
        # Unknown failure (Memory leak, timeout, cosmic rays).
        print(f"CRITICAL: AI Logic failed: {e}")
        raise HTTPException(status_code=500, detail="AI Engine Offline")