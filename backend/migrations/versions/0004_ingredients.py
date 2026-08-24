"""create ingredient catalog tables

Revision ID: 0004_ingredients
Revises: 0003_password_reset
Create Date: 2026-08-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_ingredients"
down_revision: str | None = "0003_password_reset"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("base_unit", sa.String(length=32), nullable=False),
        sa.Column("current_unit_cost", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "current_unit_cost IS NULL OR current_unit_cost > 0",
            name="ck_ingredients_current_unit_cost_positive",
        ),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_ingredients_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ingredients"),
    )
    op.create_index("ix_ingredients_business_id", "ingredients", ["business_id"])

    op.create_table(
        "ingredient_price_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("purchase_price", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("purchase_quantity", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("purchase_unit", sa.String(length=32), nullable=False),
        sa.Column("unit_cost", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("effective_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "purchase_price > 0",
            name="ck_ingredient_price_history_purchase_price_positive",
        ),
        sa.CheckConstraint(
            "purchase_quantity > 0",
            name="ck_ingredient_price_history_purchase_quantity_positive",
        ),
        sa.CheckConstraint(
            "unit_cost > 0",
            name="ck_ingredient_price_history_unit_cost_positive",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["ingredients.id"],
            name="fk_ingredient_price_history_ingredient_id_ingredients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ingredient_price_history"),
    )
    op.create_index(
        "ix_ingredient_price_history_ingredient_effective",
        "ingredient_price_history",
        ["ingredient_id", "effective_at"],
    )

    op.create_table(
        "ingredient_unit_conversions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_unit", sa.String(length=32), nullable=False),
        sa.Column("to_unit", sa.String(length=32), nullable=False),
        sa.Column("conversion_factor", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.CheckConstraint(
            "conversion_factor > 0",
            name="ck_ingredient_unit_conversions_conversion_factor_positive",
        ),
        sa.CheckConstraint(
            "from_unit <> to_unit",
            name="ck_ingredient_unit_conversions_conversion_units_distinct",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["ingredients.id"],
            name="fk_ingredient_unit_conversions_ingredient_id_ingredients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ingredient_unit_conversions"),
        sa.UniqueConstraint(
            "ingredient_id",
            "from_unit",
            "to_unit",
            name="ingredient_unit_conversion_route",
        ),
    )


def downgrade() -> None:
    op.drop_table("ingredient_unit_conversions")
    op.drop_index(
        "ix_ingredient_price_history_ingredient_effective",
        table_name="ingredient_price_history",
    )
    op.drop_table("ingredient_price_history")
    op.drop_index("ix_ingredients_business_id", table_name="ingredients")
    op.drop_table("ingredients")
