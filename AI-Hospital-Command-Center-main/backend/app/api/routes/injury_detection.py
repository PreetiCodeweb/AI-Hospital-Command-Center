from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.injury_schemas import BodyRegion, InjuryScanRequest, InjuryScanResponse
from app.services.injury_detection_service import run_demo_scan

router = APIRouter(prefix="/injury-scan", tags=["Injury Detection (Demo)"])


@router.post("/simulate", response_model=InjuryScanResponse)
def simulate_scan(payload: InjuryScanRequest):
    #run the demo
    return run_demo_scan(patient_ref=payload.patient_ref, region_hint=payload.simulate_region_hint)


@router.post("/upload", response_model=InjuryScanResponse)
async def upload_scan(
    file: UploadFile = File(..., description="Image/video file (content is not actually analysed in this demo)"),
    patient_ref: Optional[str] = Form(default=None),
    region_hint: Optional[BodyRegion] = Form(default=None),
):
    _ = await file.read()
    return run_demo_scan(patient_ref=patient_ref, region_hint=region_hint)