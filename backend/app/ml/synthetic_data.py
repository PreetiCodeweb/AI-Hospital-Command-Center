from datetime import datetime, timedelta
import math, random
import pandas as pd
from app.models.models import DepartmentType

DEPARTMENT_PROFILES = {
    DepartmentType.ICU: {"total_beds": 30, "base_occupancy": .72, "base_arrivals": 1.2, "staff_ratio": .35, "equip_total": 40},
    DepartmentType.EMERGENCY: {"total_beds": 40, "base_occupancy": .65, "base_arrivals": 4.0, "staff_ratio": .25, "equip_total": 25},
    DepartmentType.WARD: {"total_beds": 120, "base_occupancy": .68, "base_arrivals": 2.5, "staff_ratio": .15, "equip_total": 60},
    DepartmentType.OPERATING_ROOM: {"total_beds": 10, "base_occupancy": .55, "base_arrivals": .6, "staff_ratio": .40, "equip_total": 15},
    DepartmentType.ISOLATION: {"total_beds": 15, "base_occupancy": .40, "base_arrivals": .3, "staff_ratio": .30, "equip_total": 10},
}

def seasonal_multiplier(ts):
    hour = 1.0 + .35 * math.sin((ts.hour - 8) / 24 * 2 * math.pi)
    weekday = 1.10 if ts.weekday() < 5 else .85
    return max(.35, hour * weekday)

def generate_synthetic_history(department_type, days_back=60, freq_minutes=60, seed=42):
    profile = DEPARTMENT_PROFILES[department_type]
    rng = random.Random(f"{department_type.value}-{seed}")
    end = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days_back)
    timestamps = pd.date_range(start=start, end=end, freq=f"{freq_minutes}min")
    occupied = int(profile["total_beds"] * profile["base_occupancy"])
    rows = []

    for ts in timestamps:
        seasonal = seasonal_multiplier(ts.to_pydatetime())
        arrivals = max(0, round(rng.gauss(profile["base_arrivals"] * seasonal, .8)))
        discharges = max(0, round(rng.gauss(profile["base_arrivals"] * seasonal * .92, .8)))
        if rng.random() < .012:
            arrivals += rng.randint(8, 25)
        occupied = max(0, min(profile["total_beds"], occupied + arrivals - discharges))
        rows.append({
            "department_type": department_type.value,
            "timestamp": ts.to_pydatetime(),
            "arrivals": arrivals,
            "admissions_count": arrivals,
            "occupied_beds": occupied,
            "total_beds": profile["total_beds"],
            "occupancy_pct": occupied / profile["total_beds"] * 100,
            "staff_on_duty": max(2, round(profile["total_beds"] * profile["staff_ratio"] * seasonal)),
            "equipment_in_use": min(profile["equip_total"], max(0, round(occupied * rng.uniform(.5, .8)))),
            "equipment_total": profile["equip_total"],
            "day_of_week": ts.dayofweek,
            "hour_of_day": ts.hour,
            "is_holiday": False,
        })
    return pd.DataFrame(rows)

def generate_all_departments(days_back=60):
    return pd.concat(
        [generate_synthetic_history(d, days_back) for d in DepartmentType],
        ignore_index=True,
    )
