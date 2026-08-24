from collections.abc import AsyncIterator
from datetime import timedelta
from typing import cast
from uuid import uuid4

import httpx
import pytest
from fastapi import FastAPI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.core.security import hash_password, issue_token, verify_password
from app.main import create_app
from app.models.auth import PasswordResetToken, User
from app.schemas.auth import PasswordResetConfirmRequest, PasswordResetRequest
from app.services.auth import AuthPasswordResetService
from app.utils.types import UserRole, utc_now


class FakeTransaction:
    def __init__(self) -> None:
        self.rolled_back = False

    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        self.rolled_back = exc_type is not None
        return False


class FakeResult:
    def __init__(self, value: object) -> None:
        self.value = value

    def scalar_one_or_none(self) -> object:
        return self.value


class FakeSession:
    def __init__(self, result: object) -> None:
        self.result = result
        self.added: list[object] = []
        self.executed: list[object] = []
        self.transaction = FakeTransaction()

    def begin(self) -> FakeTransaction:
        return self.transaction

    async def execute(self, statement: object) -> FakeResult:
        self.executed.append(statement)
        return FakeResult(self.result)

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        return None


def make_settings(rate_limit_requests: int = 60) -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        rate_limit_requests=rate_limit_requests,
    )


def make_user() -> User:
    return User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=hash_password("old password value"),
        role=UserRole.OWNER,
    )


async def override_database(
    application: FastAPI,
    fake_session: FakeSession,
    settings: Settings,
) -> None:
    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, fake_session)

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[get_settings] = lambda: settings


@pytest.mark.asyncio
async def test_reset_request_creates_hashed_token_and_hides_identity() -> None:
    user = make_user()
    session = FakeSession(user)
    result = await AuthPasswordResetService(
        cast(AsyncSession, session),
        make_settings(),
    ).request(PasswordResetRequest(email="OWNER@EXAMPLE.COM"))

    assert result.raw_token
    assert len(session.added) == 1
    reset_token = cast(PasswordResetToken, session.added[0])
    assert result.raw_token not in reset_token.token_hash

    unknown_session = FakeSession(None)
    unknown_result = await AuthPasswordResetService(
        cast(AsyncSession, unknown_session),
        make_settings(),
    ).request(PasswordResetRequest(email="missing@example.com"))
    assert unknown_result.raw_token is None
    assert unknown_session.added == []


@pytest.mark.asyncio
async def test_reset_confirm_changes_password_revokes_sessions_and_is_one_time() -> None:
    user = make_user()
    issued = issue_token(lifetime=timedelta(hours=1))
    reset_token = PasswordResetToken(
        id=uuid4(),
        user_id=user.id,
        token_hash=issued.token_hash,
        expires_at=issued.expires_at,
    )
    reset_token.user = user
    session = FakeSession(reset_token)
    service = AuthPasswordResetService(cast(AsyncSession, session), make_settings())
    payload = PasswordResetConfirmRequest(
        token=issued.raw_token,
        new_password="new password value",
    )

    await service.confirm(payload)

    assert reset_token.used_at is not None
    assert verify_password("new password value", user.password_hash) is True
    assert len(session.executed) == 2

    with pytest.raises(AppError) as error:
        await service.confirm(payload)
    assert error.value.code == ErrorCode.UNAUTHENTICATED
    assert session.transaction.rolled_back is True


@pytest.mark.asyncio
async def test_reset_confirm_rejects_expired_token() -> None:
    user = make_user()
    issued = issue_token(lifetime=timedelta(hours=1))
    reset_token = PasswordResetToken(
        id=uuid4(),
        user_id=user.id,
        token_hash=issued.token_hash,
        expires_at=utc_now() - timedelta(minutes=1),
    )
    reset_token.user = user
    session = FakeSession(reset_token)

    with pytest.raises(AppError) as error:
        await AuthPasswordResetService(
            cast(AsyncSession, session),
            make_settings(),
        ).confirm(
            PasswordResetConfirmRequest(
                token=issued.raw_token,
                new_password="new password value",
            )
        )

    assert error.value.code == ErrorCode.UNAUTHENTICATED
    assert user.password_hash != "new password value"


@pytest.mark.asyncio
async def test_reset_confirm_route_returns_success_without_token() -> None:
    user = make_user()
    issued = issue_token(lifetime=timedelta(hours=1))
    reset_token = PasswordResetToken(
        id=uuid4(),
        user_id=user.id,
        token_hash=issued.token_hash,
        expires_at=issued.expires_at,
    )
    reset_token.user = user
    settings = make_settings()
    application = create_app(settings)
    await override_database(application, FakeSession(reset_token), settings)
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={"token": issued.raw_token, "new_password": "new password value"},
        )

    assert response.status_code == 200
    assert response.json() == {"message": "Password has been reset."}
    assert issued.raw_token not in response.text


@pytest.mark.asyncio
async def test_reset_routes_return_generic_response_and_rate_limit_public_requests() -> None:
    settings = make_settings(rate_limit_requests=1)
    first_session = FakeSession(make_user())
    first_app = create_app(settings)
    await override_database(first_app, first_session, settings)
    first_transport = httpx.ASGITransport(app=first_app)

    async with httpx.AsyncClient(transport=first_transport, base_url="http://testserver") as client:
        first = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "owner@example.com"},
        )
        limited = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "owner@example.com"},
        )

    assert first.status_code == 200
    assert first.json() == {
        "message": "If the account exists, password reset instructions have been sent."
    }
    assert "raw_token" not in first.text
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "RATE_LIMITED"

    unknown_settings = make_settings()
    unknown_app = create_app(unknown_settings)
    await override_database(unknown_app, FakeSession(None), unknown_settings)
    unknown_transport = httpx.ASGITransport(app=unknown_app)
    async with httpx.AsyncClient(
        transport=unknown_transport,
        base_url="http://testserver",
    ) as client:
        unknown = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "missing@example.com"},
        )

    assert unknown.status_code == 200
    assert unknown.json() == first.json()
