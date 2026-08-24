"""create product cost version history

Revision ID: 0009_cost_versions
Revises: 0008_ingredient_archive
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0009_cost_versions"
down_revision: str | None = "0008_ingredient_archive"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_cost_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recipe_version_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingredient_cost", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("packaging_cost", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("direct_cost", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("overhead_cost", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("full_hpp", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("calculation_version", sa.String(length=32), nullable=False),
        sa.Column("price_as_of", sa.DateTime(timezone=True), nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("ingredient_cost >= 0", name="ingredient_cost_non_negative"),
        sa.CheckConstraint("packaging_cost >= 0", name="packaging_cost_non_negative"),
        sa.CheckConstraint("direct_cost >= 0", name="direct_cost_non_negative"),
        sa.CheckConstraint("overhead_cost >= 0", name="overhead_cost_non_negative"),
        sa.CheckConstraint("full_hpp >= 0", name="full_hpp_non_negative"),
        sa.ForeignKeyConstraint(
            ["product_variant_id"],
            ["product_variants.id"],
            name="fk_product_cost_versions_product_variant_id_product_variants",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["recipe_version_id"],
            ["recipe_versions.id"],
            name="fk_product_cost_versions_recipe_version_id_recipe_versions",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_product_cost_versions"),
    )
    op.create_index(
        "ix_product_cost_versions_product_variant_id",
        "product_cost_versions",
        ["product_variant_id"],
    )
    op.create_index(
        "ix_product_cost_versions_recipe_version_id",
        "product_cost_versions",
        ["recipe_version_id"],
    )
    op.create_index(
        "ix_product_cost_versions_variant_calculated",
        "product_cost_versions",
        ["product_variant_id", "calculated_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_product_cost_versions_variant_calculated",
        table_name="product_cost_versions",
    )
    op.drop_index(
        "ix_product_cost_versions_recipe_version_id",
        table_name="product_cost_versions",
    )
    op.drop_index(
        "ix_product_cost_versions_product_variant_id",
        table_name="product_cost_versions",
    )
    op.drop_table("product_cost_versions")
