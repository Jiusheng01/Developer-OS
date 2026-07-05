from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET_KEY = "developer-os-local-secret-change-me"


class Settings(BaseSettings):
    app_name: str = "Developer OS API"
    app_version: str = "0.3.0"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./backend/developer_os.db"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://127.0.0.1:3000", "http://localhost:3000"]
    )
    jwt_secret_key: str = DEFAULT_JWT_SECRET_KEY
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    public_registration_enabled: bool = True
    redis_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="DEVELOPER_OS_",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("jwt_secret_key", mode="before")
    @classmethod
    def default_blank_jwt_secret(cls, value: object) -> object:
        if value is None:
            return DEFAULT_JWT_SECRET_KEY
        if isinstance(value, str) and not value.strip():
            return DEFAULT_JWT_SECRET_KEY
        return value

    @field_validator("jwt_algorithm", mode="before")
    @classmethod
    def default_blank_jwt_algorithm(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return "HS256"
        return value

    @field_validator("jwt_access_token_expire_minutes")
    @classmethod
    def validate_token_expiry(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("jwt_access_token_expire_minutes must be positive")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
