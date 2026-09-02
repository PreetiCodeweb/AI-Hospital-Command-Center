from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from uuid import UUID
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO

from app.database.session import get_db
from app.core.security import get_current_user
from app.models.models import User, BedOrder
from app.models.models import Department, DepartmentType, Bed, BedStatus, Staff, Equipment, Alert
from app.schemas.schemas import BedOut, BedStatusUpdate, StaffOut, EquipmentOut, BedSummary, BedOrderCreate, BedOrderOut, OptimizationRequest, OptimizationResponse, RecommendationOut, AlertOut, DatasetUploadResponse
from app.services.optimization import optimize_department
from app.services.recommendations import build_recommendation
from app.ml.data_utils import ingest_dataframe
from app.api.routes.dashboard import dashboard as dashboard_snapshot

router = APIRouter(tags=["Operations"])

@router.get("/beds", response_model=list[BedSummary])
def bed_summaries(db: Session = Depends(get_db)):
    out = []
    for d in db.query(Department).all():
        beds = d.beds; total = len(beds); occupied = sum(b.status == BedStatus.OCCUPIED for b in beds)
        out.append(BedSummary(department_type=d.type, total_beds=total, occupied=occupied, available=sum(b.status == BedStatus.AVAILABLE for b in beds), cleaning=sum(b.status == BedStatus.CLEANING for b in beds), discharge_pending=sum(b.status == BedStatus.DISCHARGE_PENDING for b in beds), occupancy_pct=round(occupied/total*100,2) if total else 0))
    return out

@router.get("/beds/{department_type}", response_model=list[BedOut])
def beds(department_type: DepartmentType, db: Session = Depends(get_db)):
    return db.query(Bed).join(Department).filter(Department.type == department_type).all()

@router.patch("/beds/{bed_id}", response_model=BedOut)
def update_bed(bed_id: str, payload: BedStatusUpdate, db: Session = Depends(get_db)):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed: raise HTTPException(404, "Bed not found")
    bed.status = payload.status; db.commit(); db.refresh(bed)
    return bed

@router.get("/staff", response_model=list[StaffOut])
def staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@router.get("/equipment", response_model=list[EquipmentOut])
def equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()

@router.get("/resources")
def resources(db: Session = Depends(get_db)):
    return {
        "beds": bed_summaries(db),
        "staff": staff(db),
        "equipment": equipment(db),
    }

@router.get("/digital-twin")
def digital_twin(db: Session = Depends(get_db)):
    return {
        "departments": dashboard_snapshot(db),
        "mode": "live",
        "status": "operational",
    }

@router.post("/injury-analysis")
async def injury_analysis(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "An image file is required")
    if file.content_type not in {"image/png", "image/jpeg", "image/webp", "application/dicom", "application/octet-stream"}:
        raise HTTPException(415, "Upload a PNG, JPG, WEBP, or DICOM file")
    raw = await file.read()
    if len(raw) > 50 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 50 MB limit")
    return {
        "filename": file.filename,
        "status": "review_required",
        "findings": [],
        "message": "Image received for authorized clinical review. No diagnosis was generated.",
    }


@router.post("/injury-analysis/upload")
async def upload_injury_scan(file: UploadFile = File(...), patient_ref: str = "", region_hint: str = ""):
    """Upload a medical image for injury analysis."""
    if not file.filename:
        raise HTTPException(400, "An image file is required")
    if file.content_type not in {"image/png", "image/jpeg", "image/webp", "application/dicom", "application/octet-stream"}:
        raise HTTPException(415, "Upload a PNG, JPG, WEBP, or DICOM file")
    raw = await file.read()
    if len(raw) > 50 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 50 MB limit")
    
    from uuid import uuid4
    from datetime import datetime
    
    # Generate mock findings for demo purposes
    findings = []
    if region_hint.upper() in {"HEAD", "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_KNEE", "RIGHT_KNEE"}:
        findings = [
            {
                "region": region_hint,
                "possible_injury": "Contusion (bruise)",
                "confidence": 0.75,
                "severity": "MEDIUM",
                "recommended_action": "Ice application, rest, monitor for swelling"
            },
            {
                "region": region_hint,
                "possible_injury": "Mild edema",
                "confidence": 0.62,
                "severity": "LOW",
                "recommended_action": "Compression bandage recommended"
            }
        ]
    
    return {
        "scan_id": str(uuid4()),
        "scanned_at": datetime.utcnow().isoformat(),
        "areas_of_concern": len(findings),
        "findings": findings,
        "patient_ref": patient_ref or "ANONYMOUS",
        "region_hint": region_hint,
    }


