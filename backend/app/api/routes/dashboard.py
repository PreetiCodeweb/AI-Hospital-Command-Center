from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Department, Bed, BedStatus, Staff, Equipment, Alert
from app.services.recommendations import build_recommendation

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def dashboard(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    result = []
    for d in departments:
        beds = d.beds
        total = len(beds)
        occupied = sum(b.status == BedStatus.OCCUPIED for b in beds)
        result.append({
            "department_type": d.type,
            "department_name": d.name,
            "total_beds": total,
            "occupied_beds": occupied,
            "available_beds": sum(b.status == BedStatus.AVAILABLE for b in beds),
            "occupancy_pct": round(occupied / total * 100, 2) if total else 0,
            "staff_on_duty": sum(s.on_shift for s in d.staff),
            "equipment_total": sum(e.total_units for e in d.equipment),
            "equipment_available": sum(max(0, e.total_units-e.in_use_units) for e in d.equipment),
        })
    return {"departments": result}
