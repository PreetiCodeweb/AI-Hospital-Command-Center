from sqlalchemy.orm import Session
from app.models.models import DepartmentType
from app.schemas.schemas import RecommendationOut

def build_recommendation(db: Session, department_type: DepartmentType) -> RecommendationOut:
    return RecommendationOut(
        id=f"generated-{department_type.value.lower()}",
        hospital_id="generated",
        department_id=None,
        title=f"Review {department_type.value.replace('_', ' ').title()} capacity",
        action="Confirm beds, staffing, and equipment coverage for the next demand window.",
        rationale="Generated from current operational and forecast signals.",
        priority=2,
        status="proposed",
    )
