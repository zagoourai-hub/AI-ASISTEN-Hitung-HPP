from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory, ProductVariant
from app.repositories.tenant import business_scope_clause
from app.schemas.pagination import PaginationParams


class ProductRepository:
    async def list_categories(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        pagination: PaginationParams,
    ) -> tuple[list[ProductCategory], int]:
        scope = business_scope_clause(ProductCategory.business_id, business_id)
        total_result = await session.execute(select(func.count(ProductCategory.id)).where(scope))
        items_result = await session.execute(
            select(ProductCategory)
            .where(scope)
            .order_by(ProductCategory.name, ProductCategory.id)
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    async def find_category(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        category_id: UUID,
    ) -> ProductCategory | None:
        result = await session.execute(
            select(ProductCategory).where(
                business_scope_clause(ProductCategory.business_id, business_id),
                ProductCategory.id == category_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_category_by_name(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        name: str,
    ) -> ProductCategory | None:
        result = await session.execute(
            select(ProductCategory).where(
                business_scope_clause(ProductCategory.business_id, business_id),
                ProductCategory.name == name,
            )
        )
        return result.scalar_one_or_none()

    async def list_products(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        pagination: PaginationParams,
        include_archived: bool = False,
    ) -> tuple[list[Product], int]:
        scope = business_scope_clause(Product.business_id, business_id)
        if not include_archived:
            scope = scope & (Product.status == "ACTIVE")
        total_result = await session.execute(select(func.count(Product.id)).where(scope))
        items_result = await session.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(scope)
            .order_by(Product.name, Product.id)
            .offset(pagination.offset)
            .limit(pagination.page_size)
        )
        return list(items_result.scalars().all()), int(total_result.scalar_one())

    async def find_product(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        product_id: UUID,
        include_archived: bool = True,
    ) -> Product | None:
        conditions = [
            business_scope_clause(Product.business_id, business_id),
            Product.id == product_id,
        ]
        if not include_archived:
            conditions.append(Product.status == "ACTIVE")
        result = await session.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(*conditions)
        )
        return result.scalar_one_or_none()

    async def find_product_by_name(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        name: str,
    ) -> Product | None:
        result = await session.execute(
            select(Product).where(
                business_scope_clause(Product.business_id, business_id),
                Product.name == name,
            )
        )
        return result.scalar_one_or_none()

    async def find_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        product_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        result = await session.execute(
            select(ProductVariant)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                business_scope_clause(Product.business_id, business_id),
                Product.id == product_id,
                ProductVariant.id == variant_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_variant_by_name(
        self,
        session: AsyncSession,
        *,
        product_id: UUID,
        name: str,
    ) -> ProductVariant | None:
        result = await session.execute(
            select(ProductVariant).where(
                ProductVariant.product_id == product_id,
                ProductVariant.name == name,
            )
        )
        return result.scalar_one_or_none()

    def add_category(self, session: AsyncSession, category: ProductCategory) -> None:
        session.add(category)

    def add_product(self, session: AsyncSession, product: Product) -> None:
        session.add(product)

    def add_variant(self, session: AsyncSession, variant: ProductVariant) -> None:
        session.add(variant)
