from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ingredient import Ingredient, IngredientPriceHistory, IngredientUnitConversion
from app.repositories.tenant import business_scope_clause
from app.schemas.pagination import PaginationParams


class IngredientRepository:
    async def list_active(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        pagination: PaginationParams,
    ) -> tuple[list[Ingredient], int]:
        scope = business_scope_clause(Ingredient.business_id, business_id)
        total_result = await session.execute(
            select(func.count(Ingredient.id)).where(scope, Ingredient.archived_at.is_(None))
        )
        items_result = await session.execute(
            select(Ingredient)
            .where(scope, Ingredient.archived_at.is_(None))
            .order_by(Ingredient.name, Ingredient.id)
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    async def find_by_id(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        include_archived: bool = False,
    ) -> Ingredient | None:
        conditions = [
            business_scope_clause(Ingredient.business_id, business_id),
            Ingredient.id == ingredient_id,
        ]
        if not include_archived:
            conditions.append(Ingredient.archived_at.is_(None))
        result = await session.execute(
            select(Ingredient)
            .options(
                selectinload(Ingredient.price_history),
                selectinload(Ingredient.unit_conversions),
            )
            .where(*conditions)
        )
        return result.scalar_one_or_none()

    async def find_by_name(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        name: str,
    ) -> Ingredient | None:
        result = await session.execute(
            select(Ingredient).where(
                business_scope_clause(Ingredient.business_id, business_id),
                Ingredient.name == name,
                Ingredient.archived_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_conversion(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
        from_unit: str,
        to_unit: str,
    ) -> IngredientUnitConversion | None:
        result = await session.execute(
            select(IngredientUnitConversion).where(
                IngredientUnitConversion.ingredient_id == ingredient_id,
                IngredientUnitConversion.from_unit == from_unit,
                IngredientUnitConversion.to_unit == to_unit,
            )
        )
        return result.scalar_one_or_none()

    async def list_price_history(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
    ) -> list[IngredientPriceHistory]:
        result = await session.execute(
            select(IngredientPriceHistory)
            .where(IngredientPriceHistory.ingredient_id == ingredient_id)
            .order_by(
                IngredientPriceHistory.effective_at.desc(),
                IngredientPriceHistory.id,
            )
        )
        return list(result.scalars().all())

    async def find_effective_price(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
        price_as_of: datetime,
    ) -> IngredientPriceHistory | None:
        result = await session.execute(
            select(IngredientPriceHistory)
            .where(
                IngredientPriceHistory.ingredient_id == ingredient_id,
                IngredientPriceHistory.effective_at <= price_as_of,
            )
            .order_by(
                IngredientPriceHistory.effective_at.desc(),
                IngredientPriceHistory.id.desc(),
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_conversions(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
    ) -> list[IngredientUnitConversion]:
        result = await session.execute(
            select(IngredientUnitConversion)
            .where(IngredientUnitConversion.ingredient_id == ingredient_id)
            .order_by(IngredientUnitConversion.from_unit, IngredientUnitConversion.to_unit)
        )
        return list(result.scalars().all())

    def add_ingredient(self, session: AsyncSession, ingredient: Ingredient) -> None:
        session.add(ingredient)

    def add_price_history(
        self,
        session: AsyncSession,
        price_history: IngredientPriceHistory,
    ) -> None:
        session.add(price_history)

    def add_conversion(
        self,
        session: AsyncSession,
        conversion: IngredientUnitConversion,
    ) -> None:
        session.add(conversion)
