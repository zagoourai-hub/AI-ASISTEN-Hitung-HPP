from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.ingredient import Ingredient, IngredientPriceHistory
from app.repositories.ingredient import IngredientRepository
from app.utils.types import ensure_utc, utc_now


@dataclass(frozen=True, slots=True)
class EffectivePrice:
    ingredient_id: UUID
    price_history_id: UUID
    unit_cost: Decimal
    effective_at: datetime
    price_as_of: datetime


@dataclass(frozen=True, slots=True)
class NormalizedIngredientCost:
    ingredient_id: UUID
    input_quantity: Decimal
    input_unit: str
    normalized_quantity: Decimal
    base_unit: str
    unit_cost: Decimal
    total_cost: Decimal
    price_history_id: UUID
    price_as_of: datetime


class EffectivePriceResolver:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: IngredientRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or IngredientRepository()

    async def resolve_price(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        price_as_of: datetime | None = None,
    ) -> EffectivePrice:
        ingredient, resolved_as_of = await self._ingredient_and_time(
            business_id=business_id,
            ingredient_id=ingredient_id,
            price_as_of=price_as_of,
        )
        history = await self._find_price(
            ingredient=ingredient,
            price_as_of=resolved_as_of,
        )
        return EffectivePrice(
            ingredient_id=ingredient.id,
            price_history_id=history.id,
            unit_cost=history.unit_cost,
            effective_at=history.effective_at,
            price_as_of=resolved_as_of,
        )

    async def resolve_cost(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        quantity: Decimal,
        unit: str,
        price_as_of: datetime | None = None,
    ) -> NormalizedIngredientCost:
        if quantity <= Decimal("0") or not quantity.is_finite():
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Recipe quantity must be greater than zero.",
                status_code=422,
            )
        ingredient, resolved_as_of = await self._ingredient_and_time(
            business_id=business_id,
            ingredient_id=ingredient_id,
            price_as_of=price_as_of,
        )
        normalized_unit = unit.strip().lower()
        if not normalized_unit:
            raise AppError(
                ErrorCode.INVALID_UNIT_CONVERSION,
                "Recipe unit must not be blank.",
                status_code=422,
            )
        factor = await self._conversion_factor(
            ingredient=ingredient,
            unit=normalized_unit,
        )
        history = await self._find_price(
            ingredient=ingredient,
            price_as_of=resolved_as_of,
        )
        normalized_quantity = quantity * factor
        return NormalizedIngredientCost(
            ingredient_id=ingredient.id,
            input_quantity=quantity,
            input_unit=normalized_unit,
            normalized_quantity=normalized_quantity,
            base_unit=ingredient.base_unit,
            unit_cost=history.unit_cost,
            total_cost=normalized_quantity * history.unit_cost,
            price_history_id=history.id,
            price_as_of=resolved_as_of,
        )

    async def _ingredient_and_time(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        price_as_of: datetime | None,
    ) -> tuple[Ingredient, datetime]:
        ingredient = await self.repository.find_by_id(
            self.session,
            business_id=business_id,
            ingredient_id=ingredient_id,
        )
        if ingredient is None:
            raise AppError(
                ErrorCode.RESOURCE_NOT_FOUND,
                "Ingredient not found.",
                status_code=404,
            )
        try:
            resolved_as_of = ensure_utc(price_as_of) if price_as_of is not None else utc_now()
        except ValueError as error:
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "price_as_of must be timezone-aware.",
                status_code=422,
            ) from error
        return ingredient, resolved_as_of

    async def _find_price(
        self,
        *,
        ingredient: Ingredient,
        price_as_of: datetime,
    ) -> IngredientPriceHistory:
        history = await self.repository.find_effective_price(
            self.session,
            ingredient_id=ingredient.id,
            price_as_of=price_as_of,
        )
        if history is None:
            raise AppError(
                ErrorCode.MISSING_EFFECTIVE_PRICE,
                "No effective price exists for this ingredient.",
                status_code=422,
            )
        return history

    async def _conversion_factor(self, *, ingredient: Ingredient, unit: str) -> Decimal:
        if unit == ingredient.base_unit:
            return Decimal("1")
        direct = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=unit,
            to_unit=ingredient.base_unit,
        )
        if direct is not None and direct.conversion_factor > Decimal("0"):
            return direct.conversion_factor
        reverse = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=ingredient.base_unit,
            to_unit=unit,
        )
        if reverse is not None and reverse.conversion_factor > Decimal("0"):
            return Decimal("1") / reverse.conversion_factor
        raise AppError(
            ErrorCode.INVALID_UNIT_CONVERSION,
            "A direct conversion to or from the ingredient base unit is required.",
            status_code=422,
        )
