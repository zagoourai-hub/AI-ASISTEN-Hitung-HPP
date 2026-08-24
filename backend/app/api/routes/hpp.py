from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    CurrentAuthDependency,
    CurrentBusinessDependency,
    PaginationDependency,
)
from app.core.database import get_db_session
from app.core.request_context import get_request_id
from app.schemas.cost import (
    HppCalculationRequest,
    ProductCostVersionPageResponse,
    ProductCostVersionResponse,
    ProductCostVersionSingleResponse,
)
from app.schemas.pagination import PageMeta
from app.services.cost import CostService

router = APIRouter(tags=["hpp"])


@router.post(
    "/product-variants/{variant_id}/hpp/calculations",
    response_model=ProductCostVersionSingleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def calculate_variant_hpp(
    variant_id: UUID,
    payload: HppCalculationRequest,
    request: Request,
    current_auth: CurrentAuthDependency,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCostVersionSingleResponse:
    cost = await CostService(session).calculate(
        business_id=business.id,
        variant_id=variant_id,
        payload=payload,
        actor_id=current_auth.user.id,
        request_id=get_request_id(request),
    )
    return ProductCostVersionSingleResponse(
        data=ProductCostVersionResponse.model_validate(cost),
    )


@router.get(
    "/product-variants/{variant_id}/hpp/history",
    response_model=ProductCostVersionPageResponse,
)
async def list_variant_hpp_history(
    variant_id: UUID,
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductCostVersionPageResponse:
    items, total = await CostService(session).history(
        business_id=business.id,
        variant_id=variant_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return ProductCostVersionPageResponse(
        data=[ProductCostVersionResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )
