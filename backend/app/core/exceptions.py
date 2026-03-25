from fastapi import HTTPException, status

class FaaScraperException(HTTPException):
    # The FAA website is notoriously legacy/unstable.
    # We catch connection errors here so we don't return a generic "500 Internal Server Error".
    # This lets the frontend show a "Service Temporarily Unavailable" toast instead of a crash screen.
    def __init__(self, detail: str = "FAA Data Source unreachable. Retrying might work."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail
        )

class AIAnalysisException(HTTPException):
    # Gemini sometimes refuses to answer (safety filters) or times out.
    # We treat this as a 422 (Unprocessable) because the input was valid, but the processing failed.
    def __init__(self, detail: str = "AI Analysis failed to generate insight. Raw data still available."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

class InvalidAirportCode(HTTPException):
    # Sanity check for user input. 
    # Prevents sending garbage like "123" or "LOL" to the scraper, saving bandwidth.
    def __init__(self, code: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ICAO code '{code}'. Must be 4 letters (e.g., KJFK)."
        )