from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.models.business import MARGIN_NUMERIC, Business
from app.utils.types import ProductStatus, utc_now


class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        CheckConstraint(
            "target_margin >= 0 AND target_margin < 1",
            name="target_margin_range",
        ),
        UniqueConstraint("business_id", "name", name="product_category_name"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    target_margin: Mapped[Decimal] = mapped_column(MARGIN_NUMERIC, nullable=False)

    business: Mapped[Business] = relationship("Business")
    products: Mapped[list[Product]] = relationship(
        "Product",
        back_populates="category",
    )


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("business_id", "name", name="product_business_name"),
        CheckConstraint(
            "(image_key IS NULL AND image_media_type IS NULL AND image_size_bytes IS NULL) OR "
            "(image_key IS NOT NULL AND image_media_type IS NOT NULL AND image_size_bytes > 0)",
            name="product_image_metadata_consistency",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_media_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    image_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, name="product_status"),
        default=ProductStatus.ACTIVE,
        server_default=text("'ACTIVE'"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    business: Mapped[Business] = relationship("Business")
    category: Mapped[ProductCategory | None] = relationship(
        "ProductCategory",
        back_populates="products",
    )
    variants: Mapped[list[ProductVariant]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    @property
    def image_url(self) -> str | None:
        if self.image_key is None:
            return None
        version = self.image_key.rsplit("/", 1)[-1]
        return f"/api/v1/products/{self.id}/image?v={version}"


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (
        CheckConstraint("selling_price >= 0", name="selling_price_non_negative"),
        CheckConstraint("packaging_cost >= 0", name="packaging_cost_non_negative"),
        CheckConstraint("direct_cost >= 0", name="direct_cost_non_negative"),
        CheckConstraint(
            "target_margin_override IS NULL OR "
            "(target_margin_override >= 0 AND target_margin_override < 1)",
            name="target_margin_override_range",
        ),
        UniqueConstraint("product_id", "name", name="product_variant_product_name"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    selling_price: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    packaging_cost: Mapped[Decimal] = mapped_column(
        MONEY_NUMERIC,
        default=Decimal("0.0000"),
        server_default=text("0.0000"),
        nullable=False,
    )
    direct_cost: Mapped[Decimal] = mapped_column(
        MONEY_NUMERIC,
        default=Decimal("0.0000"),
        server_default=text("0.0000"),
        nullable=False,
    )
    target_margin_override: Mapped[Decimal | None] = mapped_column(MARGIN_NUMERIC)

    product: Mapped[Product] = relationship(back_populates="variants")
