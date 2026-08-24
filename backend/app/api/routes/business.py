from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentAuthDependency
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.schemas.business import (
    BusinessResponse,
    BusinessSingleResponse,
    BusinessUpdateRequest,
)
from app.services.business import BusinessService

router = APIRouter(prefix="/business", tags=["business"])


@router.get("", response_model=BusinessSingleResponse)
async def get_business(
    current_auth: CurrentAuthDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BusinessSingleResponse:
    if current_auth.business is None:
        raise AppError(
            ErrorCode.INTERNAL_ERROR,
            "Business context is unavailable.",
            status_code=500,
        )
    business = await BusinessService(session).get(
        business_id=current_auth.business.id,
        owner_id=current_auth.user.id,
    )
    return BusinessSingleResponse(data=BusinessResponse.model_validate(business))


@router.patch("", response_model=BusinessSingleResponse)
async def update_business(
    payload: BusinessUpdateRequest,
    current_auth: CurrentAuthDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BusinessSingleResponse:
    if current_auth.business is None:
        raise AppError(
            ErrorCode.INTERNAL_ERROR,
            "Business context is unavailable.",
            status_code=500,
        )
    business = await BusinessService(session).update(
        business_id=current_auth.business.id,
        owner_id=current_auth.user.id,
        payload=payload,
    )
    return BusinessSingleResponse(data=BusinessResponse.model_validate(business))
