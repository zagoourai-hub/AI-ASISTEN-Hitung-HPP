from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentBusinessDependency
from app.core.database import get_db_session
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationScenarioResponse,
    RecommendationSingleResponse,
)
from app.services.recommendation import RecommendationResult, RecommendationService

router = APIRouter(tags=["pricing"])


def recommendation_response(result: RecommendationResult) -> RecommendationResponse:
    return RecommendationResponse(
        id=result.draft.id,
        product_variant_id=result.draft.product_variant_id,
        type=result.draft.type,
        current_value=result.draft.current_value,
        proposed_value=result.draft.proposed_value,
        target_margin=result.draft.target_margin,
        rounding_strategy=result.draft.rounding_strategy,
        custom_rounding=result.draft.custom_rounding,
        scenarios=[
            RecommendationScenarioResponse(
                name=scenario.name,
                target_margin=scenario.target_margin,
                proposed_price=scenario.proposed_price,
                margin_percent=scenario.margin_percent,
                profit_per_unit=scenario.profit_per_unit,
            )
            for scenario in result.scenarios
        ],
        status=result.draft.status,
        created_at=result.draft.created_at,
    )


@router.post(
    "/product-variants/{variant_id}/pricing/recommendations",
    response_model=RecommendationSingleResponse,
    status_code=201,
)
async def create_price_recommendation(
    variant_id: UUID,
    payload: RecommendationRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecommendationSingleResponse:
    result = await RecommendationService(session).create(
        business_id=business.id,
        variant_id=variant_id,
        payload=payload,
    )
    return RecommendationSingleResponse(data=recommendation_response(result))
