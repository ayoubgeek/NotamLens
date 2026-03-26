from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum

"""NOTAM domain models."""
class NotamType(str, Enum):
    NOTAM_D = "NOTAM_D"
    FDC = "FDC"
    INTERNATIONAL = "INTERNATIONAL"
    UNKNOWN = "UNKNOWN"


class NotamSchema(BaseModel):
    notam_id: str
    icao: str
    raw_text: str
    classification: NotamType
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = True
    q_data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

