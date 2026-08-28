from sqlalchemy.orm import Session
from app.models.models import Department, DepartmentType, Bed, BedStatus
from app.schemas.schemas import OptimizationResponse

def optimize_department(db: Session, department_type: DepartmentType, predicted_demand_beds: int) -> OptimizationResponse:
    department = db.query(Department).filter(Department.type == department_type).first()
    beds = department.beds if department else []
    available = sum(b.status == BedStatus.AVAILABLE for b in beds)
    gap = max(0, predicted_demand_beds - available)
    return OptimizationResponse(
        department_type=department_type,
        predicted_demand_beds=predicted_demand_beds,
        available_beds=available,
        recommended_beds=gap,
        recommended_staff=max(0, (predicted_demand_beds + 3) // 4),
        rationale="Activate available capacity and review staffing coverage before the forecast window.",
    )
