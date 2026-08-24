from typing import Annotated

from fastapi import Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.core.request_context import RequestContext, get_request_context
from app.core.security import hash_token, is_token_active
from app.models.auth import AuthSession, User
from app.models.business import Business
from app.repositories.auth import AuthRepository
from app.schemas.pagination import PaginationParams


def pagination_dependency(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


async def request_context_dependency(request: Request) -> RequestContext:
    return get_request_context(request)


class CurrentAuth:
    def __init__(
        self,
        *,
        user: User,
        auth_session: AuthSession,
    ) -> None:
        self.user = user
        self.auth_session = auth_session
        self.business = user.business


async def current_auth_dependency(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentAuth:
    raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        raise AppError(
            ErrorCode.UNAUTHENTICATED,
            "Authentication required.",
            status_code=401,
        )

    auth_session = await AuthRepository().find_session_by_token_hash(
        session,
        hash_token(raw_token),
    )
    if auth_session is None or not is_token_active(
        expires_at=auth_session.expires_at,
        revoked_at=auth_session.revoked_at,
    ):
        raise AppError(
            ErrorCode.UNAUTHENTICATED,
            "Authentication required.",
            status_code=401,
        )

    # End the read-only auth transaction before a route service opens its write transaction.
    await session.commit()
    request.state.user_id = auth_session.user.id
    if auth_session.user.business is not None:
        request.state.business_id = auth_session.user.business.id
    return CurrentAuth(user=auth_session.user, auth_session=auth_session)


async def tenant_scope_dependency(
    context: Annotated[RequestContext, Depends(request_context_dependency)],
) -> RequestContext:
    if context.user_id is None or context.business_id is None:
        raise AppError(
            ErrorCode.UNAUTHENTICATED,
            "Authentication required.",
            status_code=401,
        )
    return context


async def current_business_dependency(
    current_auth: Annotated[CurrentAuth, Depends(current_auth_dependency)],
) -> Business:
    if current_auth.business is None:
        raise AppError(
            ErrorCode.INTERNAL_ERROR,
            "Business context is unavailable.",
            status_code=500,
        )
    return current_auth.business


PaginationDependency = Annotated[PaginationParams, Depends(pagination_dependency)]
RequestContextDependency = Annotated[RequestContext, Depends(request_context_dependency)]
TenantScopeDependency = Annotated[RequestContext, Depends(tenant_scope_dependency)]
CurrentAuthDependency = Annotated[CurrentAuth, Depends(current_auth_dependency)]
CurrentBusinessDependency = Annotated[Business, Depends(current_business_dependency)]
