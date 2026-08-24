from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import QUANTITY_NUMERIC, Base
from app.models.ingredient import Ingredient
from app.models.product import ProductVariant
from app.utils.types import RecipeStatus, utc_now


class RecipeVersion(Base):
    __tablename__ = "recipe_versions"
    __table_args__ = (
        CheckConstraint("version > 0", name="version_positive"),
        UniqueConstraint("product_variant_id", "version", name="recipe_version_number"),
        Index(
            "recipe_version_one_active",
            "product_variant_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_variant_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[RecipeStatus] = mapped_column(
        Enum(RecipeStatus, name="recipe_status"),
        default=RecipeStatus.DRAFT,
        nullable=False,
    )
    change_reason: Mapped[str | None] = mapped_column(String(500))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    product_variant: Mapped[ProductVariant] = relationship("ProductVariant")
    items: Mapped[list[RecipeItem]] = relationship(
        "RecipeItem",
        back_populates="recipe_version",
        cascade="all, delete-orphan",
    )


class RecipeItem(Base):
    __tablename__ = "recipe_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        UniqueConstraint("recipe_version_id", "ingredient_id", name="recipe_item_ingredient"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    recipe_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("recipe_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ingredient_id: Mapped[UUID] = mapped_column(
        ForeignKey("ingredients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_NUMERIC, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)

    recipe_version: Mapped[RecipeVersion] = relationship(back_populates="items")
    ingredient: Mapped[Ingredient] = relationship("Ingredient")
