import os
from typing import List
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project Info
    PROJECT_NAME: str = "PlateVision ANPR"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api"
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # Security
    SECRET_KEY: str = "platevision-super-secret-production-grade-jwt-key-2026-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./platevision.db"

    # Storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 25

    # ML & CV
    YOLO_MODEL_PATH: str = str(BASE_DIR / "ml" / "models" / "plate_detector.pt")
    CONFIDENCE_THRESHOLD: float = 0.35
    IOU_THRESHOLD: float = 0.45

    # Admin Defaults
    ADMIN_EMAIL: str = "admin@platevision.ai"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "AdminPassword@123"

    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        import json
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["*"]

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "originals"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "crops"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "pipeline"), exist_ok=True)
os.makedirs(str(BASE_DIR / "ml" / "models"), exist_ok=True)
