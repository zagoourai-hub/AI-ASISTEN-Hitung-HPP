"""create business and pricing settings

Revision ID: 0002_business
Revises: 0001_auth_session
Create Date: 2026-08-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_business"
down_revision: str | None = "0001_auth_session"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

rounding_strategy = postgresql.ENUM(
    "NONE",
    "NEAREST_100",
    "CUSTOM",
    name="rounding_strategy",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE rounding_strategy AS ENUM ('NONE', 'NEAREST_100', 'CUSTOM')")

    op.create_table(
        "businesses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("business_type", sa.String(length=100), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default=sa.text("'IDR'"), nullable=False),
        sa.Column(
            "timezone",
            sa.String(length=64),
            server_default=sa.text("'Asia/Jakarta'"),
            nullable=False,
        ),
        sa.Column(
            "default_target_margin",
            sa.Numeric(precision=5, scale=4),
            server_default=sa.text("0.3000"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("currency = 'IDR'", name="currency_idr"),
        sa.CheckConstraint(
            "default_target_margin >= 0 AND default_target_margin < 1",
            name="target_margin_range",
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name="fk_businesses_owner_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_businesses"),
        sa.UniqueConstraint("owner_id", name="uq_businesses_owner_id"),
    )

    op.create_table(
        "business_pricing_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "rounding_strategy",
            rounding_strategy,
            server_default=sa.text("'NEAREST_100'"),
            nullable=False,
        ),
        sa.Column("custom_rounding", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.CheckConstraint(
            "(rounding_strategy = 'CUSTOM' AND custom_rounding IS NOT NULL "
            "AND custom_rounding > 0) "
            "OR (rounding_strategy <> 'CUSTOM' AND custom_rounding IS NULL)",
            name="custom_rounding_policy",
        ),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_business_pricing_settings_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_business_pricing_settings"),
        sa.UniqueConstraint("business_id", name="uq_business_pricing_settings_business_id"),
    )


def downgrade() -> None:
    op.drop_table("business_pricing_settings")
    op.drop_table("businesses")
    op.execute("DROP TYPE IF EXISTS rounding_strategy")
