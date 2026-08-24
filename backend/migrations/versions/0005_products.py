"""create product catalog tables

Revision ID: 0005_products
Revises: 0004_ingredients
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_products"
down_revision: str | None = "0004_ingredients"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

product_status = postgresql.ENUM(
    "ACTIVE",
    "ARCHIVED",
    name="product_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE product_status AS ENUM ('ACTIVE', 'ARCHIVED')")

    op.create_table(
        "product_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("target_margin", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.CheckConstraint(
            "target_margin >= 0 AND target_margin < 1",
            name="target_margin_range",
        ),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_product_categories_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_product_categories"),
        sa.UniqueConstraint(
            "business_id",
            "name",
            name="product_category_name",
        ),
    )
    op.create_index(
        "ix_product_categories_business_id",
        "product_categories",
        ["business_id"],
    )

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column(
            "status",
            product_status,
            server_default=sa.text("'ACTIVE'"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_products_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["product_categories.id"],
            name="fk_products_category_id_product_categories",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_products"),
        sa.UniqueConstraint("business_id", "name", name="product_business_name"),
    )
    op.create_index("ix_products_business_id", "products", ["business_id"])
    op.create_index("ix_products_category_id", "products", ["category_id"])

    op.create_table(
        "product_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("selling_price", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column(
            "packaging_cost",
            sa.Numeric(precision=18, scale=4),
            server_default=sa.text("0.0000"),
            nullable=False,
        ),
        sa.Column(
            "direct_cost",
            sa.Numeric(precision=18, scale=4),
            server_default=sa.text("0.0000"),
            nullable=False,
        ),
        sa.Column("target_margin_override", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.CheckConstraint(
            "selling_price >= 0",
            name="selling_price_non_negative",
        ),
        sa.CheckConstraint(
            "packaging_cost >= 0",
            name="packaging_cost_non_negative",
        ),
        sa.CheckConstraint(
            "direct_cost >= 0",
            name="direct_cost_non_negative",
        ),
        sa.CheckConstraint(
            "target_margin_override IS NULL OR "
            "(target_margin_override >= 0 AND target_margin_override < 1)",
            name="target_margin_override_range",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_variants_product_id_products",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_product_variants"),
        sa.UniqueConstraint("product_id", "name", name="product_variant_product_name"),
    )
    op.create_index(
        "ix_product_variants_product_id",
        "product_variants",
        ["product_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_product_variants_product_id", table_name="product_variants")
    op.drop_table("product_variants")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_index("ix_products_business_id", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_product_categories_business_id", table_name="product_categories")
    op.drop_table("product_categories")
    op.execute("DROP TYPE IF EXISTS product_status")
