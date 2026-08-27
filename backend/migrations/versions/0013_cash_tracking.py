"""create manual cash tracking tables

Revision ID: 0013_cash_tracking
Revises: 0012_product_images
Create Date: 2026-08-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0013_cash_tracking"
down_revision: str | None = "0012_product_images"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

cash_transaction_type = postgresql.ENUM(
    "INCOME",
    "EXPENSE",
    name="cash_transaction_type",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE TYPE cash_transaction_type AS ENUM ('INCOME', 'EXPENSE')")
    op.create_table(
        "cash_balances",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "opening_balance",
            sa.Numeric(precision=18, scale=4),
            server_default=sa.text("0.0000"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("opening_balance >= 0", name="opening_balance_non_negative"),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_cash_balances_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_cash_balances"),
        sa.UniqueConstraint("business_id", name="uq_cash_balances_business_id"),
    )
    op.create_table(
        "cash_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", cash_transaction_type, nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount > 0", name="amount_positive"),
        sa.ForeignKeyConstraint(
            ["business_id"],
            ["businesses.id"],
            name="fk_cash_transactions_business_id_businesses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_cash_transactions"),
    )
    op.create_index("ix_cash_transactions_business_id", "cash_transactions", ["business_id"])
    op.create_index(
        "cash_transactions_business_date",
        "cash_transactions",
        ["business_id", "transaction_date"],
    )


def downgrade() -> None:
    op.drop_index("cash_transactions_business_date", table_name="cash_transactions")
    op.drop_index("ix_cash_transactions_business_id", table_name="cash_transactions")
    op.drop_table("cash_transactions")
    op.drop_table("cash_balances")
    op.execute("DROP TYPE IF EXISTS cash_transaction_type")
