from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class BodyRegion(str, Enum):
    LEFT_SHOULDER = "LEFT_SHOULDER"
    RIGHT_SHOULDER = "RIGHT_SHOULDER"
    LEFT_FOREARM = "LEFT_FOREARM"
    RIGHT_FOREARM = "RIGHT_FOREARM"
    LEFT_KNEE = "LEFT_KNEE"
    RIGHT_KNEE = "RIGHT_KNEE"
    LEFT_ANKLE = "LEFT_ANKLE"
    RIGHT_ANKLE = "RIGHT_ANKLE"
    LOWER_BACK = "LOWER_BACK"
    HEAD = "HEAD"


class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class InjuryScanRequest(BaseModel):
    patient_ref: Optional[str] = Field(
        default=None, description="De-identified patient/MRN reference, not a real identifier"
    )
#no file req here
    simulate_region_hint: Optional[BodyRegion] = Field(
        default=None, description="Optional: bias the demo scan toward a specific region"
    )


class DetectedInjury(BaseModel):
    region: BodyRegion
    possible_injury: str
    confidence: float = Field(ge=0.0, le=1.0)
    severity: SeverityLevel
    recommended_action: str


class InjuryScanResponse(BaseModel):
    scan_id: str
    patient_ref: Optional[str] = None
    scanned_at: datetime
    scan_status: str = "COMPLETE"
    areas_of_concern: int
    findings: List[DetectedInjury]
    disclaimer: str = (
        "This is a simulated scan for demonstration purposes only. "
    )
