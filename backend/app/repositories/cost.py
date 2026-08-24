from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.cost import ProductCostVersion
from app.models.overhead import Overhead
from app.models.product import Product, ProductVariant
from app.models.recipe import RecipeVersion
from app.repositories.tenant import business_scope_clause
from app.schemas.pagination import PaginationParams
from app.utils.types import RecipeStatus


class CostRepository:
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

    async def find_active_recipe(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> RecipeVersion | None:
        result = await session.execute(
            select(RecipeVersion)
            .join(ProductVariant, ProductVariant.id == RecipeVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .options(selectinload(RecipeVersion.items))
            .where(
                business_scope_clause(Product.business_id, business_id),
                ProductVariant.id == variant_id,
                RecipeVersion.status == RecipeStatus.ACTIVE,
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_overheads(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
    ) -> list[Overhead]:
        result = await session.execute(
            select(Overhead)
            .where(business_scope_clause(Overhead.business_id, business_id))
            .order_by(Overhead.name, Overhead.id)
        )
        return list(result.scalars().all())

    async def list_cost_versions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
        pagination: PaginationParams,
    ) -> tuple[list[ProductCostVersion], int]:
        scope = (
            business_scope_clause(Product.business_id, business_id),
            ProductVariant.id == variant_id,
        )
        total_result = await session.execute(
            select(func.count(ProductCostVersion.id))
            .join(ProductVariant, ProductVariant.id == ProductCostVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(*scope)
        )
        items_result = await session.execute(
            select(ProductCostVersion)
            .join(ProductVariant, ProductVariant.id == ProductCostVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(*scope)
            .order_by(
                ProductCostVersion.calculated_at.desc(),
                ProductCostVersion.id.desc(),
            )
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    def add_cost_version(self, session: AsyncSession, cost: ProductCostVersion) -> None:
        session.add(cost)

    def add_audit_log(self, session: AsyncSession, audit_log: AuditLog) -> None:
        session.add(audit_log)
