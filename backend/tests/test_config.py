import pytest
from pydantic import SecretStr, ValidationError

from app.core.config import Environment, Settings

VALID_DATABASE_URL = "postgresql+asyncpg://hpp_user:change_me@localhost:5432/hpp"
VALID_SECRET = "x" * 32


def make_settings(
    *,
    environment: Environment = "development",
    cors_allowed_origins: list[str] | None = None,
    cors_allow_credentials: bool = True,
) -> Settings:
    return Settings(
        database_url=VALID_DATABASE_URL,
        secret_key=SecretStr(VALID_SECRET),
        environment=environment,
        cors_allowed_origins=cors_allowed_origins or ["http://localhost:3000"],
        cors_allow_credentials=cors_allow_credentials,
    )


def test_mvp_defaults_are_typed_and_safe() -> None:
    settings = make_settings()

    assert settings.currency == "IDR"
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.session_cookie_httponly is True
    assert settings.database_command_timeout_seconds == 10
    assert settings.rate_limit_backend == "memory"


def test_secret_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("HPP_SECRET_KEY", raising=False)

    with pytest.raises(ValidationError):
        Settings(database_url=VALID_DATABASE_URL)  # pyright: ignore[reportCallIssue]


def test_credentials_reject_wildcard_cors() -> None:
    with pytest.raises(ValidationError, match="wildcard CORS"):
        make_settings(cors_allowed_origins=["*"], cors_allow_credentials=True)


def test_production_requires_secure_cookie() -> None:
    with pytest.raises(ValidationError, match="production"):
        make_settings(environment="production")
