from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    CurrentBusinessDependency,
    PaginationDependency,
)
from app.core.database import get_db_session
from app.schemas.ingredient import (
    IngredientCreateRequest,
    IngredientDetailResponse,
    IngredientPageResponse,
    IngredientResponse,
    IngredientUpdateRequest,
    PriceHistoryCreateRequest,
    PriceHistoryResponse,
    UnitConversionCreateRequest,
    UnitConversionResponse,
)
from app.schemas.pagination import PageMeta
from app.services.ingredient import IngredientService

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=IngredientPageResponse)
async def list_ingredients(
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> IngredientPageResponse:
    items, total = await IngredientService(session).list(
        business_id=business.id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return IngredientPageResponse(
        data=[IngredientResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )


@router.post("", response_model=IngredientDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    payload: IngredientCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> IngredientDetailResponse:
    ingredient = await IngredientService(session).create(
        business_id=business.id,
        payload=payload,
    )
    return IngredientDetailResponse.model_validate(ingredient)


@router.get("/{ingredient_id}", response_model=IngredientDetailResponse)
async def get_ingredient(
    ingredient_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> IngredientDetailResponse:
    ingredient = await IngredientService(session).get(
        business_id=business.id,
        ingredient_id=ingredient_id,
    )
    return IngredientDetailResponse.model_validate(ingredient)


@router.patch("/{ingredient_id}", response_model=IngredientDetailResponse)
async def update_ingredient(
    ingredient_id: UUID,
    payload: IngredientUpdateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> IngredientDetailResponse:
    ingredient = await IngredientService(session).update(
        business_id=business.id,
        ingredient_id=ingredient_id,
        payload=payload,
    )
    return IngredientDetailResponse.model_validate(ingredient)


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_ingredient(
    ingredient_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    await IngredientService(session).archive(
        business_id=business.id,
        ingredient_id=ingredient_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{ingredient_id}/prices",
    response_model=PriceHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_ingredient_price(
    ingredient_id: UUID,
    payload: PriceHistoryCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PriceHistoryResponse:
    price_history = await IngredientService(session).add_price(
        business_id=business.id,
        ingredient_id=ingredient_id,
        payload=payload,
    )
    return PriceHistoryResponse.model_validate(price_history)


@router.post(
    "/{ingredient_id}/conversions",
    response_model=UnitConversionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_ingredient_conversion(
    ingredient_id: UUID,
    payload: UnitConversionCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UnitConversionResponse:
    conversion = await IngredientService(session).add_conversion(
        business_id=business.id,
        ingredient_id=ingredient_id,
        payload=payload,
    )
    return UnitConversionResponse.model_validate(conversion)
