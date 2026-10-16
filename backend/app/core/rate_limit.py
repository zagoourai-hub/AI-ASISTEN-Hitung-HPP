from __future__ import annotations

from time import monotonic
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request

from app.core.client_ip import rate_limit_identity, resolve_client_ip
from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, ErrorCode

AI_DAILY_WINDOW_SECONDS = 86_400


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, list[float]] = {}

    def check(self, *, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        events = [event for event in self._events.get(key, []) if event > cutoff]
        if len(events) >= limit:
            self._events[key] = events
            raise AppError(
                ErrorCode.RATE_LIMITED,
                "Too many requests.",
                status_code=429,
            )
        events.append(now)
        self._events[key] = events


# ponytail: process-local limiter; use a shared store when multiple workers need one quota.
auth_rate_limiter = InMemoryRateLimiter()


def _client_key(request: Request, settings: Settings, scope: str | None = None) -> str:
    identity = rate_limit_identity(resolve_client_ip(request, settings))
    return f"{id(settings)}:{scope or request.url.path}:{identity}"


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


async def register_rate_limit_dependency(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    # Per-IP cap on account creation (default 3/day) so account hopping cannot reset quotas.
    auth_rate_limiter.check(
        key=_client_key(request, settings, scope="register-quota"),
        limit=settings.rate_limit_register_requests,
        window_seconds=settings.rate_limit_register_window_seconds,
    )
    await auth_rate_limit_dependency(request, settings)


AuthRateLimitDependency = Annotated[None, Depends(auth_rate_limit_dependency)]
LoginRateLimitDependency = Annotated[None, Depends(login_rate_limit_dependency)]
RegisterRateLimitDependency = Annotated[None, Depends(register_rate_limit_dependency)]


async def ai_rate_limit_dependency(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    auth_rate_limiter.check(
        key=_client_key(request, settings),
        limit=settings.rate_limit_ai_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )
    auth_rate_limiter.check(
        key=_client_key(request, settings, scope="ai-daily-ip"),
        limit=settings.rate_limit_ai_daily_ip_requests,
        window_seconds=AI_DAILY_WINDOW_SECONDS,
    )


AiRateLimitDependency = Annotated[None, Depends(ai_rate_limit_dependency)]


def enforce_ai_business_quota(settings: Settings, business_id: UUID) -> None:
    auth_rate_limiter.check(
        key=f"{id(settings)}:ai-daily-business:{business_id}",
        limit=settings.rate_limit_ai_daily_business_requests,
        window_seconds=AI_DAILY_WINDOW_SECONDS,
    )
