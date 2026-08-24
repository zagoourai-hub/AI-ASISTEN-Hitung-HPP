from typing import cast
from uuid import uuid4

import pytest
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.api.dependencies import CurrentAuth, current_business_dependency
from app.core.exceptions import AppError, ErrorCode
from app.models.auth import AuthSession, User
from app.models.business import Business, BusinessPricingSetting
from app.repositories.business import BusinessRepository
from app.utils.types import UserRole, utc_now


class FakeResult:
    def scalar_one_or_none(self) -> None:
        return None


class FakeSession:
    def __init__(self) -> None:
        self.statements: list[object] = []

    async def execute(self, statement: object) -> FakeResult:
        self.statements.append(statement)
        return FakeResult()


def make_user_business() -> tuple[User, Business]:
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash="stored-hash",
        role=UserRole.OWNER,
    )
    business = Business(
        id=uuid4(),
        owner_id=user.id,
        name="Warung Contoh",
        business_type="Kuliner",
    )
    user.business = business
    return user, business


@pytest.mark.asyncio
async def test_current_business_dependency_uses_authenticated_business() -> None:
    user, business = make_user_business()
    auth_session = AuthSession(
        id=uuid4(),
        user_id=user.id,
        token_hash="stored-token-hash",
        expires_at=utc_now(),
    )

    resolved = await current_business_dependency(CurrentAuth(user=user, auth_session=auth_session))

    assert resolved is business


@pytest.mark.asyncio
async def test_current_business_dependency_rejects_missing_business_context() -> None:
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash="stored-hash",
        role=UserRole.OWNER,
    )
    auth_session = AuthSession(
        id=uuid4(),
        user_id=user.id,
        token_hash="stored-token-hash",
        expires_at=utc_now(),
    )

    with pytest.raises(AppError) as error:
        await current_business_dependency(CurrentAuth(user=user, auth_session=auth_session))

    assert error.value.code == ErrorCode.INTERNAL_ERROR
    assert error.value.status_code == 500


@pytest.mark.asyncio
async def test_business_repository_queries_include_business_and_owner_scope() -> None:
    user, _business = make_user_business()
    other_business_id = uuid4()
    session = FakeSession()

    result = await BusinessRepository().find_owned_business(
        cast(AsyncSession, session),
        business_id=other_business_id,
        owner_id=user.id,
    )

    assert result is None
    statement = cast(Select[tuple[Business]], session.statements[0])
    sql = str(
        statement.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )
    assert str(other_business_id) in sql
    assert str(user.id) in sql
    assert "businesses.id" in sql
    assert "businesses.owner_id" in sql

    pricing_result = await BusinessRepository().find_pricing_setting(
        cast(AsyncSession, session),
        business_id=other_business_id,
    )
    assert pricing_result is None
    pricing_statement = cast(Select[tuple[BusinessPricingSetting]], session.statements[1])
    pricing_sql = str(
        pricing_statement.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )
    assert str(other_business_id) in pricing_sql
    assert "business_pricing_settings.business_id" in pricing_sql
