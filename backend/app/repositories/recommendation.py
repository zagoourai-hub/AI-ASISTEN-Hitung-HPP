from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cost import ProductCostVersion
from app.models.product import Product, ProductVariant
from app.models.recommendation import RecommendationDraft
from app.repositories.tenant import business_scope_clause


class RecommendationRepository:
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

    async def find_latest_cost(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductCostVersion | None:
        result = await session.execute(
            select(ProductCostVersion)
            .join(ProductVariant, ProductVariant.id == ProductCostVersion.product_variant_id)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                business_scope_clause(Product.business_id, business_id),
                ProductVariant.id == variant_id,
            )
            .order_by(
                ProductCostVersion.calculated_at.desc(),
                ProductCostVersion.id.desc(),
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    def add_draft(self, session: AsyncSession, draft: RecommendationDraft) -> None:
        session.add(draft)
