from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="VITALGUARD AI BACKEND", alias="APP_NAME")
    app_env: str = Field(default="production", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    storage_mode: str = Field(default="memory", alias="STORAGE_MODE")

    model_path: str = Field(default="classifier/fall_model.pkl", alias="MODEL_PATH")
    use_mock_inference: bool = Field(default=True, alias="USE_MOCK_INFERENCE")
    use_mock_stream: bool = Field(default=True, alias="USE_MOCK_STREAM")
    mock_room_ids: str = Field(default="401,402,403", alias="MOCK_ROOM_IDS")

    window_size: int = Field(default=20, alias="WINDOW_SIZE")
    step_size: int = Field(default=5, alias="STEP_SIZE")
    chart_cache_size: int = Field(default=120, alias="CHART_CACHE_SIZE")
    stale_room_seconds: int = Field(default=20, alias="STALE_ROOM_SECONDS")

    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @property
    def cors_allow_all(self) -> bool:
        origins = self.cors_origin_list
        return not origins or origins == ["*"]

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def mock_rooms(self) -> list[str]:
        return [rid.strip() for rid in self.mock_room_ids.split(",") if rid.strip()]

    @property
    def resolved_model_path(self) -> Path:
        path = Path(self.model_path)
        if path.is_absolute():
            return path
        return (Path(__file__).resolve().parents[1] / path).resolve()

    @field_validator("window_size")
    @classmethod
    def validate_window_size(cls, value: int) -> int:
        if value < 5:
            raise ValueError("WINDOW_SIZE must be >= 5")
        return value

    @field_validator("step_size")
    @classmethod
    def validate_step_size(cls, value: int) -> int:
        if value < 1:
            raise ValueError("STEP_SIZE must be >= 1")
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
