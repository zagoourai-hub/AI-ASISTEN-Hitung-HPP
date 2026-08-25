from __future__ import annotations

from time import monotonic
from typing import Annotated

from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, ErrorCode


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, list[float]] = {}

    def check(self, *, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        events = [event for event in self._events.get(key, []) if event > cutoff]
        if len(events) >= limit:
            raise AppError(
                ErrorCode.RATE_LIMITED,
                "Too many requests.",
                status_code=429,
            )
        events.append(now)
        self._events[key] = events


# ponytail: process-local limiter; use a shared store when multiple workers need one quota.
auth_rate_limiter = InMemoryRateLimiter()


def _client_key(request: Request, settings: Settings) -> str:
    client_host = request.client.host if request.client is not None else "unknown"
    return f"{id(settings)}:{request.url.path}:{client_host}"


async def auth_rate_limit_dependency(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    auth_rate_limiter.check(
        key=_client_key(request, settings),
        limit=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


async def login_rate_limit_dependency(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    auth_rate_limiter.check(
        key=_client_key(request, settings),
        limit=settings.rate_limit_login_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


AuthRateLimitDependency = Annotated[None, Depends(auth_rate_limit_dependency)]
LoginRateLimitDependency = Annotated[None, Depends(login_rate_limit_dependency)]


async def ai_rate_limit_dependency(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    auth_rate_limiter.check(
        key=_client_key(request, settings),
        limit=settings.rate_limit_ai_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


AiRateLimitDependency = Annotated[None, Depends(ai_rate_limit_dependency)]
