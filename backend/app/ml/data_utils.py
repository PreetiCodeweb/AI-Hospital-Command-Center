from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.models.models import DepartmentType, HistoricalMetric
from app.ml.synthetic_data import generate_synthetic_history

settings = get_settings()

def synthetic_cache_path(department_type):
    path = Path(settings.DATA_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path / f"synthetic_{department_type.value}.csv"

def load_history(db: Session, department_type, min_rows=72, days_back=60):
    rows = db.query(HistoricalMetric).filter(
        HistoricalMetric.department_type == department_type
    ).order_by(HistoricalMetric.timestamp.asc()).all()

    if len(rows) >= min_rows:
        return pd.DataFrame([{
            "timestamp": r.timestamp,
            "arrivals": r.arrivals,
            "occupied_beds": r.occupied_beds,
            "total_beds": r.total_beds,
            "occupancy_pct": (r.occupied_beds / r.total_beds * 100) if r.total_beds else 0,
            "staff_on_duty": r.staff_on_duty,
            "equipment_in_use": r.equipment_in_use,
            "equipment_total": r.equipment_total,
        } for r in rows])

    cache = synthetic_cache_path(department_type)
    if cache.exists():
        return pd.read_csv(cache, parse_dates=["timestamp"])

    df = generate_synthetic_history(department_type, days_back=days_back)
    df.to_csv(cache, index=False)
    return df

def validate_dataframe(df):
    df.columns = [str(c).strip().lower() for c in df.columns]
    required = {"timestamp", "department_type"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")
    if df.empty:
        raise ValueError("Dataset contains no rows")
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="raise")

def ingest_dataframe(db: Session, dataframe: pd.DataFrame):
    dataframe = dataframe.rename(columns={c: str(c).strip().lower() for c in dataframe.columns})
    validate_dataframe(dataframe)
    valid = {d.value for d in DepartmentType}
    inserted = 0

    for _, row in dataframe.iterrows():
        dep = str(row["department_type"]).strip().upper()
        if dep not in valid:
            continue
        ts = pd.Timestamp(row["timestamp"])
        def integer(column, default=0):
            value = row.get(column, default)
            return default if pd.isna(value) else int(value)
        db.add(HistoricalMetric(
            department_type=DepartmentType[dep],
            timestamp=ts.to_pydatetime(),
            arrivals=integer("arrivals"),
            admissions_count=integer("admissions_count", integer("arrivals")),
            occupied_beds=integer("occupied_beds"),
            total_beds=integer("total_beds"),
            staff_on_duty=integer("staff_on_duty"),
            equipment_in_use=integer("equipment_in_use"),
            equipment_total=integer("equipment_total"),
            day_of_week=ts.dayofweek,
            hour_of_day=ts.hour,
            is_holiday=bool(row.get("is_holiday", False)),
        ))
        inserted += 1
    db.commit()
    return inserted
