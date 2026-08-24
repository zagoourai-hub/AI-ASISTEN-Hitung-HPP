from __future__ import annotations

from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MONEY_NUMERIC, Base
from app.models.business import Business
from app.utils.types import AllocationMethod


class Overhead(Base):
    __tablename__ = "overheads"
    __table_args__ = (
        CheckConstraint("per_unit_amount >= 0", name="per_unit_amount_non_negative"),
        UniqueConstraint("business_id", "name", name="overhead_business_name"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    per_unit_amount: Mapped[Decimal] = mapped_column(
        MONEY_NUMERIC,
        default=Decimal("0.0000"),
        server_default=text("0.0000"),
        nullable=False,
    )
    allocation_method: Mapped[AllocationMethod] = mapped_column(
        Enum(AllocationMethod, name="allocation_method"),
        default=AllocationMethod.MANUAL_PER_UNIT,
        server_default=text("'MANUAL_PER_UNIT'"),
        nullable=False,
    )

    business: Mapped[Business] = relationship("Business")
