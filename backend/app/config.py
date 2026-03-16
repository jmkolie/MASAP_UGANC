from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/masap_uganc"
    SECRET_KEY: str = "change-this-secret-key-minimum-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = '["http://localhost:3000"]'
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    APP_NAME: str = "MASAP-UGANC Portal"
    APP_VERSION: str = "1.0.0"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def origins_list(self) -> List[str]:
        return json.loads(self.ALLOWED_ORIGINS)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
