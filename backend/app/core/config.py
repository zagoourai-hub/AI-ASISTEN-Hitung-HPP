from functools import lru_cache
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "test", "staging", "production"]
SameSitePolicy = Literal["lax", "strict", "none"]
RateLimitBackend = Literal["memory", "redis"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_prefix="HPP_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: Annotated[str, Field(min_length=1, max_length=100)] = "AI Hitung HPP API"
    environment: Environment = "development"
    api_v1_prefix: Annotated[str, Field(pattern=r"^/api/v1$")] = "/api/v1"

    database_url: Annotated[str, Field(min_length=1)]
    database_command_timeout_seconds: Annotated[int, Field(gt=0, le=300)] = 10
    secret_key: SecretStr

    session_cookie_name: Annotated[str, Field(min_length=1, max_length=64)] = "hpp_session"
    session_cookie_secure: bool = False
    session_cookie_httponly: bool = True
    session_cookie_samesite: SameSitePolicy = "lax"
    session_cookie_domain: str | None = None
    session_cookie_max_age_seconds: Annotated[int, Field(gt=0, le=2_592_000)] = 604_800
    password_reset_token_max_age_seconds: Annotated[int, Field(gt=0, le=86_400)] = 3_600

    cors_allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    cors_allow_credentials: bool = True

    currency: Literal["IDR"] = "IDR"

    media_root: Annotated[str, Field(min_length=1)] = "media"
    product_image_max_bytes: Annotated[int, Field(gt=0, le=20_971_520)] = 5_242_880

    rate_limit_backend: RateLimitBackend = "memory"
    rate_limit_window_seconds: Annotated[int, Field(gt=0, le=86_400)] = 60
    rate_limit_requests: Annotated[int, Field(gt=0, le=10_000)] = 60
    rate_limit_login_requests: Annotated[int, Field(gt=0, le=100)] = 5
    rate_limit_ai_requests: Annotated[int, Field(gt=0, le=100)] = 20

    openrouter_api_key: SecretStr | None = None
    openrouter_model: Annotated[str, Field(min_length=1, max_length=120)] = "openrouter/free"
    openrouter_base_url: Annotated[str, Field(min_length=1, max_length=300)] = (
        "https://openrouter.ai/api/v1"
    )
    openrouter_http_referer: Annotated[str, Field(max_length=300)] | None = None
    openrouter_app_title: Annotated[str, Field(min_length=1, max_length=100)] = "HPP Pintar"
    openrouter_timeout_seconds: Annotated[float, Field(gt=0, le=300)] = 60.0
    openrouter_max_tokens: Annotated[int, Field(gt=0, le=4096)] = 800

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        parsed = urlsplit(value)
        if parsed.scheme != "postgresql+asyncpg" or not parsed.hostname:
            raise ValueError("database_url must use postgresql+asyncpg with a hostname")
        return value

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError("secret_key must contain at least 32 characters")
        return value

    @field_validator("cors_allowed_origins")
    @classmethod
    def validate_cors_origins(cls, origins: list[str]) -> list[str]:
        if not origins:
            raise ValueError("cors_allowed_origins must contain at least one origin")
        for origin in origins:
            parsed = urlsplit(origin)
            if origin == "*":
                continue
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError(f"invalid CORS origin: {origin}")
        return origins

    @model_validator(mode="after")
    def validate_security_policy(self) -> "Settings":
        if self.cors_allow_credentials and "*" in self.cors_allowed_origins:
            raise ValueError("wildcard CORS origin cannot be used with credentials")
        if self.session_cookie_samesite == "none" and not self.session_cookie_secure:
            raise ValueError("SameSite=None requires a secure session cookie")
        if self.environment == "production" and not self.session_cookie_secure:
            raise ValueError("production requires a secure session cookie")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
