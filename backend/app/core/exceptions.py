from fastapi import HTTPException, status

class FaaScraperException(HTTPException):
    # Returns 503 instead of 500 for expected upstream FAA instability.
    def __init__(self, detail: str = "FAA Data Source unreachable. Retrying might work."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail
        )

class AIAnalysisException(HTTPException):
    # Mapped to 422 for valid inputs that trigger LLM filters or generation limits.
    def __init__(self, detail: str = "AI Analysis failed to generate insight. Raw data still available."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

class InvalidAirportCode(HTTPException):
    # Pre-flight input validation to prevent invalid queries avoiding downstream usage.
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ICAO code '{code}'. Must be 4 letters (e.g., KJFK)."
        )