from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AI Hospital Command Center"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+psycopg://hospital:hospital_dev_password@localhost:5433/hospital_command_center"
    SECRET_KEY: str = "change-this-development-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:3000"
    AUTO_SEED: bool = False
    DATA_DIR: Path = Path("data")
    MODEL_ARTIFACT_DIR: Path = Path("data/models")
    MIN_TRAINING_ROWS: int = 72
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
