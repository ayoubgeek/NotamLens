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
    Primary endpoint for fetching raw NOTAMs via FAA integration.
    """
    clean_icao = icao.upper().strip()
    if not clean_icao.isalpha():
        raise InvalidAirportCode(clean_icao)

    # Scraper instance is currently created per-request.
    # Consider connection pooling or dependency injection for scaling.
    scraper = FaaScraper()
    
    try:
        # Synchronous blocking call to FAA; consider aiohttp for high throughput.
        results = scraper.fetch_notams(clean_icao)
        
        if not results:
            # Empty result implies no active NOTAMs, a valid operational state.
            return []
            
        return results

    except FaaScraperException:
        raise
    except Exception as e:
        print(f"CRITICAL: Unhandled error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal System Malfunction")