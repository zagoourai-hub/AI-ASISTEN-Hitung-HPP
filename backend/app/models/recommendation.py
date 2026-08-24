from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.models.business import MARGIN_NUMERIC
from app.models.product import ProductVariant
from app.utils.types import RecommendationStatus, RoundingStrategy, utc_now


class RecommendationDraft(Base):
    __tablename__ = "recommendation_drafts"
    __table_args__ = (
        CheckConstraint(
            "target_margin >= 0 AND target_margin < 1",
            name="target_margin_range",
        ),
        CheckConstraint("current_value >= 0", name="current_value_non_negative"),
        CheckConstraint("proposed_value >= 0", name="proposed_value_non_negative"),
        CheckConstraint(
            "(rounding_strategy = 'CUSTOM' AND custom_rounding IS NOT NULL "
            "AND custom_rounding > 0) "
            "OR (rounding_strategy <> 'CUSTOM' AND custom_rounding IS NULL)",
            name="custom_rounding_policy",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_variant_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    current_value: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    proposed_value: Mapped[Decimal] = mapped_column(MONEY_NUMERIC, nullable=False)
    target_margin: Mapped[Decimal] = mapped_column(MARGIN_NUMERIC, nullable=False)
    rounding_strategy: Mapped[RoundingStrategy] = mapped_column(
        Enum(RoundingStrategy, name="rounding_strategy"),
        nullable=False,
    )
    custom_rounding: Mapped[Decimal | None] = mapped_column(MONEY_NUMERIC)
    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus, name="recommendation_status"),
        default=RecommendationStatus.DRAFT,
        server_default=text("'DRAFT'"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    product_variant: Mapped[ProductVariant] = relationship("ProductVariant")
