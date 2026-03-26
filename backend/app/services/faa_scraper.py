import requests
import re
from app.services.cache import cache
from app.schemas.notam import NotamSchema, NotamType
from app.core.exceptions import FaaScraperException

class FaaScraper:
    BASE_URL = "https://notams.aim.faa.gov/notamSearch/search"

    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }

    def fetch_notams(self, icao: str):
        # Check cache
        cache_key = f"notams:{icao.upper()}"
        cached = cache.get(cache_key)
        if cached is not None:
            print(f"⚡ CACHE HIT: Serving stored data for {icao} (Instant Load)")
            return cached

        # Fetch from API
        print(f"📡 API: Fetching fresh data for {icao}...")
        
        payload = {
            'searchType': '0',
            'designatorsForLocation': icao.upper(),
            'radius': '10',
            'notamsOnly': 'false',
            'limit': '100',
            'offset': '0',
            'sort': 'startDate',
            'direction': 'DESC'
        }
        
        try:
            response = self.session.post(self.BASE_URL, headers=self.headers, data=payload, timeout=20)
            
            if response.status_code != 200:
                raise FaaScraperException(f"FAA returned status {response.status_code}")

            data = response.json()
            if 'notamList' not in data:
                return []

            # Clean the data
            clean_results = self._clean_list(data['notamList'], icao)
            
            # Update cache
            cache.set(cache_key, clean_results, ttl=1800)
            return clean_results

        except Exception as e:
            print(f"Scraper Error for {icao}: {str(e)}")
            raise FaaScraperException()

    def _clean_list(self, raw_list: list, icao: str):
        clean_data = []
        
        for item in raw_list:
            # Locate raw text
            raw_text = item.get('icaoMessage', '') or item.get('traditionalMessage', '')
            if not raw_text: continue

            notam_id = item.get('notamNumber', 'UNKNOWN')
            
            # Extract Q-Code line
            q_line_raw = self._extract_field(raw_text, r"Q\)\s*(.*?)(?:\s+[A-Z]\)|$)")
            q_data = self._parse_q_line(q_line_raw) 
            
            # Extract main message body (typically follows 'E)')
            message = self._extract_field(raw_text, r"(?:E\)|TEXT:)\s*(.*?)(?:\s+[F-G]\)|$)")
            
            # Fallback: If we can't find E), use raw text
            if not message:
                message = raw_text

            # Determine NOTAM classification
            raw_type = item.get('type', 'UNK')
            classification = "NOTAM_D" if raw_type in ['N', 'R'] else "FDC"

            # Construct representation
            notam_obj = {
                "notam_id": notam_id,
                "icao": icao.upper(),
                "raw_text": raw_text,
                "message": message,        # Clean Message
                "classification": classification,
                "start_date": item.get('startDate', ''),
                "end_date": item.get('endDate', ''),
                "q_data": q_data           # Map Data
            }
            clean_data.append(notam_obj)
            
        return clean_data

    # --- Utility Methods ---
    def _extract_field(self, text, pattern):
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def _parse_q_line(self, q_string):
        """
        Parses the Q-Code line to extract coordinates and radii.
        """
        if not q_string: return None
        
        parts = q_string.split('/')
        # Safety check: Standard Q-lines have 8 parts
        if len(parts) < 8: return None 

        return {
            "fir": parts[0] if len(parts) > 0 else "UNK",
            "code": parts[1] if len(parts) > 1 else "UNK",
            "traffic": parts[2] if len(parts) > 2 else "UNK",
            "scope": parts[3] if len(parts) > 3 else "UNK",
            "lower": parts[5] if len(parts) > 5 else "000",
            "upper": parts[6] if len(parts) > 6 else "999",
            "coords": parts[7][:-3] if len(parts) > 7 and len(parts[7]) > 3 else "UNK",
            "radius": parts[7][-3:] if len(parts) > 7 and len(parts[7]) > 3 else "005"
        }