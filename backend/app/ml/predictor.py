from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from app.core.config import get_settings

settings = get_settings()
MIN_TRAINING_ROWS = settings.MIN_TRAINING_ROWS
LAGS = (1, 2, 3, 24, 168)
ROLLING_WINDOWS = (6, 24)
FEATURE_COLUMNS = (
    ["hour_of_day", "day_of_week", "is_weekend"]
    + [f"lag_{x}" for x in LAGS]
    + [f"roll_mean_{x}" for x in ROLLING_WINDOWS]
)
SUPPORTED_METRICS = {"occupancy_pct", "arrivals", "staff_needed", "equipment_needed"}
METRIC_COLUMN_MAP = {
    "occupancy_pct": "occupancy_pct",
    "arrivals": "arrivals",
    "staff_needed": "staff_on_duty",
    "equipment_needed": "equipment_in_use",
}

@dataclass
class ForecastPointResult:
    timestamp: datetime
    value: float
    lower_bound: float
    upper_bound: float

@dataclass
class ForecastResult:
    model_name: str
    current_value: float | None
    points: list[ForecastPointResult]
    training_rows: int
    mae: float | None = None

class DemandPredictor:
    def __init__(self, department_type, metric):
        if metric not in SUPPORTED_METRICS:
            raise ValueError(f"Unsupported metric '{metric}'")
        self.department_type = department_type
        self.metric = metric
        self.model = None
        self.residual_std = 0.0
        self._last_mae = None
        self.artifact_path = Path(settings.MODEL_ARTIFACT_DIR) / f"{department_type.value}__{metric}.joblib"

    def _load_cached_model(self):
        if not self.artifact_path.exists():
            return False
        try:
            p = joblib.load(self.artifact_path)
            self.model = p["model"]
            self.residual_std = p.get("residual_std", 0.0)
            self._last_mae = p.get("mae")
            return True
        except Exception:
            self.model = None
            return False

    def _save_model(self):
        joblib.dump({"model": self.model, "residual_std": self.residual_std, "mae": self._last_mae}, self.artifact_path)

    @staticmethod
    def engineer_features(series):
        df = pd.DataFrame({"y": series})
        df["hour_of_day"] = df.index.hour
        df["day_of_week"] = df.index.dayofweek
        df["is_weekend"] = (df.index.dayofweek >= 5).astype(int)
        for lag in LAGS:
            df[f"lag_{lag}"] = df["y"].shift(lag)
        for window in ROLLING_WINDOWS:
            df[f"roll_mean_{window}"] = df["y"].shift(1).rolling(window, min_periods=1).mean()
        return df

    def _series_from_history(self, history_df):
        if history_df.empty:
            return pd.Series(dtype=float)
        df = history_df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").set_index("timestamp")
        col = METRIC_COLUMN_MAP[self.metric]
        if col not in df.columns:
            raise ValueError(f"History is missing column '{col}'")
        return df[col].astype(float).resample("h").mean().interpolate(limit_direction="both")

    def train(self, history_df, force=False):
        if not force and self._load_cached_model():
            return -1
        series = self._series_from_history(history_df)
        if len(series) < MIN_TRAINING_ROWS:
            self.model = None
            return len(series)
        features = self.engineer_features(series).dropna()
        X, y = features[FEATURE_COLUMNS], features["y"]
        if len(X) < 20:
            self.model = None
            return len(series)
        split = max(1, int(len(X) * .85))
        model = GradientBoostingRegressor(
            n_estimators=250, max_depth=3, learning_rate=.05,
            subsample=.9, random_state=42, loss="huber"
        )
        model.fit(X.iloc[:split], y.iloc[:split])
        self.model = model
        residuals = y.iloc[:split] - model.predict(X.iloc[:split])
        self.residual_std = float(np.std(residuals)) if len(residuals) else 0.0
        self._last_mae = float(mean_absolute_error(y.iloc[split:], model.predict(X.iloc[split:]))) if len(X.iloc[split:]) else None
        self._save_model()
        return len(series)

    def forecast(self, history_df, horizon_hours=12):
        series = self._series_from_history(history_df)
        current = float(series.iloc[-1]) if not series.empty else None
        if self.model is None and self.artifact_path.exists():
            self._load_cached_model()
        if self.model is None or len(series) < MIN_TRAINING_ROWS:
            return ForecastResult("seasonal_naive_baseline", current, self._baseline(series, horizon_hours), len(series))
        return ForecastResult("gradient_boosting_regressor", current, self._ml_forecast(series, horizon_hours), len(series), self._last_mae)

    def _ml_forecast(self, series, horizon):
        extended = series.copy()
        results = []
        last = series.index[-1]
        for step in range(1, horizon + 1):
            ts = last + timedelta(hours=step)
            padded = pd.concat([extended, pd.Series([np.nan], index=[ts])])
            row = self.engineer_features(padded).iloc[[-1]][FEATURE_COLUMNS].ffill().fillna(0)
            pred = max(0.0, float(self.model.predict(row)[0]))
            spread = self.residual_std * (1 + .12 * step)
            results.append(ForecastPointResult(ts, round(pred, 2), round(max(0, pred - 1.28 * spread), 2), round(pred + 1.28 * spread, 2)))
            extended.loc[ts] = pred
        return results

    def _baseline(self, series, horizon):
        if series.empty:
            now = datetime.utcnow()
            return [ForecastPointResult(now + timedelta(hours=i), 0, 0, 0) for i in range(1, horizon + 1)]
        last = series.index[-1]
        mean = float(series.tail(24).mean())
        std = float(series.tail(48).std()) if len(series) > 1 else 0.0
        std = std if np.isfinite(std) and std > 0 else max(mean * .10, 1.0)
        trend = float((series.iloc[-1] - series.iloc[-6]) / 6) if len(series) >= 6 else 0.0
        out = []
        for step in range(1, horizon + 1):
            ts = last + timedelta(hours=step)
            weekly = ts - timedelta(days=7)
            base = float(series.loc[weekly]) if weekly in series.index else mean
            value = max(0, base + trend * step * .5)
            spread = std * (1 + .10 * step)
            out.append(ForecastPointResult(ts, round(value, 2), round(max(0, value - 1.28 * spread), 2), round(value + 1.28 * spread, 2)))
        return out

_predictor_cache = {}

def get_predictor(department_type, metric):
    key = (department_type.value, metric)
    if key not in _predictor_cache:
        _predictor_cache[key] = DemandPredictor(department_type, metric)
    return _predictor_cache[key]
