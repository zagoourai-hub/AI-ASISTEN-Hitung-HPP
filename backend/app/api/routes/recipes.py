from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentBusinessDependency, PaginationDependency
from app.core.database import get_db_session
from app.schemas.pagination import PageMeta
from app.schemas.recipe import (
    RecipeCreateRequest,
    RecipeUpdateRequest,
    RecipeVersionPageResponse,
    RecipeVersionResponse,
)
from app.services.recipe import RecipeService

router = APIRouter(tags=["recipes"])


@router.get(
    "/product-variants/{variant_id}/recipes",
    response_model=RecipeVersionPageResponse,
)
async def list_recipe_versions(
    variant_id: UUID,
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecipeVersionPageResponse:
    items, total = await RecipeService(session).list_versions(
        business_id=business.id,
        variant_id=variant_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return RecipeVersionPageResponse(
        data=[RecipeVersionResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )


@router.post(
    "/product-variants/{variant_id}/recipes",
    response_model=RecipeVersionResponse,
    status_code=201,
)
async def create_recipe_version(
    variant_id: UUID,
    payload: RecipeCreateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecipeVersionResponse:
    recipe_version = await RecipeService(session).create_version(
        business_id=business.id,
        variant_id=variant_id,
        payload=payload,
    )
    return RecipeVersionResponse.model_validate(recipe_version)


@router.patch("/recipe-versions/{recipe_version_id}", response_model=RecipeVersionResponse)
async def update_recipe_draft(
    recipe_version_id: UUID,
    payload: RecipeUpdateRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecipeVersionResponse:
    recipe_version = await RecipeService(session).update_draft(
        business_id=business.id,
        recipe_version_id=recipe_version_id,
        payload=payload,
    )
    return RecipeVersionResponse.model_validate(recipe_version)


@router.post(
    "/recipe-versions/{recipe_version_id}/activate",
    response_model=RecipeVersionResponse,
)
async def activate_recipe_version(
    recipe_version_id: UUID,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecipeVersionResponse:
    recipe_version = await RecipeService(session).activate(
        business_id=business.id,
        recipe_version_id=recipe_version_id,
    )
    return RecipeVersionResponse.model_validate(recipe_version)
