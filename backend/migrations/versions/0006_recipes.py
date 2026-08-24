"""create recipe version tables

Revision ID: 0006_recipes
Revises: 0005_products
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0006_recipes"
down_revision: str | None = "0005_products"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

recipe_status = postgresql.ENUM(
    "DRAFT",
    "ACTIVE",
    "ARCHIVED",
    name="recipe_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE recipe_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED')")

    op.create_table(
        "recipe_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            recipe_status,
            server_default=sa.text("'DRAFT'"),
            nullable=False,
        ),
        sa.Column("change_reason", sa.String(length=500), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("version > 0", name="version_positive"),
        sa.ForeignKeyConstraint(
            ["product_variant_id"],
            ["product_variants.id"],
            name="fk_recipe_versions_product_variant_id_product_variants",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_recipe_versions"),
        sa.UniqueConstraint(
            "product_variant_id",
            "version",
            name="recipe_version_number",
        ),
    )
    op.create_index(
        "ix_recipe_versions_product_variant_id",
        "recipe_versions",
        ["product_variant_id"],
    )
    op.create_index(
        "recipe_version_one_active",
        "recipe_versions",
        ["product_variant_id"],
        unique=True,
        postgresql_where=sa.text("status = 'ACTIVE'"),
    )

    op.create_table(
        "recipe_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recipe_version_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=False),
        sa.CheckConstraint("quantity > 0", name="quantity_positive"),
        sa.ForeignKeyConstraint(
            ["recipe_version_id"],
            ["recipe_versions.id"],
            name="fk_recipe_items_recipe_version_id_recipe_versions",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["ingredients.id"],
            name="fk_recipe_items_ingredient_id_ingredients",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_recipe_items"),
        sa.UniqueConstraint(
            "recipe_version_id",
            "ingredient_id",
            name="recipe_item_ingredient",
        ),
    )
    op.create_index(
        "ix_recipe_items_recipe_version_id",
        "recipe_items",
        ["recipe_version_id"],
    )
    op.create_index("ix_recipe_items_ingredient_id", "recipe_items", ["ingredient_id"])


def downgrade() -> None:
    op.drop_index("ix_recipe_items_ingredient_id", table_name="recipe_items")
    op.drop_index("ix_recipe_items_recipe_version_id", table_name="recipe_items")
    op.drop_table("recipe_items")
    op.drop_index("recipe_version_one_active", table_name="recipe_versions")
    op.drop_index("ix_recipe_versions_product_variant_id", table_name="recipe_versions")
    op.drop_table("recipe_versions")
    op.execute("DROP TYPE IF EXISTS recipe_status")
