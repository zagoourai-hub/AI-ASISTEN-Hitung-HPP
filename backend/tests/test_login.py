from collections.abc import AsyncIterator
from datetime import timedelta
from decimal import Decimal
from typing import cast
from uuid import uuid4

import httpx
import pytest
from fastapi import FastAPI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.security import hash_password, hash_token
from app.main import create_app
from app.models.auth import AuthSession, User
from app.models.business import Business
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
        self.transaction = FakeTransaction()
        self.committed = False
        self.commit_calls = 0

    def begin(self) -> FakeTransaction:
        return self.transaction

    async def execute(self, statement: object) -> FakeResult:
        return FakeResult(self.result)

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        return None

    async def commit(self) -> None:
        self.committed = True
        self.commit_calls += 1


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_user() -> User:
    return User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=hash_password("correct horse battery staple"),
        role=UserRole.OWNER,
    )


def make_business(user: User) -> Business:
    business = Business(
        id=uuid4(),
        owner_id=user.id,
        name="Warung Contoh",
        business_type="Kuliner",
        timezone="Asia/Jakarta",
        default_target_margin=Decimal("0.30"),
    )
    user.business = business
    return business


def make_auth_session(user: User, raw_token: str) -> AuthSession:
    auth_session = AuthSession(
        id=uuid4(),
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=utc_now() + timedelta(minutes=15),
    )
    auth_session.user = user
    return auth_session


def override_database(application: FastAPI, fake_session: FakeSession, settings: Settings) -> None:
    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, fake_session)

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[get_settings] = lambda: settings


@pytest.mark.asyncio
async def test_login_sets_cookie_and_returns_public_identity_only() -> None:
    settings = make_settings()
    user = make_user()
    make_business(user)
    fake_session = FakeSession(user)
    application = create_app(settings)
    override_database(application, fake_session, settings)
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "OWNER@EXAMPLE.COM",
                "password": "correct horse battery staple",
            },
        )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "owner@example.com"
    assert "raw_session_token" not in response.text
    assert "hpp_session=" in response.headers["set-cookie"]
    assert len(fake_session.added) == 1


@pytest.mark.asyncio
async def test_login_rejects_wrong_password_without_writes() -> None:
    settings = make_settings()
    user = make_user()
    make_business(user)
    fake_session = FakeSession(user)
    application = create_app(settings)
    override_database(application, fake_session, settings)
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner@example.com", "password": "wrong password"},
        )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
    assert fake_session.added == []
    assert fake_session.transaction.rolled_back is True


@pytest.mark.asyncio
async def test_current_user_logout_revokes_session_and_protected_route_requires_cookie() -> None:
    settings = make_settings()
    user = make_user()
    make_business(user)
    raw_token = "raw-session-token"
    auth_session = make_auth_session(user, raw_token)
    fake_session = FakeSession(auth_session)
    application = create_app(settings)
    override_database(application, fake_session, settings)
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        unauthorized = await client.get("/api/v1/auth/me")
        client.cookies.set(settings.session_cookie_name, raw_token)
        current_user = await client.get("/api/v1/auth/me")
        logout = await client.post("/api/v1/auth/logout")

    assert unauthorized.status_code == 401
    assert current_user.status_code == 200
    assert current_user.json()["business"]["name"] == "Warung Contoh"
    assert logout.status_code == 204
    assert auth_session.revoked_at is not None
    assert fake_session.committed is True
    assert fake_session.commit_calls == 3


@pytest.mark.asyncio
async def test_expired_session_is_rejected() -> None:
    settings = make_settings()
    user = make_user()
    make_business(user)
    auth_session = make_auth_session(user, "expired-session-token")
    auth_session.expires_at = utc_now() - timedelta(minutes=1)
    fake_session = FakeSession(auth_session)
    application = create_app(settings)
    override_database(application, fake_session, settings)
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        client.cookies.set(settings.session_cookie_name, "expired-session-token")
        response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
