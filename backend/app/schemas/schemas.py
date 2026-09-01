from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.models.models import DepartmentType, BedStatus


def _normalize_uuid(value):
    if value is None:
        return value
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, str):
        return value
    return str(value)

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2, max_length=160)
    role: str = "operations_manager"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    full_name: str
    role: str

    @field_validator('id', mode='before')
    @classmethod
    def validate_id(cls, value):
        return _normalize_uuid(value)


class UserProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)


class AdminUserCreate(UserCreate):
    """A user created by an authenticated administrator."""
    role: str = "operations_manager"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForecastRequest(BaseModel):
    department_type: DepartmentType
    metric: str = "occupancy_pct"
    horizon_hours: int = Field(default=12, ge=1, le=168)

class ForecastPoint(BaseModel):
    timestamp: datetime
    value: float
    lower_bound: float
    upper_bound: float

class ForecastResponse(BaseModel):
    model_name: str
    current_value: float | None
    points: list[ForecastPoint]
    training_rows: int
    mae: float | None = None

class FullForecastResponse(ForecastResponse):
    department_type: DepartmentType
    metric: str

class BedStatusUpdate(BaseModel):
    status: BedStatus

class BedOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department_id: str
    bed_number: str
    bed_type: str
    status: BedStatus

    @field_validator('id', 'department_id', mode='before')
    @classmethod
    def validate_ids(cls, value):
        return _normalize_uuid(value)

class BedSummary(BaseModel):
    department_type: DepartmentType
    total_beds: int
    occupied: int
    available: int
    cleaning: int
    discharge_pending: int
    occupancy_pct: float

class StaffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    hospital_id: str
    department_id: str | None
    employee_code: str
    full_name: str
    staff_type: str
    specialty: str | None
    status: str
    on_shift: bool

    @field_validator('id', 'hospital_id', 'department_id', mode='before')
    @classmethod
    def validate_ids(cls, value):
        return _normalize_uuid(value)

class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    hospital_id: str
    department_id: str | None
    name: str | None
    total_units: int
    in_use_units: int
    status: str

    @field_validator('id', 'hospital_id', 'department_id', mode='before')
    @classmethod
    def validate_ids(cls, value):
        return _normalize_uuid(value)

class OptimizationRequest(BaseModel):
    department_type: DepartmentType
    predicted_demand_beds: int = Field(ge=0)

class OptimizationResponse(BaseModel):
    department_type: DepartmentType
    predicted_demand_beds: int
    available_beds: int
    recommended_beds: int
    recommended_staff: int
    rationale: str

class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    hospital_id: str
    department_id: str | None
    title: str
    action: str
    rationale: str | None
    priority: int
    status: str

    @field_validator('id', 'hospital_id', 'department_id', mode='before')
    @classmethod
    def validate_ids(cls, value):
        return _normalize_uuid(value)

class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    hospital_id: str
    department_id: str | None
    alert_type: str
    severity: str
    status: str
    title: str
    message: str
    created_at: datetime

    @field_validator('id', 'hospital_id', 'department_id', mode='before')
    @classmethod
    def validate_ids(cls, value):
        return _normalize_uuid(value)

class SurgeSimulationRequest(BaseModel):
    department_type: DepartmentType
    additional_arrivals: int = Field(ge=0, le=10000)
    window_hours: int = Field(default=12, ge=1, le=168)
    apply_optimization: bool = False

class SurgeSimulationResponse(BaseModel):
    department_type: DepartmentType
    additional_arrivals: int
    window_hours: int
    projected_occupancy_pct: float
    available_beds_before: int
    available_beds_after: int
    staff_shortage_risk: str
    recommendations: list[str]

class DatasetUploadResponse(BaseModel):
    rows_ingested: int
    department_types_found: list[str]
    date_range: str | None
    message: str
