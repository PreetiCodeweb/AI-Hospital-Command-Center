from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import DepartmentType
from app.schemas.schemas import ForecastRequest, ForecastResponse, FullForecastResponse
from app.services.forecasting import run_forecast, run_full_forecast

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.post("", response_model=ForecastResponse)
def forecast(payload: ForecastRequest, db: Session = Depends(get_db)):
    try:
        return run_forecast(db, payload.department_type, payload.metric, payload.horizon_hours)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.get("/{department_type}", response_model=FullForecastResponse)
def full_forecast(department_type: DepartmentType, horizon_hours: int = Query(12, ge=1, le=168), db: Session = Depends(get_db)):
    return run_full_forecast(db, department_type, horizon_hours)
