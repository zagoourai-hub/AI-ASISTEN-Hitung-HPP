from collections.abc import AsyncIterator
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import httpx
import pytest
from pydantic import SecretStr, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import current_business_dependency
from app.core.config import Settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.models.business import Business
from app.models.product import Product, ProductCategory, ProductVariant
from app.repositories.product import ProductRepository
from app.schemas.product import (
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantUpdateRequest,
)
from app.services.product import ProductService
from app.utils.types import ProductStatus


class FakeTransaction:
    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    def begin(self) -> FakeTransaction:
        return FakeTransaction()

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def delete(self, instance: object) -> None:
        return None

    async def flush(self) -> None:
        return None


class FakeProductRepository:
    def __init__(self) -> None:
        self.categories: dict[UUID, ProductCategory] = {}
        self.products: dict[UUID, Product] = {}
        self.variants: dict[UUID, ProductVariant] = {}

    async def find_category_by_name(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        name: str,
    ) -> ProductCategory | None:
        return next(
            (
                item
                for item in self.categories.values()
                if item.business_id == business_id and item.name == name
            ),
            None,
        )

    async def find_category(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        category_id: UUID,
    ) -> ProductCategory | None:
        category = self.categories.get(category_id)
        return category if category is not None and category.business_id == business_id else None

    async def find_product_by_name(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        name: str,
    ) -> Product | None:
        return next(
            (
                item
                for item in self.products.values()
                if item.business_id == business_id and item.name == name
            ),
            None,
        )

    async def find_product(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        product_id: UUID,
        include_archived: bool = True,
    ) -> Product | None:
        product = self.products.get(product_id)
        if product is None or product.business_id != business_id:
            return None
        if not include_archived and product.status == ProductStatus.ARCHIVED:
            return None
        return product

    async def find_variant_by_name(
        self,
        session: AsyncSession,
        *,
        product_id: UUID,
        name: str,
    ) -> ProductVariant | None:
        return next(
            (
                item
                for item in self.variants.values()
                if item.product_id == product_id and item.name == name
            ),
            None,
        )

    async def find_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        product_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        variant = self.variants.get(variant_id)
        product = self.products.get(product_id)
        if (
            variant is None
            or product is None
            or variant.product_id != product_id
            or product.business_id != business_id
        ):
            return None
        return variant

    def add_category(self, session: AsyncSession, category: ProductCategory) -> None:
        self.categories[category.id] = category
        session.add(category)

    def add_product(self, session: AsyncSession, product: Product) -> None:
        self.products[product.id] = product
        session.add(product)

    def add_variant(self, session: AsyncSession, variant: ProductVariant) -> None:
        self.variants[variant.id] = variant
        session.add(variant)


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_business() -> Business:
    return Business(
        id=uuid4(),
        owner_id=uuid4(),
        name="Warung Contoh",
        business_type="Kuliner",
    )


@pytest.mark.asyncio
async def test_create_product_supports_frontend_shape_and_auto_category() -> None:
    session = FakeSession()
    repository = FakeProductRepository()
    business_id = uuid4()
    service = ProductService(
        cast(AsyncSession, session),
        repository=cast(ProductRepository, repository),
    )

    product = await service.create_product(
        business_id=business_id,
        default_target_margin=Decimal("0.2500"),
        payload=ProductCreateRequest.model_validate(
            {
                "name": " Es Kopi ",
                "category": " Minuman ",
                "variant": {
                    "name": "Regular",
                    "selling_price": "20000",
                    "packaging_cost": "1000",
                    "direct_cost": "500",
                    "target_margin_override": "0.3000",
                },
            }
        ),
    )

    assert product.name == "Es Kopi"
    assert product.category is not None
    assert product.category.name == "Minuman"
    assert product.category.target_margin == Decimal("0.2500")
    assert len(product.variants) == 1
    assert product.variants[0].selling_price == Decimal("20000")


@pytest.mark.asyncio
async def test_product_duplicate_and_cross_tenant_category_are_rejected() -> None:
    session = FakeSession()
    repository = FakeProductRepository()
    service = ProductService(
        cast(AsyncSession, session),
        repository=cast(ProductRepository, repository),
    )
    payload = ProductCreateRequest.model_validate(
        {"name": "Es Teh", "variant": {"name": "Regular", "selling_price": "10000"}}
    )
    business_id = uuid4()
    await service.create_product(business_id=business_id, payload=payload)

    with pytest.raises(AppError) as duplicate:
        await service.create_product(business_id=business_id, payload=payload)
    assert duplicate.value.code == ErrorCode.DUPLICATE_RESOURCE

    with pytest.raises(AppError) as cross_tenant:
        await service.create_product(
            business_id=uuid4(),
            payload=ProductCreateRequest(
                name="Produk Tenant Lain",
                category_id=uuid4(),
            ),
        )
    assert cross_tenant.value.code == ErrorCode.RESOURCE_NOT_FOUND


@pytest.mark.asyncio
async def test_product_archive_and_variant_update_keep_scope() -> None:
    session = FakeSession()
    repository = FakeProductRepository()
    service = ProductService(
        cast(AsyncSession, session),
        repository=cast(ProductRepository, repository),
    )
    business_id = uuid4()
    product = await service.create_product(
        business_id=business_id,
        payload=ProductCreateRequest(
            name="Nasi Goreng",
            variant=ProductVariantCreateRequest(name="Porsi", selling_price=Decimal("25000")),
        ),
    )
    variant = product.variants[0]

    updated_product = await service.update_product(
        business_id=business_id,
        product_id=product.id,
        payload=ProductUpdateRequest(name="Nasi Goreng Spesial"),
    )
    updated = await service.update_variant(
        business_id=business_id,
        product_id=product.id,
        variant_id=variant.id,
        payload=ProductVariantUpdateRequest(selling_price=Decimal("27000")),
    )
    await service.archive_product(business_id=business_id, product_id=product.id)

    assert updated_product.name == "Nasi Goreng Spesial"
    assert updated.selling_price == Decimal("27000")
    assert product.status == ProductStatus.ARCHIVED


def test_product_schema_rejects_invalid_margin_and_openapi_paths_exist() -> None:
    with pytest.raises(ValidationError):
        ProductVariantCreateRequest.model_validate(
            {"name": "Regular", "selling_price": "1", "target_margin_override": "1"}
        )

    paths = create_app(make_settings()).openapi()["paths"]
    assert "/api/v1/products" in paths
    assert "/api/v1/products/{product_id}" in paths
    assert "/api/v1/products/{product_id}/variants" in paths
    assert "/api/v1/products/{product_id}/variants/{variant_id}" in paths
    assert "/api/v1/product-categories" in paths


class EmptyResult:
    def scalar_one(self) -> int:
        return 0

    def scalars(self) -> "EmptyResult":
        return self

    def all(self) -> list[Product]:
        return []


class ListSession(FakeSession):
    async def execute(self, statement: object) -> EmptyResult:
        return EmptyResult()


@pytest.mark.asyncio
async def test_product_list_route_uses_authenticated_business_scope() -> None:
    application = create_app(make_settings())
    business = make_business()

    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, ListSession())

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[current_business_dependency] = lambda: business
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/products")

    assert response.status_code == 200
    assert response.json() == {
        "data": [],
        "meta": {"page": 1, "pageSize": 20, "total": 0},
    }
