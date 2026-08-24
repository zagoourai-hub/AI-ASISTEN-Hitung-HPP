from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.overhead import Overhead
from app.models.product import ProductVariant
from app.models.recipe import RecipeVersion
from app.services.effective_price import EffectivePriceResolver, NormalizedIngredientCost
from app.utils.types import AllocationMethod, RecipeStatus, ensure_utc, quantize_money, utc_now

HPP_CALCULATION_VERSION = "hpp-v1"


@dataclass(frozen=True, slots=True)
class HppIngredientLine:
    ingredient_id: UUID
    quantity: Decimal
    unit: str
    normalized_quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal
    price_history_id: UUID


@dataclass(frozen=True, slots=True)
class HppBreakdown:
    product_variant_id: UUID
    recipe_version_id: UUID
    ingredient_cost: Decimal
    packaging_cost: Decimal
    direct_cost: Decimal
    overhead_cost: Decimal
    full_hpp: Decimal
    calculation_version: str
    price_as_of: datetime
    calculated_at: datetime
    ingredient_lines: tuple[HppIngredientLine, ...]


class HppCalculationService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        price_resolver: EffectivePriceResolver | None = None,
    ) -> None:
        self.session = session
        self.price_resolver = price_resolver or EffectivePriceResolver(session)

    async def calculate(
        self,
        *,
        business_id: UUID,
        variant: ProductVariant,
        recipe_version: RecipeVersion,
        overheads: list[Overhead],
        price_as_of: datetime | None = None,
    ) -> HppBreakdown:
        if recipe_version.status != RecipeStatus.ACTIVE:
            raise AppError(
                ErrorCode.INVALID_RECIPE_STATE,
                "Only an active recipe can be calculated.",
                status_code=422,
            )
        if recipe_version.product_variant_id != variant.id:
            raise AppError(
                ErrorCode.CALCULATION_CONFLICT,
                "Recipe version does not belong to the product variant.",
                status_code=409,
            )
        if not recipe_version.items:
            raise AppError(
                ErrorCode.INVALID_RECIPE_STATE,
                "An active recipe must contain at least one item.",
                status_code=422,
            )
        resolved_as_of = self._resolve_price_as_of(price_as_of)
        lines: list[HppIngredientLine] = []
        raw_ingredient_cost = Decimal("0")
        for item in recipe_version.items:
            resolved = await self.price_resolver.resolve_cost(
                business_id=business_id,
                ingredient_id=item.ingredient_id,
                quantity=item.quantity,
                unit=item.unit,
                price_as_of=resolved_as_of,
            )
            raw_ingredient_cost += resolved.total_cost
            lines.append(
                self._line(
                    item_quantity=item.quantity,
                    item_unit=item.unit,
                    cost=resolved,
                )
            )

        packaging_cost = self._non_negative_money(variant.packaging_cost, "Packaging cost")
        direct_cost = self._non_negative_money(variant.direct_cost, "Direct cost")
        raw_overhead_cost = Decimal("0")
        for overhead in overheads:
            if overhead.business_id != business_id:
                raise AppError(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    "Overhead not found.",
                    status_code=404,
                )
            if overhead.allocation_method != AllocationMethod.MANUAL_PER_UNIT:
                raise AppError(
                    ErrorCode.VALIDATION_ERROR,
                    "Only manual per-unit overhead is supported.",
                    status_code=422,
                )
            raw_overhead_cost += self._non_negative_money(
                overhead.per_unit_amount,
                "Overhead amount",
            )

        raw_full_hpp = raw_ingredient_cost + packaging_cost + direct_cost + raw_overhead_cost
        calculated_at = utc_now()
        return HppBreakdown(
            product_variant_id=variant.id,
            recipe_version_id=recipe_version.id,
            ingredient_cost=quantize_money(raw_ingredient_cost),
            packaging_cost=quantize_money(packaging_cost),
            direct_cost=quantize_money(direct_cost),
            overhead_cost=quantize_money(raw_overhead_cost),
            full_hpp=quantize_money(raw_full_hpp),
            calculation_version=HPP_CALCULATION_VERSION,
            price_as_of=resolved_as_of,
            calculated_at=calculated_at,
            ingredient_lines=tuple(lines),
        )

    @staticmethod
    def _line(
        *,
        item_quantity: Decimal,
        item_unit: str,
        cost: NormalizedIngredientCost,
    ) -> HppIngredientLine:
        return HppIngredientLine(
            ingredient_id=cost.ingredient_id,
            quantity=item_quantity,
            unit=item_unit,
            normalized_quantity=cost.normalized_quantity,
            unit_cost=cost.unit_cost,
            total_cost=cost.total_cost,
            price_history_id=cost.price_history_id,
        )

    @staticmethod
    def _resolve_price_as_of(price_as_of: datetime | None) -> datetime:
        if price_as_of is None:
            return utc_now()
        try:
            return ensure_utc(price_as_of)
        except ValueError as error:
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "price_as_of must be timezone-aware.",
                status_code=422,
            ) from error

    @staticmethod
    def _non_negative_money(value: Decimal, label: str) -> Decimal:
        if not value.is_finite() or value < Decimal("0"):
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                f"{label} cannot be negative.",
                status_code=422,
            )
        return value
