from collections.abc import AsyncIterator
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import httpx
import pytest
from pydantic import SecretStr, ValidationError
from sqlalchemy import CheckConstraint, ForeignKeyConstraint, Index, Numeric, UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import current_business_dependency
from app.core.config import Settings
from app.core.database import get_db_session
from app.main import create_app
from app.models import AuditLog, Business, CashBalance, CashTransaction
from app.models.base import MONEY_NUMERIC, Base
from app.repositories.cash import CashRepository
from app.schemas.cash import (
    CashBalanceResponse,
    CashBalanceUpdateRequest,
    CashSummaryResponse,
    CashTransactionCreateRequest,
    CashTransactionResponse,
    CashTransactionUpdateRequest,
)
from app.services.cash import CashService
from app.utils.types import CashTransactionType


class FakeTransaction:
    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.deleted: list[object] = []

    def begin(self) -> FakeTransaction:
        return FakeTransaction()

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def delete(self, instance: object) -> None:
        self.deleted.append(instance)

    async def flush(self) -> None:
        return None


class FakeCashRepository:
    def __init__(self, business_id: UUID) -> None:
        self.business_id = business_id
        self.balance: CashBalance | None = None
        self.transactions: dict[UUID, CashTransaction] = {}

    async def find_balance(self, session: AsyncSession, *, business_id: UUID) -> CashBalance | None:
        return self.balance if business_id == self.business_id else None

    async def find_transaction(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        transaction_id: UUID,
    ) -> CashTransaction | None:
        if business_id != self.business_id:
            return None
        return self.transactions.get(transaction_id)

    async def list_transactions(
        self,
        *args: object,
        **kwargs: object,
    ) -> tuple[list[CashTransaction], int]:
        return list(self.transactions.values()), len(self.transactions)

    async def sum_transactions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        date_from: date,
        date_to: date,
    ) -> tuple[Decimal, Decimal]:
        if business_id != self.business_id:
            return Decimal("0"), Decimal("0")
        selected = [
            item
            for item in self.transactions.values()
            if date_from <= item.transaction_date <= date_to
        ]
        return (
            sum(
                (item.amount for item in selected if item.type == CashTransactionType.INCOME),
                Decimal(),
            ),
            sum(
                (item.amount for item in selected if item.type == CashTransactionType.EXPENSE),
                Decimal(),
            ),
        )

    def add_balance(self, session: AsyncSession, balance: CashBalance) -> None:
        self.balance = balance
        session.add(balance)

    def add_transaction(self, session: AsyncSession, transaction: CashTransaction) -> None:
        self.transactions[transaction.id] = transaction
        session.add(transaction)


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_business() -> Business:
    return Business(id=uuid4(), owner_id=uuid4(), name="Warung Contoh", business_type="Kuliner")


def make_transaction(
    *,
    business_id: UUID,
    transaction_type: CashTransactionType,
    amount: str,
    transaction_date: date,
) -> CashTransaction:
    timestamp = datetime(2026, 8, 27, 10, tzinfo=UTC)
    return CashTransaction(
        id=uuid4(),
        business_id=business_id,
        type=transaction_type,
        amount=Decimal(amount),
        category="Operasional",
        note=None,
        transaction_date=transaction_date,
        created_at=timestamp,
        updated_at=timestamp,
    )


def test_cash_models_enforce_tenant_scope_and_money_constraints() -> None:
    balances = Base.metadata.tables[CashBalance.__tablename__]
    transactions = Base.metadata.tables[CashTransaction.__tablename__]
    balance_checks = {
        item.name for item in balances.constraints if isinstance(item, CheckConstraint)
    }
    transaction_checks = {
        item.name for item in transactions.constraints if isinstance(item, CheckConstraint)
    }
    balance_fks = [item for item in balances.constraints if isinstance(item, ForeignKeyConstraint)]
    transaction_fks = [
        item for item in transactions.constraints if isinstance(item, ForeignKeyConstraint)
    ]
    transaction_uniques = {
        item.name for item in balances.constraints if isinstance(item, UniqueConstraint)
    }

    assert "ck_cash_balances_opening_balance_non_negative" in balance_checks
    assert "ck_cash_transactions_amount_positive" in transaction_checks
    assert balance_fks[0].ondelete == "CASCADE"
    assert transaction_fks[0].ondelete == "CASCADE"
    assert "uq_cash_balances_business_id" in transaction_uniques
    assert any(
        isinstance(index, Index) and index.name == "cash_transactions_business_date"
        for index in transactions.indexes
    )
    amount_type = cast(Numeric[Decimal], transactions.c.amount.type)
    assert amount_type.precision == MONEY_NUMERIC.precision
    assert amount_type.scale == MONEY_NUMERIC.scale


