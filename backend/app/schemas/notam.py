from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum

# --- 1. Define the missing Enum ---
class NotamType(str, Enum):
    NOTAM_D = "NOTAM_D"
    FDC = "FDC"
    INTERNATIONAL = "INTERNATIONAL"
    UNKNOWN = "UNKNOWN"

# --- 2. Define the Schema ---
class NotamSchema(BaseModel):
    notam_id: str
    icao: str
    raw_text: str
    classification: NotamType  # Uses the Enum defined above
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = True
    q_data: Optional[Dict[str, Any]] = None # The map coordinates live here
    message: Optional[str] = None