@router.post("/injury-analysis/simulate")
async def simulate_injury_scan(payload: dict):
    """Run a simulated injury detection scan with mock data."""
    from uuid import uuid4
    from datetime import datetime
    
    patient_ref = payload.get("patient_ref") or "DEMO-" + str(uuid4())[:8]
    region_hint = payload.get("simulate_region_hint", "LEFT_KNEE").upper()
    
    # Generate realistic mock findings based on region
    region_injuries = {
        "HEAD": ["Contusion", "Scalp laceration", "Orbital edema"],
        "LEFT_SHOULDER": ["Rotator cuff strain", "AC joint separation"],
        "RIGHT_SHOULDER": ["Rotator cuff strain", "AC joint separation"],
        "LEFT_FOREARM": ["Fracture", "Muscle strain"],
        "RIGHT_FOREARM": ["Fracture", "Muscle strain"],
        "LEFT_KNEE": ["Meniscus tear", "ACL strain", "Patellar subluxation"],
        "RIGHT_KNEE": ["Meniscus tear", "ACL strain", "Patellar subluxation"],
        "LEFT_ANKLE": ["Ankle sprain", "Fracture"],
        "RIGHT_ANKLE": ["Ankle sprain", "Fracture"],
        "LOWER_BACK": ["Disc herniation", "Muscle strain"],
    }
    
    injuries = region_injuries.get(region_hint, ["Contusion", "Edema"])
    findings = [
        {
            "region": region_hint,
            "possible_injury": injuries[0],
            "confidence": 0.78,
            "severity": "MEDIUM" if len(injuries) > 1 else "LOW",
            "recommended_action": "Clinical examination recommended; consider imaging if severe"
        }
    ]
    
    if len(injuries) > 1:
        findings.append({
            "region": region_hint,
            "possible_injury": injuries[1],
            "confidence": 0.54,
            "severity": "LOW",
            "recommended_action": "Monitor for progression"
        })
    
    return {
        "scan_id": str(uuid4()),
        "scanned_at": datetime.utcnow().isoformat(),
        "areas_of_concern": len(findings),
        "findings": findings,
        "patient_ref": patient_ref,
        "region_hint": region_hint,
    }

@router.post("/orders", response_model=BedOrderOut, status_code=201)
def create_order(payload: BedOrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        order = BedOrder(user_id=current_user.id, bed_id=UUID(payload.bed_id), department_id=UUID(payload.department_id), bed_type=payload.bed_type, quantity=payload.quantity, notes=payload.notes)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Invalid bed or department identifier") from error
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/optimize", response_model=OptimizationResponse)
def optimize(payload: OptimizationRequest, db: Session = Depends(get_db)):
    return optimize_department(db, payload.department_type, payload.predicted_demand_beds)

@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(db: Session = Depends(get_db)):
    return [build_recommendation(db, d.type) for d in db.query(Department).all()]

@router.get("/alerts", response_model=list[AlertOut])
def alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).limit(100).all()

@router.post("/data/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    raw = await file.read()
    if len(raw) > 50 * 1024 * 1024:
        raise HTTPException(413, "Dataset exceeds 50 MB limit")
    try:
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(BytesIO(raw))
        elif file.filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(BytesIO(raw))
        else:
            raise HTTPException(400, "Upload CSV or XLSX")
        count = ingest_dataframe(db, df)
        deps = sorted(df["department_type"].astype(str).str.upper().unique().tolist()) if "department_type" in df.columns else []
        dates = pd.to_datetime(df["timestamp"], errors="coerce") if "timestamp" in df.columns else pd.Series(dtype="datetime64[ns]")
        date_range = f"{dates.min().date()} to {dates.max().date()}" if not dates.dropna().empty else None
        return DatasetUploadResponse(rows_ingested=count, department_types_found=deps, date_range=date_range, message=f"Successfully ingested {count} rows.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))