def test_cash_schemas_accept_camel_case_and_reject_invalid_amounts() -> None:
    balance = CashBalanceUpdateRequest.model_validate({"openingBalance": "100000"})
    transaction = CashTransactionCreateRequest.model_validate(
        {
            "type": "INCOME",
            "amount": "25000",
            "category": "  Penjualan  ",
            "transactionDate": "2026-08-27",
        }
    )

    assert balance.opening_balance == Decimal("100000")
    assert transaction.category == "Penjualan"
    assert transaction.transaction_date == date(2026, 8, 27)
    with pytest.raises(ValidationError):
        CashTransactionCreateRequest.model_validate({"type": "EXPENSE", "amount": "0"})
    with pytest.raises(ValidationError):
        CashBalanceUpdateRequest.model_validate({"openingBalance": "-1"})
    with pytest.raises(ValidationError):
        CashTransactionUpdateRequest.model_validate({})


@pytest.mark.asyncio
async def test_cash_service_is_tenant_scoped_and_writes_audit_records() -> None:
    business_id = uuid4()
    actor_id = uuid4()
    request_id = uuid4()
    session = FakeSession()
    repository = FakeCashRepository(business_id)
    service = CashService(
        cast(AsyncSession, session),
        repository=cast(CashRepository, repository),
    )

    balance = await service.update_balance(
        business_id=business_id,
        payload=CashBalanceUpdateRequest.model_validate({"openingBalance": "100000.12345"}),
        actor_id=actor_id,
        request_id=request_id,
    )
    transaction = await service.create_transaction(
        business_id=business_id,
        payload=CashTransactionCreateRequest.model_validate(
            {"type": "INCOME", "amount": "25000", "transactionDate": "2026-08-27"}
        ),
        actor_id=actor_id,
        request_id=request_id,
    )
    await service.update_transaction(
        business_id=business_id,
        transaction_id=transaction.id,
        payload=CashTransactionUpdateRequest.model_validate({"amount": "30000"}),
        actor_id=actor_id,
        request_id=request_id,
    )
    await service.delete_transaction(
        business_id=business_id,
        transaction_id=transaction.id,
        actor_id=actor_id,
        request_id=request_id,
    )

    audit_logs = [item for item in session.added if isinstance(item, AuditLog)]
    assert balance.opening_balance == Decimal("100000.1235")
    assert session.deleted == [transaction]
    assert [item.action for item in audit_logs] == [
        "CASH_BALANCE_UPDATE",
        "CASH_TRANSACTION_CREATE",
        "CASH_TRANSACTION_UPDATE",
        "CASH_TRANSACTION_DELETE",
    ]
    other_business_id = uuid4()
    other_balance = await service.get_balance(business_id=other_business_id)
    assert other_balance.business_id == other_business_id
    assert other_balance.opening_balance == Decimal("0.0000")
    assert other_balance is not balance


