"""create overhead table

Revision ID: 0007_overheads
Revises: 0006_recipes
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0007_overheads"
down_revision: str | None = "0006_recipes"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

allocation_method = postgresql.ENUM(
    "MANUAL_PER_UNIT",
    name="allocation_method",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE allocation_method AS ENUM ('MANUAL_PER_UNIT')")
    op.create_table(
        "overheads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column(
            "per_unit_amount",
            sa.Numeric(precision=18, scale=4),
            server_default=sa.text("0.0000"),
            nullable=False,
        ),
        sa.Column(
            "allocation_method",
            allocation_method,
            server_default=sa.text("'MANUAL_PER_UNIT'"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "per_unit_amount >= 0",
            name="per_unit_amount_non_negative",
        ),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_overheads_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_overheads"),
        sa.UniqueConstraint("business_id", "name", name="overhead_business_name"),
    )
    op.create_index("ix_overheads_business_id", "overheads", ["business_id"])


def downgrade() -> None:
    op.drop_index("ix_overheads_business_id", table_name="overheads")
    op.drop_table("overheads")
    op.execute("DROP TYPE IF EXISTS allocation_method")
