from sqlalchemy.orm import Session
from app.models.models import Department, DepartmentType, Bed, BedStatus
from app.schemas.schemas import SurgeSimulationResponse

def simulate(db: Session, department_type: DepartmentType, additional_arrivals: int, window_hours: int, apply_optimization: bool) -> SurgeSimulationResponse:
    department = db.query(Department).filter(Department.type == department_type).first()
    beds = department.beds if department else []
    total = len(beds)
    occupied = sum(b.status == BedStatus.OCCUPIED for b in beds)
    available = sum(b.status == BedStatus.AVAILABLE for b in beds)
    projected_occupied = occupied + additional_arrivals
    projected_pct = round(projected_occupied / total * 100, 2) if total else 0
    shortage = "high" if projected_pct >= 95 else "moderate" if projected_pct >= 80 else "low"
    recommendations = ["Review discharge-ready patients", "Confirm next-shift staffing"]
    if apply_optimization:
        recommendations.append("Apply the recommended capacity allocation")
    return SurgeSimulationResponse(
        department_type=department_type,
        additional_arrivals=additional_arrivals,
        window_hours=window_hours,
        projected_occupancy_pct=projected_pct,
        available_beds_before=available,
        available_beds_after=max(0, available - additional_arrivals),
        staff_shortage_risk=shortage,
        recommendations=recommendations,
    )
