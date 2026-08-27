from datetime import date
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cash import CashBalance, CashTransaction
from app.repositories.tenant import business_scope_clause
from app.schemas.pagination import PaginationParams
from app.utils.types import CashTransactionType


class CashRepository:
    async def find_balance(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
    ) -> CashBalance | None:
        result = await session.execute(
            select(CashBalance).where(
                business_scope_clause(CashBalance.business_id, business_id),
            )
        )
        return result.scalar_one_or_none()

    async def find_transaction(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        transaction_id: UUID,
    ) -> CashTransaction | None:
        result = await session.execute(
            select(CashTransaction).where(
                business_scope_clause(CashTransaction.business_id, business_id),
                CashTransaction.id == transaction_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_transactions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        pagination: PaginationParams,
        transaction_type: CashTransactionType | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[CashTransaction], int]:
        conditions = [business_scope_clause(CashTransaction.business_id, business_id)]
        if transaction_type is not None:
            conditions.append(CashTransaction.type == transaction_type)
        if date_from is not None:
            conditions.append(CashTransaction.transaction_date >= date_from)
        if date_to is not None:
            conditions.append(CashTransaction.transaction_date <= date_to)

        total_result = await session.execute(
            select(func.count(CashTransaction.id)).where(*conditions)
        )
        items_result = await session.execute(
            select(CashTransaction)
            .where(*conditions)
            .order_by(
                CashTransaction.transaction_date.desc(),
                CashTransaction.created_at.desc(),
                CashTransaction.id.desc(),
            )
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    async def sum_transactions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        date_from: date,
        date_to: date,
    ) -> tuple[object, object]:
        result = await session.execute(
            select(
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashTransaction.type == CashTransactionType.INCOME,
                                CashTransaction.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_income"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                CashTransaction.type == CashTransactionType.EXPENSE,
                                CashTransaction.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_expense"),
            ).where(
                business_scope_clause(CashTransaction.business_id, business_id),
                CashTransaction.transaction_date >= date_from,
                CashTransaction.transaction_date <= date_to,
            )
        )
        row = result.one()
        return row.total_income, row.total_expense

    def add_balance(self, session: AsyncSession, balance: CashBalance) -> None:
        session.add(balance)

    def add_transaction(self, session: AsyncSession, transaction: CashTransaction) -> None:
        session.add(transaction)
