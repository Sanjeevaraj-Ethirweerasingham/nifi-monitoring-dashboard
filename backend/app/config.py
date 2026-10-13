from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "NiFi Monitoring Dashboard"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite+aiosqlite:///./nifi_monitoring.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    SEED_DEMO_DATA: bool = False
    POLL_INTERVAL_SECONDS: int = 60
    TEAMS_WEBHOOK_URL: str = "https://default83fb7e1f86fc4c09805bf546be68ff.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/db192a549cc749738b61d077d8bdcbef/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ewlIskjFqqqauSddBLOz770qcA0vIM2ohlx0ldpxoSc"
    TEAMS_NOTIFICATIONS_ENABLED: bool = True

    # Threshold configurations for instance health
    THRESHOLD_FILES_WARNING: int = 20
    THRESHOLD_FILES_CRITICAL: int = 100
    THRESHOLD_BYTES_WARNING: int = 200 * 1024 * 1024   # 200 MB
    THRESHOLD_BYTES_CRITICAL: int = 500 * 1024 * 1024  # 500 MB
    THRESHOLD_STOPPED_CRITICAL: int = 100              # stopped > 100


    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
