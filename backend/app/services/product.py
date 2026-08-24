from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.product import Product, ProductCategory, ProductVariant
from app.repositories.product import ProductRepository
from app.schemas.product import (
    ProductCategoryCreateRequest,
    ProductCategoryUpdateRequest,
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantUpdateRequest,
)
from app.utils.types import ProductStatus, new_id


class ProductService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: ProductRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or ProductRepository()

    async def list_categories(
        self,
        *,
        business_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[ProductCategory], int]:
        from app.schemas.pagination import PaginationParams

        return await self.repository.list_categories(
            self.session,
            business_id=business_id,
            pagination=PaginationParams(page=page, page_size=page_size),
        )

    async def create_category(
        self,
        *,
        business_id: UUID,
        payload: ProductCategoryCreateRequest,
    ) -> ProductCategory:
        try:
            async with self.session.begin():
                duplicate = await self.repository.find_category_by_name(
                    self.session,
                    business_id=business_id,
                    name=payload.name,
                )
                if duplicate is not None:
                    raise self._duplicate("Category")
                category = ProductCategory(
                    id=new_id(),
                    business_id=business_id,
                    name=payload.name,
                    target_margin=payload.target_margin,
                )
                self.repository.add_category(self.session, category)
                await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate("Category") from error
        return category

    async def get_category(self, *, business_id: UUID, category_id: UUID) -> ProductCategory:
        category = await self.repository.find_category(
            self.session,
            business_id=business_id,
            category_id=category_id,
        )
        if category is None:
            raise self._not_found("Category")
        return category

    async def update_category(
        self,
        *,
        business_id: UUID,
        category_id: UUID,
        payload: ProductCategoryUpdateRequest,
    ) -> ProductCategory:
        async with self.session.begin():
            category = await self.repository.find_category(
                self.session,
                business_id=business_id,
                category_id=category_id,
            )
            if category is None:
                raise self._not_found("Category")
            if payload.name is not None and payload.name != category.name:
                duplicate = await self.repository.find_category_by_name(
                    self.session,
                    business_id=business_id,
                    name=payload.name,
                )
                if duplicate is not None and duplicate.id != category.id:
                    raise self._duplicate("Category")
                category.name = payload.name
            if "target_margin" in payload.model_fields_set:
                if payload.target_margin is None:
                    raise self._invalid_margin()
                category.target_margin = payload.target_margin
            await self.session.flush()
        return category

    async def delete_category(self, *, business_id: UUID, category_id: UUID) -> None:
        async with self.session.begin():
            category = await self.repository.find_category(
                self.session,
                business_id=business_id,
                category_id=category_id,
            )
            if category is None:
                raise self._not_found("Category")
            await self.session.delete(category)
            await self.session.flush()

    async def list_products(
        self,
        *,
        business_id: UUID,
        page: int,
        page_size: int,
        include_archived: bool = False,
    ) -> tuple[list[Product], int]:
        from app.schemas.pagination import PaginationParams

        return await self.repository.list_products(
            self.session,
            business_id=business_id,
            pagination=PaginationParams(page=page, page_size=page_size),
            include_archived=include_archived,
        )

    async def get_product(self, *, business_id: UUID, product_id: UUID) -> Product:
        product = await self.repository.find_product(
            self.session,
            business_id=business_id,
            product_id=product_id,
        )
        if product is None:
            raise self._not_found("Product")
        return product

    async def create_product(
        self,
        *,
        business_id: UUID,
        payload: ProductCreateRequest,
        default_target_margin: Decimal = Decimal("0.3000"),
    ) -> Product:
        try:
            async with self.session.begin():
                duplicate = await self.repository.find_product_by_name(
                    self.session,
                    business_id=business_id,
                    name=payload.name,
                )
                if duplicate is not None:
                    raise self._duplicate("Product")

                category = await self._resolve_category(
                    business_id=business_id,
                    category_id=payload.category_id,
                    category_name=payload.category,
                    default_target_margin=default_target_margin,
                )
                product = Product(
                    id=new_id(),
                    business_id=business_id,
                    category_id=category.id if category is not None else None,
                    name=payload.name,
                    status=ProductStatus.ACTIVE,
                    category=category,
                )
                self.repository.add_product(self.session, product)
                await self.session.flush()

                variants = list(payload.variants)
                if payload.variant is not None:
                    variants.append(payload.variant)
                for variant_payload in variants:
                    if any(item.name == variant_payload.name for item in product.variants):
                        raise self._duplicate("Variant")
                    variant = self._make_variant(product.id, variant_payload)
                    product.variants.append(variant)
                    self.repository.add_variant(self.session, variant)
                await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate("Product") from error
        return product

    async def update_product(
        self,
        *,
        business_id: UUID,
        product_id: UUID,
        payload: ProductUpdateRequest,
        default_target_margin: Decimal = Decimal("0.3000"),
    ) -> Product:
        try:
            async with self.session.begin():
                product = await self.repository.find_product(
                    self.session,
                    business_id=business_id,
                    product_id=product_id,
                )
                if product is None:
                    raise self._not_found("Product")
                if payload.name is not None and payload.name != product.name:
                    duplicate = await self.repository.find_product_by_name(
                        self.session,
                        business_id=business_id,
                        name=payload.name,
                    )
                    if duplicate is not None and duplicate.id != product.id:
                        raise self._duplicate("Product")
                    product.name = payload.name
                if "category_id" in payload.model_fields_set:
                    category = await self._resolve_category(
                        business_id=business_id,
                        category_id=payload.category_id,
                        category_name=None,
                        default_target_margin=default_target_margin,
                    )
                    product.category = category
                    product.category_id = category.id if category is not None else None
                elif "category" in payload.model_fields_set:
                    category = await self._resolve_category(
                        business_id=business_id,
                        category_id=None,
                        category_name=payload.category,
                        default_target_margin=default_target_margin,
                    )
                    product.category = category
                    product.category_id = category.id if category is not None else None
                if payload.status is not None:
                    product.status = payload.status
                await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate("Product") from error
        return product

    async def archive_product(self, *, business_id: UUID, product_id: UUID) -> None:
        async with self.session.begin():
            product = await self.repository.find_product(
                self.session,
                business_id=business_id,
                product_id=product_id,
            )
            if product is None:
                raise self._not_found("Product")
            product.status = ProductStatus.ARCHIVED
            await self.session.flush()

    async def create_variant(
        self,
        *,
        business_id: UUID,
        product_id: UUID,
        payload: ProductVariantCreateRequest,
    ) -> ProductVariant:
        try:
            async with self.session.begin():
                product = await self.repository.find_product(
                    self.session,
                    business_id=business_id,
                    product_id=product_id,
                    include_archived=False,
                )
                if product is None:
                    raise self._not_found("Product")
                duplicate = await self.repository.find_variant_by_name(
                    self.session,
                    product_id=product_id,
                    name=payload.name,
                )
                if duplicate is not None:
                    raise self._duplicate("Variant")
                variant = self._make_variant(product_id, payload)
                product.variants.append(variant)
                self.repository.add_variant(self.session, variant)
                await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate("Variant") from error
        return variant

    async def update_variant(
        self,
        *,
        business_id: UUID,
        product_id: UUID,
        variant_id: UUID,
        payload: ProductVariantUpdateRequest,
    ) -> ProductVariant:
        try:
            async with self.session.begin():
                variant = await self.repository.find_variant(
                    self.session,
                    business_id=business_id,
                    product_id=product_id,
                    variant_id=variant_id,
                )
                if variant is None:
                    raise self._not_found("Variant")
                if payload.name is not None and payload.name != variant.name:
                    duplicate = await self.repository.find_variant_by_name(
                        self.session,
                        product_id=product_id,
                        name=payload.name,
                    )
                    if duplicate is not None and duplicate.id != variant.id:
                        raise self._duplicate("Variant")
                    variant.name = payload.name
                if payload.selling_price is not None:
                    variant.selling_price = payload.selling_price
                if payload.packaging_cost is not None:
                    variant.packaging_cost = payload.packaging_cost
                if payload.direct_cost is not None:
                    variant.direct_cost = payload.direct_cost
                if "target_margin_override" in payload.model_fields_set:
                    variant.target_margin_override = payload.target_margin_override
                await self.session.flush()
        except IntegrityError as error:
            raise self._duplicate("Variant") from error
        return variant

    async def _resolve_category(
        self,
        *,
        business_id: UUID,
        category_id: UUID | None,
        category_name: str | None,
        default_target_margin: Decimal,
    ) -> ProductCategory | None:
        if category_id is not None:
            category = await self.repository.find_category(
                self.session,
                business_id=business_id,
                category_id=category_id,
            )
            if category is None:
                raise self._not_found("Category")
            return category
        if category_name is None:
            return None
        category = await self.repository.find_category_by_name(
            self.session,
            business_id=business_id,
            name=category_name,
        )
        if category is not None:
            return category
        category = ProductCategory(
            id=new_id(),
            business_id=business_id,
            name=category_name,
            target_margin=default_target_margin,
        )
        self.repository.add_category(self.session, category)
        await self.session.flush()
        return category

    @staticmethod
    def _make_variant(
        product_id: UUID,
        payload: ProductVariantCreateRequest,
    ) -> ProductVariant:
        return ProductVariant(
            id=new_id(),
            product_id=product_id,
            name=payload.name,
            selling_price=payload.selling_price,
            packaging_cost=payload.packaging_cost,
            direct_cost=payload.direct_cost,
            target_margin_override=payload.target_margin_override,
        )

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found.",
            status_code=404,
        )

    @staticmethod
    def _duplicate(resource: str) -> AppError:
        return AppError(
            ErrorCode.DUPLICATE_RESOURCE,
            f"{resource} already exists.",
            status_code=409,
        )

    @staticmethod
    def _invalid_margin() -> AppError:
        return AppError(
            ErrorCode.INVALID_MARGIN,
            "Target margin must be between 0 and less than 1.",
            status_code=422,
        )
