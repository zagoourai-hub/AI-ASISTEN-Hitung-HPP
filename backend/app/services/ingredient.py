from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.ingredient import Ingredient, IngredientPriceHistory, IngredientUnitConversion
from app.repositories.ingredient import IngredientRepository
from app.schemas.ingredient import (
    IngredientCreateRequest,
    IngredientUpdateRequest,
    PriceHistoryCreateRequest,
    UnitConversionCreateRequest,
)
from app.utils.types import MONEY_QUANTUM, ensure_utc, new_id, quantize_money, utc_now


class IngredientService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: IngredientRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or IngredientRepository()

    async def list(
        self,
        *,
        business_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[Ingredient], int]:
        from app.schemas.pagination import PaginationParams

        return await self.repository.list_active(
            self.session,
            business_id=business_id,
            pagination=PaginationParams(page=page, page_size=page_size),
        )

    async def get(self, *, business_id: UUID, ingredient_id: UUID) -> Ingredient:
        ingredient = await self.repository.find_by_id(
            self.session,
            business_id=business_id,
            ingredient_id=ingredient_id,
        )
        if ingredient is None:
            raise self._not_found()
        return ingredient

    async def create(
        self,
        *,
        business_id: UUID,
        payload: IngredientCreateRequest,
    ) -> Ingredient:
        try:
            async with self.session.begin():
                duplicate = await self.repository.find_by_name(
                    self.session,
                    business_id=business_id,
                    name=payload.name,
                )
                if duplicate is not None:
                    raise self._duplicate()

                ingredient = Ingredient(
                    id=new_id(),
                    business_id=business_id,
                    name=payload.name,
                    category=payload.category,
                    base_unit=payload.base_unit,
                )
                self.repository.add_ingredient(self.session, ingredient)
                await self.session.flush()

                if payload.initial_price is not None and payload.purchase_unit is not None:
                    factor = await self._create_initial_conversion(
                        ingredient=ingredient,
                        purchase_unit=payload.purchase_unit,
                        conversion_factor=payload.conversion_factor,
                    )
                    unit_cost = self._unit_cost(
                        purchase_price=payload.initial_price,
                        purchase_quantity=Decimal("1"),
                        conversion_factor=factor,
                    )
                    price_history = IngredientPriceHistory(
                        id=new_id(),
                        ingredient_id=ingredient.id,
                        purchase_price=payload.initial_price,
                        purchase_quantity=Decimal("1"),
                        purchase_unit=payload.purchase_unit,
                        unit_cost=unit_cost,
                        effective_at=utc_now(),
                    )
                    self.repository.add_price_history(self.session, price_history)
                    ingredient.current_unit_cost = unit_cost
                    await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate() from error
        return ingredient

    async def update(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        payload: IngredientUpdateRequest,
    ) -> Ingredient:
        async with self.session.begin():
            ingredient = await self.repository.find_by_id(
                self.session,
                business_id=business_id,
                ingredient_id=ingredient_id,
            )
            if ingredient is None:
                raise self._not_found()

            if payload.name is not None and payload.name != ingredient.name:
                duplicate = await self.repository.find_by_name(
                    self.session,
                    business_id=business_id,
                    name=payload.name,
                )
                if duplicate is not None and duplicate.id != ingredient.id:
                    raise self._duplicate()
                ingredient.name = payload.name
            if "category" in payload.model_fields_set:
                ingredient.category = payload.category
            if payload.base_unit is not None and payload.base_unit != ingredient.base_unit:
                if ingredient.price_history or ingredient.unit_conversions:
                    raise AppError(
                        ErrorCode.INVALID_UNIT_CONVERSION,
                        "Base unit cannot change after pricing data exists.",
                        status_code=422,
                    )
                ingredient.base_unit = payload.base_unit
            await self.session.flush()
        return ingredient

    async def archive(self, *, business_id: UUID, ingredient_id: UUID) -> None:
        async with self.session.begin():
            ingredient = await self.repository.find_by_id(
                self.session,
                business_id=business_id,
                ingredient_id=ingredient_id,
                include_archived=True,
            )
            if ingredient is None:
                raise self._not_found()
            if ingredient.archived_at is None:
                ingredient.archived_at = utc_now()
                await self.session.flush()

    async def add_price(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        payload: PriceHistoryCreateRequest,
    ) -> IngredientPriceHistory:
        async with self.session.begin():
            ingredient = await self.repository.find_by_id(
                self.session,
                business_id=business_id,
                ingredient_id=ingredient_id,
            )
            if ingredient is None:
                raise self._not_found()
            factor = await self._normalization_factor(
                ingredient=ingredient,
                purchase_unit=payload.purchase_unit,
            )
            unit_cost = self._unit_cost(
                purchase_price=payload.purchase_price,
                purchase_quantity=payload.purchase_quantity,
                conversion_factor=factor,
            )
            price_history = IngredientPriceHistory(
                id=new_id(),
                ingredient_id=ingredient.id,
                purchase_price=payload.purchase_price,
                purchase_quantity=payload.purchase_quantity,
                purchase_unit=payload.purchase_unit,
                unit_cost=unit_cost,
                effective_at=ensure_utc(payload.effective_at),
            )
            self.repository.add_price_history(self.session, price_history)
            ingredient.current_unit_cost = unit_cost
            await self.session.flush()
        return price_history

    async def add_conversion(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        payload: UnitConversionCreateRequest,
    ) -> IngredientUnitConversion:
        async with self.session.begin():
            ingredient = await self.repository.find_by_id(
                self.session,
                business_id=business_id,
                ingredient_id=ingredient_id,
            )
            if ingredient is None:
                raise self._not_found()
            if payload.from_unit == payload.to_unit or not {
                payload.from_unit,
                payload.to_unit,
            } & {ingredient.base_unit}:
                raise self._invalid_conversion()
            duplicate = await self.repository.find_conversion(
                self.session,
                ingredient_id=ingredient.id,
                from_unit=payload.from_unit,
                to_unit=payload.to_unit,
            )
            if duplicate is not None:
                raise self._duplicate()
            conversion = IngredientUnitConversion(
                id=new_id(),
                ingredient_id=ingredient.id,
                from_unit=payload.from_unit,
                to_unit=payload.to_unit,
                conversion_factor=payload.conversion_factor,
            )
            self.repository.add_conversion(self.session, conversion)
            await self.session.flush()
        return conversion

    async def _create_initial_conversion(
        self,
        *,
        ingredient: Ingredient,
        purchase_unit: str,
        conversion_factor: Decimal | None,
    ) -> Decimal:
        if purchase_unit == ingredient.base_unit:
            return Decimal("1")
        if conversion_factor is None:
            raise self._invalid_conversion()
        conversion = IngredientUnitConversion(
            id=new_id(),
            ingredient_id=ingredient.id,
            from_unit=purchase_unit,
            to_unit=ingredient.base_unit,
            conversion_factor=conversion_factor,
        )
        self.repository.add_conversion(self.session, conversion)
        return conversion_factor

    async def _normalization_factor(
        self,
        *,
        ingredient: Ingredient,
        purchase_unit: str,
    ) -> Decimal:
        if purchase_unit == ingredient.base_unit:
            return Decimal("1")
        direct = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=purchase_unit,
            to_unit=ingredient.base_unit,
        )
        if direct is not None:
            return direct.conversion_factor
        reverse = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=ingredient.base_unit,
            to_unit=purchase_unit,
        )
        if reverse is not None:
            return Decimal("1") / reverse.conversion_factor
        raise self._invalid_conversion()

    @staticmethod
    def _unit_cost(
        *,
        purchase_price: Decimal,
        purchase_quantity: Decimal,
        conversion_factor: Decimal,
    ) -> Decimal:
        unit_cost = quantize_money(purchase_price / (purchase_quantity * conversion_factor))
        if unit_cost <= Decimal("0") or unit_cost < MONEY_QUANTUM:
            raise AppError(
                ErrorCode.VALIDATION_ERROR,
                "Calculated unit cost is below supported precision.",
                status_code=422,
            )
        return unit_cost

    @staticmethod
    def _not_found() -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            "Ingredient not found.",
            status_code=404,
        )

    @staticmethod
    def _duplicate() -> AppError:
        return AppError(
            ErrorCode.DUPLICATE_RESOURCE,
            "Ingredient already exists.",
            status_code=409,
        )

    @staticmethod
    def _invalid_conversion() -> AppError:
        return AppError(
            ErrorCode.INVALID_UNIT_CONVERSION,
            "A direct conversion to or from the base unit is required.",
            status_code=422,
        )
