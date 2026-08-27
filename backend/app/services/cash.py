from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import cast
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.audit import AuditLog
from app.models.cash import CashBalance, CashTransaction
from app.repositories.cash import CashRepository
from app.schemas.cash import (
    CashBalanceUpdateRequest,
    CashTransactionCreateRequest,
    CashTransactionUpdateRequest,
)
from app.schemas.pagination import PaginationParams
from app.utils.types import CashTransactionType, new_id, quantize_money, utc_now


@dataclass(frozen=True, slots=True)
class CashSummary:
    opening_balance: Decimal
    total_income: Decimal
    total_expense: Decimal
    net_cashflow: Decimal
    closing_balance: Decimal
    date_from: date
    date_to: date


class CashService:
    def __init__(self, session: AsyncSession, *, repository: CashRepository | None = None) -> None:
        self.session = session
        self.repository = repository or CashRepository()

    async def get_balance(self, *, business_id: UUID) -> CashBalance:
        async with self.session.begin():
            balance = await self.repository.find_balance(self.session, business_id=business_id)
            if balance is None:
                balance = CashBalance(
                    id=new_id(),
                    business_id=business_id,
                    opening_balance=Decimal("0.0000"),
                    updated_at=utc_now(),
                )
                self.repository.add_balance(self.session, balance)
                await self.session.flush()
        return balance

    async def update_balance(
        self,
        *,
        business_id: UUID,
        payload: CashBalanceUpdateRequest,
        actor_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> CashBalance:
        try:
            async with self.session.begin():
                balance = await self.repository.find_balance(
                    self.session,
                    business_id=business_id,
                )
                if balance is None:
                    balance = CashBalance(
                        id=new_id(),
                        business_id=business_id,
                        opening_balance=self._non_negative_money(payload.opening_balance),
                        updated_at=utc_now(),
                    )
                    self.repository.add_balance(self.session, balance)
                else:
                    balance.opening_balance = self._non_negative_money(payload.opening_balance)
                await self.session.flush()
                self._add_audit(
                    action="CASH_BALANCE_UPDATE",
                    entity_type="CASH_BALANCE",
                    entity_id=balance.id,
                    actor_id=actor_id,
                    request_id=request_id,
                )
                await self.session.flush()
        except IntegrityError as error:
            raise AppError(
                ErrorCode.DUPLICATE_RESOURCE,
                "Cash balance already exists.",
                status_code=409,
            ) from error
        return balance

    async def list_transactions(
        self,
        *,
        business_id: UUID,
        page: int,
        page_size: int,
        transaction_type: CashTransactionType | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[CashTransaction], int]:
        self._validate_date_range(date_from=date_from, date_to=date_to)
        return await self.repository.list_transactions(
            self.session,
            business_id=business_id,
            pagination=PaginationParams(page=page, page_size=page_size),
            transaction_type=transaction_type,
            date_from=date_from,
            date_to=date_to,
        )

    async def create_transaction(
        self,
        *,
        business_id: UUID,
        payload: CashTransactionCreateRequest,
        actor_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> CashTransaction:
        async with self.session.begin():
            transaction = CashTransaction(
                id=new_id(),
                business_id=business_id,
                type=payload.type,
                amount=self._positive_money(payload.amount),
                category=payload.category,
                note=payload.note,
                transaction_date=payload.transaction_date,
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            self.repository.add_transaction(self.session, transaction)
            await self.session.flush()
            self._add_audit(
                action="CASH_TRANSACTION_CREATE",
                entity_type="CASH_TRANSACTION",
                entity_id=transaction.id,
                actor_id=actor_id,
                request_id=request_id,
            )
            await self.session.flush()
        return transaction

    async def update_transaction(
        self,
        *,
        business_id: UUID,
        transaction_id: UUID,
        payload: CashTransactionUpdateRequest,
        actor_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> CashTransaction:
        async with self.session.begin():
            transaction = await self.repository.find_transaction(
                self.session,
                business_id=business_id,
                transaction_id=transaction_id,
            )
            if transaction is None:
                raise self._not_found("Cash transaction")
            if payload.type is not None:
                transaction.type = payload.type
            if payload.amount is not None:
                transaction.amount = self._positive_money(payload.amount)
            if "category" in payload.model_fields_set:
                transaction.category = payload.category
            if "note" in payload.model_fields_set:
                transaction.note = payload.note
            if payload.transaction_date is not None:
                transaction.transaction_date = payload.transaction_date
            await self.session.flush()
            self._add_audit(
                action="CASH_TRANSACTION_UPDATE",
                entity_type="CASH_TRANSACTION",
                entity_id=transaction.id,
                actor_id=actor_id,
                request_id=request_id,
            )
            await self.session.flush()
        return transaction

    async def delete_transaction(
        self,
        *,
        business_id: UUID,
        transaction_id: UUID,
        actor_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> None:
        async with self.session.begin():
            transaction = await self.repository.find_transaction(
                self.session,
                business_id=business_id,
                transaction_id=transaction_id,
            )
            if transaction is None:
                raise self._not_found("Cash transaction")
            await self.session.delete(transaction)
            self._add_audit(
                action="CASH_TRANSACTION_DELETE",
                entity_type="CASH_TRANSACTION",
                entity_id=transaction.id,
                actor_id=actor_id,
                request_id=request_id,
            )
            await self.session.flush()

    async def summary(
        self,
        *,
        business_id: UUID,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> CashSummary:
        resolved_from, resolved_to = self._resolve_period(date_from=date_from, date_to=date_to)
        balance = await self.repository.find_balance(self.session, business_id=business_id)
        total_income, total_expense = await self.repository.sum_transactions(
            self.session,
            business_id=business_id,
            date_from=resolved_from,
            date_to=resolved_to,
        )
        opening_balance = (
            quantize_money(balance.opening_balance) if balance is not None else Decimal("0.0000")
        )
        income = quantize_money(cast(Decimal, total_income))
        expense = quantize_money(cast(Decimal, total_expense))
        net_cashflow = quantize_money(income - expense)
        return CashSummary(
            opening_balance=opening_balance,
            total_income=income,
            total_expense=expense,
            net_cashflow=net_cashflow,
            closing_balance=quantize_money(opening_balance + net_cashflow),
            date_from=resolved_from,
            date_to=resolved_to,
        )

    def _add_audit(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: UUID,
        actor_id: UUID | None,
        request_id: UUID | None,
    ) -> None:
        if actor_id is None or request_id is None:
            return
        self.session.add(
            AuditLog(
                id=new_id(),
                actor_id=actor_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                request_id=request_id,
                created_at=utc_now(),
            )
        )

    @staticmethod
    def _non_negative_money(value: Decimal) -> Decimal:
        if not value.is_finite() or value < Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Opening balance cannot be negative.",
                status_code=422,
            )
        return quantize_money(value)

    @staticmethod
    def _positive_money(value: Decimal) -> Decimal:
        if not value.is_finite() or value <= Decimal("0"):
            raise AppError(ErrorCode.VALIDATION_ERROR, "Amount must be positive.", status_code=422)
        amount = quantize_money(value)
        if amount <= Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Amount is below supported precision.",
                status_code=422,
            )
        return amount

    @staticmethod
    def _validate_date_range(*, date_from: date | None, date_to: date | None) -> None:
        if date_from is not None and date_to is not None and date_from > date_to:
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "date_from cannot be after date_to.",
                status_code=422,
            )

    @classmethod
    def _resolve_period(cls, *, date_from: date | None, date_to: date | None) -> tuple[date, date]:
        cls._validate_date_range(date_from=date_from, date_to=date_to)
        today = utc_now().date()
        resolved_from = date_from or today.replace(day=1)
        if date_to is not None:
            resolved_to = date_to
        else:
            if resolved_from.month == 12:
                next_month = date(resolved_from.year + 1, 1, 1)
            else:
                next_month = date(resolved_from.year, resolved_from.month + 1, 1)
            resolved_to = next_month.fromordinal(next_month.toordinal() - 1)
        return resolved_from, resolved_to

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(ErrorCode.RESOURCE_NOT_FOUND, f"{resource} not found.", status_code=404)
