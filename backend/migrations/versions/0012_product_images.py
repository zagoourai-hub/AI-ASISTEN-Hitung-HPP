"""add product image metadata

Revision ID: 0012_product_images
Revises: 0011_audit_logs
Create Date: 2026-08-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0012_product_images"
down_revision: str | None = "0011_audit_logs"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("image_key", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("image_media_type", sa.String(length=32), nullable=True))
    op.add_column("products", sa.Column("image_size_bytes", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "product_image_metadata_consistency",
        "products",
        "(image_key IS NULL AND image_media_type IS NULL AND image_size_bytes IS NULL) OR "
        "(image_key IS NOT NULL AND image_media_type IS NOT NULL AND image_size_bytes > 0)",
    )


def downgrade() -> None:
    op.drop_constraint("product_image_metadata_consistency", "products", type_="check")
    op.drop_column("products", "image_size_bytes")
    op.drop_column("products", "image_media_type")
    op.drop_column("products", "image_key")
