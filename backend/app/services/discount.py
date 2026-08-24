from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.repositories.recommendation import RecommendationRepository
from app.schemas.discount import DiscountSimulationRequest
from app.utils.types import quantize_money


@dataclass(frozen=True, slots=True)
class DiscountSimulation:
    base_selling_price: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    net_selling_price: Decimal
    full_hpp: Decimal
    net_profit: Decimal
    net_margin_percent: Decimal
    is_loss: bool


class DiscountService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: RecommendationRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or RecommendationRepository()

    async def simulate(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        payload: DiscountSimulationRequest,
    ) -> DiscountSimulation:
        variant = await self.repository.find_variant(
            self.session,
            business_id=business_id,
            variant_id=variant_id,
        )
        if variant is None:
            raise self._not_found("Product variant")
        cost = await self.repository.find_latest_cost(
            self.session,
            business_id=business_id,
            variant_id=variant.id,
        )
        if cost is None:
            raise AppError(
                ErrorCode.CALCULATION_CONFLICT,
                "Calculate HPP before simulating a discount.",
                status_code=422,
            )
        discount_percent = payload.discount_percent
        if not discount_percent.is_finite() or not Decimal("0") <= discount_percent < Decimal(
            "100"
        ):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Discount must be at least 0% and less than 100%.",
                status_code=422,
            )
        base_price = (
            payload.base_selling_price
            if payload.base_selling_price is not None
            else variant.selling_price
        )
        if not base_price.is_finite() or base_price <= Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Base selling price must be greater than zero.",
                status_code=422,
            )
        raw_discount_amount = base_price * discount_percent / Decimal("100")
        raw_net_price = base_price - raw_discount_amount
        if raw_net_price <= Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Discount produces an invalid net selling price.",
                status_code=422,
            )
        raw_profit = raw_net_price - cost.full_hpp
        return DiscountSimulation(
            base_selling_price=quantize_money(base_price),
            discount_percent=quantize_money(discount_percent),
            discount_amount=quantize_money(raw_discount_amount),
            net_selling_price=quantize_money(raw_net_price),
            full_hpp=quantize_money(cost.full_hpp),
            net_profit=quantize_money(raw_profit),
            net_margin_percent=quantize_money((raw_profit / raw_net_price) * Decimal("100")),
            is_loss=raw_profit < Decimal("0"),
        )

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found.",
            status_code=404,
        )
