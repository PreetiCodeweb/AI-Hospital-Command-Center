from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import SurgeSimulationRequest, SurgeSimulationResponse
from app.services.simulation import simulate

router = APIRouter(prefix="/simulations", tags=["Simulation"])

@router.post("", response_model=SurgeSimulationResponse)
def run_simulation(payload: SurgeSimulationRequest, db: Session = Depends(get_db)):
    try:
        return simulate(db, payload.department_type, payload.additional_arrivals, payload.window_hours, payload.apply_optimization)
    except ValueError as e:
        raise HTTPException(400, str(e))
