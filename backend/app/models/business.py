from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.utils.types import RoundingStrategy, utc_now

if TYPE_CHECKING:
    from app.models.auth import User

MARGIN_NUMERIC = Numeric(precision=5, scale=4, asdecimal=True)


class Business(Base):
    __tablename__ = "businesses"
    __table_args__ = (
        CheckConstraint("currency = 'IDR'", name="currency_idr"),
        CheckConstraint(
            "default_target_margin >= 0 AND default_target_margin < 1",
            name="target_margin_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3),
        default="IDR",
        server_default=text("'IDR'"),
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(64),
        default="Asia/Jakarta",
        server_default=text("'Asia/Jakarta'"),
        nullable=False,
    )
    default_target_margin: Mapped[Decimal] = mapped_column(
        MARGIN_NUMERIC,
        default=Decimal("0.3000"),
        server_default=text("0.3000"),
        nullable=False,
    )
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

    owner: Mapped["User"] = relationship("User", back_populates="business")  # noqa: UP037
    pricing_setting: Mapped[BusinessPricingSetting] = relationship(
        "BusinessPricingSetting",
        back_populates="business",
        uselist=False,
        cascade="all, delete-orphan",
    )


class BusinessPricingSetting(Base):
    __tablename__ = "business_pricing_settings"
    __table_args__ = (
        CheckConstraint(
            "(rounding_strategy = 'CUSTOM' AND custom_rounding IS NOT NULL "
            "AND custom_rounding > 0) "
            "OR (rounding_strategy <> 'CUSTOM' AND custom_rounding IS NULL)",
            name="custom_rounding_policy",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    rounding_strategy: Mapped[RoundingStrategy] = mapped_column(
        Enum(RoundingStrategy, name="rounding_strategy"),
        default=RoundingStrategy.NEAREST_100,
        server_default=text("'NEAREST_100'"),
        nullable=False,
    )
    custom_rounding: Mapped[Decimal | None] = mapped_column(MONEY_NUMERIC)

    business: Mapped[Business] = relationship("Business", back_populates="pricing_setting")
