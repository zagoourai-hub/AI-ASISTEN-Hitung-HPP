from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentBusinessDependency, PaginationDependency
from app.core.database import get_db_session
from app.schemas.pagination import PageMeta
from app.schemas.product import (
    ProductCategoryCreateRequest,
    ProductCategoryPageResponse,
    ProductCategoryResponse,
    ProductCategoryUpdateRequest,
    ProductCreateRequest,
    ProductPageResponse,
    ProductResponse,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantResponse,
    ProductVariantUpdateRequest,
)
from app.services.product import ProductService

category_router = APIRouter(prefix="/product-categories", tags=["product-categories"])
router = APIRouter(prefix="/products", tags=["products"])


@category_router.get("", response_model=ProductCategoryPageResponse)
async def list_product_categories(
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCategoryPageResponse:
    items, total = await ProductService(session).list_categories(
        business_id=business.id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return ProductCategoryPageResponse(
        data=[ProductCategoryResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )


@category_router.post(
    "",
    response_model=ProductCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_category(
    payload: ProductCategoryCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCategoryResponse:
    category = await ProductService(session).create_category(
        business_id=business.id,
        payload=payload,
    )
    return ProductCategoryResponse.model_validate(category)


@category_router.get("/{category_id}", response_model=ProductCategoryResponse)
async def get_product_category(
    category_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCategoryResponse:
    category = await ProductService(session).get_category(
        business_id=business.id,
        category_id=category_id,
    )
    return ProductCategoryResponse.model_validate(category)


@category_router.patch("/{category_id}", response_model=ProductCategoryResponse)
async def update_product_category(
    category_id: UUID,
    payload: ProductCategoryUpdateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCategoryResponse:
    category = await ProductService(session).update_category(
        business_id=business.id,
        category_id=category_id,
        payload=payload,
    )
    return ProductCategoryResponse.model_validate(category)


@category_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_category(
    category_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    await ProductService(session).delete_category(
        business_id=business.id,
        category_id=category_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=ProductPageResponse)
async def list_products(
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    include_archived: bool = False,
) -> ProductPageResponse:
    items, total = await ProductService(session).list_products(
        business_id=business.id,
        page=pagination.page,
        page_size=pagination.page_size,
        include_archived=include_archived,
    )
    return ProductPageResponse(
        data=[ProductResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductResponse:
    product = await ProductService(session).create_product(
        business_id=business.id,
        payload=payload,
        default_target_margin=business.default_target_margin,
    )
    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductResponse:
    product = await ProductService(session).get_product(
        business_id=business.id,
        product_id=product_id,
    )
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    payload: ProductUpdateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductResponse:
    product = await ProductService(session).update_product(
        business_id=business.id,
        product_id=product_id,
        payload=payload,
        default_target_margin=business.default_target_margin,
    )
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_product(
    product_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    await ProductService(session).archive_product(
        business_id=business.id,
        product_id=product_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{product_id}/variants", response_model=list[ProductVariantResponse])
async def list_product_variants(
    product_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProductVariantResponse]:
    product = await ProductService(session).get_product(
        business_id=business.id,
        product_id=product_id,
    )
    return [ProductVariantResponse.model_validate(item) for item in product.variants]


@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_variant(
    product_id: UUID,
    payload: ProductVariantCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductVariantResponse:
    variant = await ProductService(session).create_variant(
        business_id=business.id,
        product_id=product_id,
        payload=payload,
    )
    return ProductVariantResponse.model_validate(variant)


@router.patch(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
)
async def update_product_variant(
    product_id: UUID,
    variant_id: UUID,
    payload: ProductVariantUpdateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductVariantResponse:
    variant = await ProductService(session).update_variant(
        business_id=business.id,
        product_id=product_id,
        variant_id=variant_id,
        payload=payload,
    )
    return ProductVariantResponse.model_validate(variant)
