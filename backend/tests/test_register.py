from collections.abc import AsyncIterator
from typing import cast
from uuid import uuid4

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.core.security import hash_password
from app.main import create_app
from app.models.auth import User
from app.schemas.auth import RegisterRequest
from app.services.auth import AuthRegistrationService
from app.utils.types import UserRole


class FakeResult:
    def __init__(self, user: User | None) -> None:
        self.user = user

    def scalar_one_or_none(self) -> User | None:
        return self.user


class FakeTransaction:
    def __init__(self, session: "FakeSession") -> None:
        self.session = session
        self.rolled_back = False

    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        self.rolled_back = exc_type is not None
        return False


class FakeSession:
    def __init__(self, existing_user: User | None = None) -> None:
        self.existing_user = existing_user
        self.added: list[object] = []
        self.transaction = FakeTransaction(self)

    def begin(self) -> FakeTransaction:
        return self.transaction

    async def execute(self, statement: object) -> FakeResult:
        return FakeResult(self.existing_user)

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        return None


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_payload() -> RegisterRequest:
    return RegisterRequest(
        email=" Owner@Example.COM ",
        password="correct horse battery staple",
        business_name="Warung Contoh",
        business_type="Kuliner",
    )


@pytest.mark.asyncio
async def test_register_service_creates_four_records_in_one_transaction() -> None:
    session = FakeSession()
    result = await AuthRegistrationService(cast(AsyncSession, session), make_settings()).register(
        make_payload()
    )

    assert session.transaction.rolled_back is False
    assert len(session.added) == 4
    assert result.user.email == "owner@example.com"
    assert result.user.role == UserRole.OWNER
    assert result.business.owner_id == result.user.id
    assert result.raw_session_token
    assert result.user.password_hash != make_payload().password


@pytest.mark.asyncio
async def test_duplicate_email_fails_before_writes_and_rolls_back() -> None:
    existing_user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=hash_password("correct horse battery staple"),
        role=UserRole.OWNER,
    )
    session = FakeSession(existing_user=existing_user)

    with pytest.raises(AppError) as error:
        await AuthRegistrationService(cast(AsyncSession, session), make_settings()).register(
            make_payload()
        )

    assert error.value.code == ErrorCode.DUPLICATE_RESOURCE
    assert session.transaction.rolled_back is True
    assert session.added == []


@pytest.mark.asyncio
async def test_register_route_returns_no_raw_token_and_sets_cookie() -> None:
    settings = make_settings()
    fake_session = FakeSession()
    application = create_app(settings)

    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, fake_session)

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[get_settings] = lambda: settings
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "owner@example.com",
                "password": "correct horse battery staple",
                "business_name": "Warung Contoh",
                "business_type": "Kuliner",
            },
        )

    assert response.status_code == 201
    assert "raw_session_token" not in response.text
    assert "hpp_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
