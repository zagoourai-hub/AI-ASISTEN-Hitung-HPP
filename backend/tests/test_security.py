from datetime import UTC, datetime, timedelta

import pytest
from pydantic import SecretStr
from starlette.responses import Response

from app.core.config import Settings
from app.core.security import (
    clear_session_cookie,
    hash_password,
    hash_token,
    is_token_active,
    issue_token,
    set_session_cookie,
    verify_password,
    verify_token,
)


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def test_password_hashing_uses_argon2id_and_never_verifies_wrong_secret() -> None:
    password_hash = hash_password("correct horse battery staple")

    assert password_hash.startswith("$argon2id$")
    assert verify_password("correct horse battery staple", password_hash) is True
    assert verify_password("wrong password", password_hash) is False

    with pytest.raises(ValueError):
        hash_password("short")


def test_token_hashing_and_lifecycle_support_expiry_and_revoke() -> None:
    issued_at = datetime(2026, 8, 21, 12, tzinfo=UTC)
    issued = issue_token(lifetime=timedelta(minutes=15), now=issued_at)

    assert issued.raw_token not in issued.token_hash
    assert hash_token(issued.raw_token) == issued.token_hash
    assert verify_token(issued.raw_token, issued.token_hash) is True
    assert verify_token("wrong", issued.token_hash) is False
    assert is_token_active(expires_at=issued.expires_at, now=issued_at) is True
    assert (
        is_token_active(
            expires_at=issued.expires_at,
            revoked_at=issued_at,
            now=issued_at,
        )
        is False
    )
    assert (
        is_token_active(
            expires_at=issued.expires_at,
            now=issued.expires_at + timedelta(microseconds=1),
        )
        is False
    )

    with pytest.raises(ValueError):
        issue_token(lifetime=timedelta(0), now=issued_at)


def test_session_cookie_is_http_only_and_not_a_response_body() -> None:
    settings = make_settings()
    response = Response(content=b'{"ok": true}')

    set_session_cookie(response, token="raw-session-token", settings=settings)
    cookie_header = response.headers["set-cookie"]

    assert "raw-session-token" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "SameSite=lax" in cookie_header
    assert "Secure" not in cookie_header
    response_body = response.body
    response_bytes = (
        response_body.tobytes() if isinstance(response_body, memoryview) else response_body
    )
    assert b"raw-session-token" not in response_bytes

    clear_session_cookie(response, settings=settings)
    assert settings.session_cookie_name in response.headers["set-cookie"]
