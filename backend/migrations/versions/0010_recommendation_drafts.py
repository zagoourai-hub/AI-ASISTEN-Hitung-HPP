"""create recommendation draft persistence

Revision ID: 0010_recommendation_drafts
Revises: 0009_cost_versions
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers.
revision: str = "0010_recommendation_drafts"
down_revision: str | None = "0009_cost_versions"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

rounding_strategy = postgresql.ENUM(
    "NONE",
    "NEAREST_100",
    "CUSTOM",
    name="rounding_strategy",
    create_type=False,
)
recommendation_status = postgresql.ENUM(
    "DRAFT",
    "APPLIED",
    "DISMISSED",
    name="recommendation_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE recommendation_status AS ENUM ('DRAFT', 'APPLIED', 'DISMISSED')")
    op.create_table(
        "recommendation_drafts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("current_value", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("proposed_value", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("target_margin", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column("rounding_strategy", rounding_strategy, nullable=False),
        sa.Column("custom_rounding", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column(
            "status",
            recommendation_status,
            server_default=sa.text("'DRAFT'"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "target_margin >= 0 AND target_margin < 1",
            name="target_margin_range",
        ),
        sa.CheckConstraint("current_value >= 0", name="current_value_non_negative"),
        sa.CheckConstraint("proposed_value >= 0", name="proposed_value_non_negative"),
        sa.CheckConstraint(
            "(rounding_strategy = 'CUSTOM' AND custom_rounding IS NOT NULL "
            "AND custom_rounding > 0) "
            "OR (rounding_strategy <> 'CUSTOM' AND custom_rounding IS NULL)",
            name="custom_rounding_policy",
        ),
        sa.ForeignKeyConstraint(
            ["product_variant_id"],
            ["product_variants.id"],
            name="fk_recommendation_drafts_product_variant_id_product_variants",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_recommendation_drafts"),
    )
    op.create_index(
        "ix_recommendation_drafts_product_variant_id",
        "recommendation_drafts",
        ["product_variant_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_recommendation_drafts_product_variant_id",
        table_name="recommendation_drafts",
    )
    op.drop_table("recommendation_drafts")
    op.execute("DROP TYPE IF EXISTS recommendation_status")
