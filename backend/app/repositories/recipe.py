from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ingredient import Ingredient, IngredientUnitConversion
from app.models.product import Product, ProductVariant
from app.models.recipe import RecipeVersion
from app.repositories.tenant import business_scope_clause
from app.schemas.pagination import PaginationParams
from app.utils.types import RecipeStatus


class RecipeRepository:
    async def find_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        result = await session.execute(
            select(ProductVariant)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                business_scope_clause(Product.business_id, business_id),
                ProductVariant.id == variant_id,
                Product.status == "ACTIVE",
            )
        )
        return result.scalar_one_or_none()

    async def lock_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        result = await session.execute(
            select(ProductVariant)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                business_scope_clause(Product.business_id, business_id),
                ProductVariant.id == variant_id,
                Product.status == "ACTIVE",
            )
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def next_version(
        self,
        session: AsyncSession,
        *,
        variant_id: UUID,
    ) -> int:
        result = await session.execute(
            select(func.coalesce(func.max(RecipeVersion.version), 0)).where(
                RecipeVersion.product_variant_id == variant_id
            )
        )
        return int(result.scalar_one()) + 1

    async def list_versions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
        pagination: PaginationParams,
    ) -> tuple[list[RecipeVersion], int]:
        scope = (
            business_scope_clause(Product.business_id, business_id),
            ProductVariant.id == variant_id,
        )
        total_result = await session.execute(
            select(func.count(RecipeVersion.id))
            .join(ProductVariant, ProductVariant.id == RecipeVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(*scope)
        )
        items_result = await session.execute(
            select(RecipeVersion)
            .join(ProductVariant, ProductVariant.id == RecipeVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .options(selectinload(RecipeVersion.items))
            .where(*scope)
            .order_by(RecipeVersion.version.desc())
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    async def find_version(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        recipe_version_id: UUID,
        lock: bool = False,
    ) -> RecipeVersion | None:
        statement = (
            select(RecipeVersion)
            .join(ProductVariant, ProductVariant.id == RecipeVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .options(selectinload(RecipeVersion.items))
            .where(
                business_scope_clause(Product.business_id, business_id),
                RecipeVersion.id == recipe_version_id,
            )
        )
        if lock:
            statement = statement.with_for_update()
        result = await session.execute(statement)
        return result.scalar_one_or_none()

    async def list_active_versions(
        self,
        session: AsyncSession,
        *,
        variant_id: UUID,
        lock: bool = False,
    ) -> list[RecipeVersion]:
        statement = select(RecipeVersion).where(
            RecipeVersion.product_variant_id == variant_id,
            RecipeVersion.status == RecipeStatus.ACTIVE,
        )
        if lock:
            statement = statement.with_for_update()
        result = await session.execute(statement)
        return list(result.scalars().all())

    async def find_ingredient(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        ingredient_id: UUID,
    ) -> Ingredient | None:
        result = await session.execute(
            select(Ingredient)
            .options(selectinload(Ingredient.unit_conversions))
            .where(
                business_scope_clause(Ingredient.business_id, business_id),
                Ingredient.id == ingredient_id,
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

    def add_version(self, session: AsyncSession, version: RecipeVersion) -> None:
        session.add(version)

    def add_item(self, session: AsyncSession, item: object) -> None:
        session.add(item)
