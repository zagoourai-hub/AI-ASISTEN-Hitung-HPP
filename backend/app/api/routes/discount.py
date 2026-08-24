from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentBusinessDependency
from app.core.database import get_db_session
from app.schemas.discount import (
    DiscountSimulationRequest,
    DiscountSimulationResponse,
    DiscountSimulationSingleResponse,
)
from app.services.discount import DiscountService, DiscountSimulation

router = APIRouter(tags=["pricing"])


def discount_response(result: DiscountSimulation) -> DiscountSimulationResponse:
    return DiscountSimulationResponse(
        base_selling_price=result.base_selling_price,
        discount_percent=result.discount_percent,
        discount_amount=result.discount_amount,
        net_selling_price=result.net_selling_price,
        full_hpp=result.full_hpp,
        net_profit=result.net_profit,
        net_margin_percent=result.net_margin_percent,
        is_loss=result.is_loss,
    )


@router.post(
    "/product-variants/{variant_id}/pricing/discount-simulations",
    response_model=DiscountSimulationSingleResponse,
)
async def simulate_variant_discount(
    variant_id: UUID,
    payload: DiscountSimulationRequest,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DiscountSimulationSingleResponse:
    result = await DiscountService(session).simulate(
        business_id=business.id,
        variant_id=variant_id,
        payload=payload,
    )
    return DiscountSimulationSingleResponse(data=discount_response(result))
