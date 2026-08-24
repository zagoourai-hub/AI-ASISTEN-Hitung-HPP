from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from dataclasses import dataclass
from time import perf_counter
from uuid import UUID, uuid4

import structlog
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
_request_id_context: ContextVar[UUID | None] = ContextVar("request_id", default=None)
logger = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class RequestContext:
    request_id: UUID
    user_id: UUID | None = None
    business_id: UUID | None = None


def parse_request_id(value: str | None) -> UUID:
    if value:
        try:
            return UUID(value)
        except ValueError:
            pass
    return uuid4()


def get_request_id(request: Request) -> UUID:
    state_request_id = getattr(request.state, "request_id", None)
    if isinstance(state_request_id, UUID):
        return state_request_id
    return _request_id_context.get() or uuid4()


def get_request_context(request: Request) -> RequestContext:
    user_id = getattr(request.state, "user_id", None)
    business_id = getattr(request.state, "business_id", None)
    return RequestContext(
        request_id=get_request_id(request),
        user_id=user_id if isinstance(user_id, UUID) else None,
        business_id=business_id if isinstance(business_id, UUID) else None,
    )


async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = parse_request_id(request.headers.get(REQUEST_ID_HEADER))
    request.state.request_id = request_id
    request_token = _request_id_context.set(request_id)
    log_tokens = structlog.contextvars.bind_contextvars(request_id=str(request_id))
    started_at = perf_counter()
    response: Response | None = None
    try:
        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = str(request_id)
        return response
    finally:
        logger.info(
            "request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code if response is not None else 500,
            duration_ms=round((perf_counter() - started_at) * 1000, 3),
        )
        structlog.contextvars.reset_contextvars(**log_tokens)
        _request_id_context.reset(request_token)
