from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health(request: Request) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=request.app.title,
        version=request.app.version,
    )
