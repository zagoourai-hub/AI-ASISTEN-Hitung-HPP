from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.utils.types import CashTransactionType, utc_now

if TYPE_CHECKING:
    from app.models.business import Business


class CashBalance(Base):
    __tablename__ = "cash_balances"
    __table_args__ = (CheckConstraint("opening_balance >= 0", name="opening_balance_non_negative"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    opening_balance: Mapped[Decimal] = mapped_column(
        MONEY_NUMERIC,
        default=Decimal("0.0000"),
        server_default=text("0.0000"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    business: Mapped[Business] = relationship("Business", back_populates="cash_balance")


class CashTransaction(Base):
    __tablename__ = "cash_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        Index("cash_transactions_business_date", "business_id", "transaction_date"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[CashTransactionType] = mapped_column(
        Enum(CashTransactionType, name="cash_transaction_type"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    note: Mapped[str | None] = mapped_column(String(500))
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    business: Mapped[Business] = relationship("Business", back_populates="cash_transactions")
