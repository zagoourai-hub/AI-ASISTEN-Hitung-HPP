from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, QUANTITY_NUMERIC, Base
from app.utils.types import utc_now


class Ingredient(Base):
    __tablename__ = "ingredients"
    __table_args__ = (
        CheckConstraint(
            "current_unit_cost IS NULL OR current_unit_cost > 0",
            name="current_unit_cost_positive",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    base_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    current_unit_cost: Mapped[Decimal | None] = mapped_column(MONEY_NUMERIC)
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
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    price_history: Mapped[list[IngredientPriceHistory]] = relationship(
        "IngredientPriceHistory",
        back_populates="ingredient",
        cascade="all, delete-orphan",
        order_by="IngredientPriceHistory.effective_at",
    )
    unit_conversions: Mapped[list[IngredientUnitConversion]] = relationship(
        "IngredientUnitConversion",
        back_populates="ingredient",
        cascade="all, delete-orphan",
    )


class IngredientPriceHistory(Base):
    __tablename__ = "ingredient_price_history"
    __table_args__ = (
        CheckConstraint("purchase_price > 0", name="purchase_price_positive"),
        CheckConstraint("purchase_quantity > 0", name="purchase_quantity_positive"),
        CheckConstraint("unit_cost > 0", name="unit_cost_positive"),
        Index("ix_ingredient_price_history_ingredient_effective", "ingredient_id", "effective_at"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ingredient_id: Mapped[UUID] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"),
        nullable=False,
    )
    purchase_price: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    purchase_quantity: Mapped[Decimal] = mapped_column(QUANTITY_NUMERIC, nullable=False)
    purchase_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    effective_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    ingredient: Mapped[Ingredient] = relationship(back_populates="price_history")


class IngredientUnitConversion(Base):
    __tablename__ = "ingredient_unit_conversions"
    __table_args__ = (
        CheckConstraint("conversion_factor > 0", name="conversion_factor_positive"),
        CheckConstraint("from_unit <> to_unit", name="conversion_units_distinct"),
        UniqueConstraint(
            "ingredient_id",
            "from_unit",
            "to_unit",
            name="ingredient_unit_conversion_route",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ingredient_id: Mapped[UUID] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    to_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    conversion_factor: Mapped[Decimal] = mapped_column(QUANTITY_NUMERIC, nullable=False)

    ingredient: Mapped[Ingredient] = relationship(back_populates="unit_conversions")
