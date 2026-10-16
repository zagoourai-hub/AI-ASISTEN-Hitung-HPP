from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentBusinessDependency
from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.rate_limit import AiRateLimitDependency, enforce_ai_business_quota
from app.repositories.ai import AIContextRepository
from app.schemas.ai import AIStreamRequest
from app.services.ai import OpenRouterService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/stream", response_class=StreamingResponse)
async def stream_ai_response(
    payload: AIStreamRequest,
    request: Request,
    business: CurrentBusinessDependency,
    _rate_limit: AiRateLimitDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> StreamingResponse:
    service = OpenRouterService(settings)
    service.ensure_configured()
    enforce_ai_business_quota(settings, business.id)
    context = {
        "business": {
            "name": business.name,
            "type": business.business_type,
            "currency": business.currency,
            "timezone": business.timezone,
            "defaultTargetMargin": str(business.default_target_margin),
        },
        **await AIContextRepository().snapshot(session, business_id=business.id),
    }
    return StreamingResponse(
        service.stream(
            prompt=payload.prompt,
            context=context,
            is_disconnected=request.is_disconnected,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-store, no-transform",
            "Pragma": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
