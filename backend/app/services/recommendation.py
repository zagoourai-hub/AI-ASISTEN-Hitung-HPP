from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal
from typing import Literal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.recommendation import RecommendationDraft
from app.repositories.recommendation import RecommendationRepository
from app.schemas.recommendation import RecommendationRequest
from app.utils.types import (
    RecommendationStatus,
    RoundingStrategy,
    new_id,
    quantize_money,
    utc_now,
)

type ScenarioName = Literal["Hemat", "Ideal", "Premium"]


@dataclass(frozen=True, slots=True)
class RecommendationScenario:
    name: ScenarioName
    target_margin: Decimal
    proposed_price: Decimal
    margin_percent: Decimal
    profit_per_unit: Decimal


@dataclass(frozen=True, slots=True)
class RecommendationResult:
    draft: RecommendationDraft
    scenarios: tuple[RecommendationScenario, ...]


class RecommendationService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: RecommendationRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or RecommendationRepository()

    async def create(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        payload: RecommendationRequest,
    ) -> RecommendationResult:
        async with self.session.begin():
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
                    "Calculate HPP before creating a price recommendation.",
                    status_code=422,
                )
            self._validate_margin(payload.target_margin)
            proposed_price = self._recommended_price(
                full_hpp=cost.full_hpp,
                target_margin=payload.target_margin,
                strategy=payload.rounding_strategy,
                custom_rounding=payload.custom_rounding,
            )
            scenarios = self._scenarios(
                full_hpp=cost.full_hpp,
                target_margin=payload.target_margin,
                strategy=payload.rounding_strategy,
                custom_rounding=payload.custom_rounding,
            )
            draft = RecommendationDraft(
                id=new_id(),
                product_variant_id=variant.id,
                type="COST_PLUS",
                current_value=self._non_negative_money(variant.selling_price, "Selling price"),
                proposed_value=proposed_price,
                target_margin=payload.target_margin,
                rounding_strategy=payload.rounding_strategy,
                custom_rounding=payload.custom_rounding,
                status=RecommendationStatus.DRAFT,
                created_at=utc_now(),
            )
            self.repository.add_draft(self.session, draft)
            await self.session.flush()
        return RecommendationResult(draft=draft, scenarios=tuple(scenarios))

    @classmethod
    def _scenarios(
        cls,
        *,
        full_hpp: Decimal,
        target_margin: Decimal,
        strategy: RoundingStrategy,
        custom_rounding: Decimal | None,
    ) -> list[RecommendationScenario]:
        margins: tuple[tuple[ScenarioName, Decimal], ...] = (
            ("Hemat", max(target_margin - Decimal("0.1000"), Decimal("0.0500"))),
            ("Ideal", target_margin),
            ("Premium", min(target_margin + Decimal("0.1000"), Decimal("0.9500"))),
        )
        return [
            cls._scenario(
                name=name,
                full_hpp=full_hpp,
                target_margin=margin,
                strategy=strategy,
                custom_rounding=custom_rounding,
            )
            for name, margin in margins
        ]

    @classmethod
    def _scenario(
        cls,
        *,
        name: ScenarioName,
        full_hpp: Decimal,
        target_margin: Decimal,
        strategy: RoundingStrategy,
        custom_rounding: Decimal | None,
    ) -> RecommendationScenario:
        proposed_price = cls._recommended_price(
            full_hpp=full_hpp,
            target_margin=target_margin,
            strategy=strategy,
            custom_rounding=custom_rounding,
        )
        profit = quantize_money(proposed_price - full_hpp)
        margin_percent = (
            quantize_money((profit / proposed_price) * Decimal("100"))
            if proposed_price > Decimal("0")
            else Decimal("0.0000")
        )
        return RecommendationScenario(
            name=name,
            target_margin=target_margin,
            proposed_price=proposed_price,
            margin_percent=margin_percent,
            profit_per_unit=profit,
        )

    @staticmethod
    def _recommended_price(
        *,
        full_hpp: Decimal,
        target_margin: Decimal,
        strategy: RoundingStrategy,
        custom_rounding: Decimal | None,
    ) -> Decimal:
        if full_hpp < Decimal("0") or not full_hpp.is_finite():
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Full HPP cannot be negative.",
                status_code=422,
            )
        denominator = Decimal("1") - target_margin
        raw_price = full_hpp / denominator
        if strategy == RoundingStrategy.NONE:
            return quantize_money(raw_price)
        if strategy == RoundingStrategy.NEAREST_100:
            return quantize_money(raw_price.quantize(Decimal("1E+2"), rounding=ROUND_HALF_UP))
        if custom_rounding is None or custom_rounding <= Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "custom_rounding must be greater than zero for CUSTOM strategy.",
                status_code=422,
            )
        rounded = (raw_price / custom_rounding).to_integral_value(rounding=ROUND_CEILING)
        return quantize_money(rounded * custom_rounding)

    @staticmethod
    def _validate_margin(target_margin: Decimal) -> None:
        if not target_margin.is_finite() or not Decimal("0") <= target_margin < Decimal("1"):
            raise AppError(
                ErrorCode.INVALID_MARGIN,
                "Target margin must be between 0 and less than 1.",
                status_code=422,
            )

    @staticmethod
    def _non_negative_money(value: Decimal, label: str) -> Decimal:
        if not value.is_finite() or value < Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                f"{label} cannot be negative.",
                status_code=422,
            )
        return quantize_money(value)

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found.",
            status_code=404,
        )
