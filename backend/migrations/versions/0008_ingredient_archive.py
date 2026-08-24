"""add ingredient archive timestamp

Revision ID: 0008_ingredient_archive
Revises: 0007_overheads
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_ingredient_archive"
down_revision: str | None = "0007_overheads"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "ingredients",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_ingredients_business_archived",
        "ingredients",
        ["business_id", "archived_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_ingredients_business_archived", table_name="ingredients")
    op.drop_column("ingredients", "archived_at")
