from sqlalchemy.orm import Session
from app.models.models import DepartmentType
from app.ml.data_utils import load_history
from app.ml.predictor import get_predictor
from app.schemas.schemas import ForecastResponse, FullForecastResponse

def run_forecast(db: Session, department_type: DepartmentType, metric: str, horizon_hours: int) -> ForecastResponse:
    history = load_history(db, department_type)
    result = get_predictor(department_type, metric)
    result.train(history)
    forecast = result.forecast(history, horizon_hours)
    return ForecastResponse(
        model_name=forecast.model_name,
        current_value=forecast.current_value,
        points=forecast.points,
        training_rows=forecast.training_rows,
        mae=forecast.mae,
    )

def run_full_forecast(db: Session, department_type: DepartmentType, horizon_hours: int) -> FullForecastResponse:
    response = run_forecast(db, department_type, "occupancy_pct", horizon_hours)
    return FullForecastResponse(department_type=department_type, metric="occupancy_pct", **response.model_dump())
