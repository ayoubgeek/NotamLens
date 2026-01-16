from fastapi import APIRouter, HTTPException, Path
from typing import List
from app.services.faa_scraper import FaaScraper
from app.schemas.notam import NotamSchema
from app.core.exceptions import InvalidAirportCode, FaaScraperException

router = APIRouter()

@router.get("/{icao}", response_model=List[NotamSchema])
async def search_notams(
    icao: str = Path(..., min_length=4, max_length=4, description="4-letter ICAO code (e.g., KJFK)")
):
    """
    Primary endpoint for fetching raw NOTAMs.
    Flow: User Request -> Validation -> Scraper -> Clean Data -> JSON Response.
    """
    # 1. Validation (The Bouncer)
    # Even though Pydantic validates the path param, we double-check logic here.
    clean_icao = icao.upper().strip()
    if not clean_icao.isalpha():
        # Prevent injection attacks or garbage input like '1234'.
        raise InvalidAirportCode(clean_icao)

    # 2. Execution (The Work)
    # We initialize the scraper here. 
    # In a high-scale app, we might inject this as a dependency to reuse connections.
    scraper = FaaScraper()
    
    try:
        # We assume the scrape might take 1-3 seconds.
        # Since 'requests' is blocking, this actually pauses this specific worker thread.
        # Future optimization: Refactor FaaScraper to use 'aiohttp' for true async.
        results = scraper.fetch_notams(clean_icao)
        
        if not results:
            # Valid search, but empty result. 
            # We return an empty list instead of a 404 because "No NOTAMs" is a valid state (Safe Airport).
            return []
            
        return results

    except FaaScraperException:
        # The service layer failed (FAA down?). We bubble up the specific error code.
        raise
    except Exception as e:
        # Catch-all for unexpected crashes (e.g., memory overflow).
        print(f"CRITICAL: Unhandled error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal System Malfunction")