@pytest.mark.asyncio
async def test_cash_summary_uses_period_and_authoritative_formula() -> None:
    business_id = uuid4()
    repository = FakeCashRepository(business_id)
    repository.balance = CashBalance(
        id=uuid4(),
        business_id=business_id,
        opening_balance=Decimal("100000.0000"),
        updated_at=datetime(2026, 8, 27, 10, tzinfo=UTC),
    )
    repository.transactions = {
        uuid4(): make_transaction(
            business_id=business_id,
            transaction_type=CashTransactionType.INCOME,
            amount="25000",
            transaction_date=date(2026, 8, 10),
        ),
        uuid4(): make_transaction(
            business_id=business_id,
            transaction_type=CashTransactionType.EXPENSE,
            amount="7000",
            transaction_date=date(2026, 8, 11),
        ),
        uuid4(): make_transaction(
            business_id=business_id,
            transaction_type=CashTransactionType.INCOME,
            amount="999999",
            transaction_date=date(2026, 7, 31),
        ),
    }
    service = CashService(
        cast(AsyncSession, FakeSession()),
        repository=cast(CashRepository, repository),
    )

    summary = await service.summary(
        business_id=business_id,
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 31),
    )

    assert summary.total_income == Decimal("25000.0000")
    assert summary.total_expense == Decimal("7000.0000")
    assert summary.net_cashflow == Decimal("18000.0000")
    assert summary.closing_balance == Decimal("118000.0000")


def test_cash_response_serializes_decimal_and_camel_case() -> None:
    timestamp = datetime(2026, 8, 27, 10, tzinfo=UTC)
    balance = CashBalance(
        id=uuid4(),
        business_id=uuid4(),
        opening_balance=Decimal("100000.0000"),
        updated_at=timestamp,
    )
    response = CashBalanceResponse.model_validate(balance)
    assert response.model_dump(mode="json", by_alias=True)["openingBalance"] == "100000.0000"

    transaction = make_transaction(
        business_id=balance.business_id,
        transaction_type=CashTransactionType.EXPENSE,
        amount="5000",
        transaction_date=date(2026, 8, 27),
    )
    transaction_payload = CashTransactionResponse.model_validate(transaction).model_dump(
        mode="json", by_alias=True
    )
    assert transaction_payload["transactionDate"] == "2026-08-27"
    assert transaction_payload["amount"] == "5000.0000"

    summary_payload = CashSummaryResponse.model_validate(
        {
            "opening_balance": Decimal("100000.0000"),
            "total_income": Decimal("25000.0000"),
            "total_expense": Decimal("5000.0000"),
            "net_cashflow": Decimal("20000.0000"),
            "closing_balance": Decimal("120000.0000"),
            "date_from": date(2026, 8, 1),
            "date_to": date(2026, 8, 31),
        }
    ).model_dump(mode="json", by_alias=True)
    assert summary_payload["closingBalance"] == "120000.0000"
    assert summary_payload["dateFrom"] == "2026-08-01"


def test_cash_routes_are_registered_with_expected_contract() -> None:
    application = create_app(make_settings())
    openapi = application.openapi()
    paths = openapi["paths"]

    assert "/api/v1/cash-balance" in paths
    assert "/api/v1/cash-transactions" in paths
    assert "/api/v1/cash-transactions/{transaction_id}" in paths
    assert "/api/v1/cash-transactions/summary" in paths
    list_parameters = paths["/api/v1/cash-transactions"]["get"]["parameters"]
    assert {parameter["name"] for parameter in list_parameters} >= {
        "page",
        "page_size",
        "type",
        "date_from",
        "date_to",
    }


@pytest.mark.asyncio
async def test_cash_list_route_can_use_tenant_dependency_override() -> None:
    business = make_business()

    class EmptyResult:
        def scalar_one(self) -> int:
            return 0

        def scalars(self) -> "EmptyResult":
            return self

        def all(self) -> list[CashTransaction]:
            return []

    class EmptySession(FakeSession):
        async def execute(self, statement: object) -> EmptyResult:
            return EmptyResult()

    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, EmptySession())

    application = create_app(make_settings())
    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[current_business_dependency] = lambda: business
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(
            "/api/v1/cash-transactions?type=EXPENSE&date_from=2026-08-01&date_to=2026-08-31"
        )

    assert response.status_code == 200
    assert response.json() == {
        "data": [],
        "meta": {"page": 1, "pageSize": 20, "total": 0},
    }
