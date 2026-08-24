from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.models.product import ProductVariant
from app.models.recipe import RecipeVersion


class ProductCostVersion(Base):
    __tablename__ = "product_cost_versions"
    __table_args__ = (
        CheckConstraint("ingredient_cost >= 0", name="ingredient_cost_non_negative"),
        CheckConstraint("packaging_cost >= 0", name="packaging_cost_non_negative"),
        CheckConstraint("direct_cost >= 0", name="direct_cost_non_negative"),
        CheckConstraint("overhead_cost >= 0", name="overhead_cost_non_negative"),
        CheckConstraint("full_hpp >= 0", name="full_hpp_non_negative"),
        Index(
            "ix_product_cost_versions_variant_calculated",
            "product_variant_id",
            "calculated_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_variant_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    recipe_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("recipe_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    ingredient_cost: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    packaging_cost: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    direct_cost: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    overhead_cost: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    full_hpp: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    calculation_version: Mapped[str] = mapped_column(String(32), nullable=False)
    price_as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    product_variant: Mapped[ProductVariant] = relationship("ProductVariant")
    recipe_version: Mapped[RecipeVersion] = relationship("RecipeVersion")
