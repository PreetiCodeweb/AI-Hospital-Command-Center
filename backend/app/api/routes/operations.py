from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO

from app.database.session import get_db
from app.models.models import Department, DepartmentType, Bed, BedStatus, Staff, Equipment, Alert
from app.schemas.schemas import BedOut, BedStatusUpdate, StaffOut, EquipmentOut, BedSummary, OptimizationRequest, OptimizationResponse, RecommendationOut, AlertOut, DatasetUploadResponse
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
