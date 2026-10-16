from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentAuthDependency
from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.rate_limit import (
    AuthRateLimitDependency,
    LoginRateLimitDependency,
    RegisterRateLimitDependency,
)
from app.core.security import clear_session_cookie, set_session_cookie
from app.schemas.auth import (
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetResponse,
    RegisteredBusiness,
    RegisteredUser,
    RegisterRequest,
    RegisterResponse,
)
from app.services.auth import (
    AuthLoginService,
    AuthPasswordResetService,
    AuthRegistrationService,
    AuthSessionService,
    RegisterResult,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def to_auth_response(result: RegisterResult) -> RegisterResponse:
    return RegisterResponse(
        user=RegisteredUser(
            id=result.user.id,
            email=result.user.email,
            role=result.user.role,
        ),
        business=RegisteredBusiness(
            id=result.business.id,
            name=result.business.name,
            business_type=result.business.business_type,
            currency="IDR",
            timezone=result.business.timezone,
            default_target_margin=result.business.default_target_margin,
        ),
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    response: Response,
    _rate_limit: RegisterRateLimitDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RegisterResponse:
    result = await AuthRegistrationService(session, settings).register(payload)
    set_session_cookie(response, token=result.raw_session_token, settings=settings)
    return to_auth_response(result)


@router.post("/login", response_model=RegisterResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    _rate_limit: LoginRateLimitDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RegisterResponse:
    result = await AuthLoginService(session, settings).login(payload)
    set_session_cookie(response, token=result.raw_session_token, settings=settings)
    return to_auth_response(result)


@router.post("/password-reset/request", response_model=PasswordResetResponse)
async def request_password_reset(
    payload: PasswordResetRequest,
    _rate_limit: AuthRateLimitDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> PasswordResetResponse:
    await AuthPasswordResetService(session, settings).request(payload)
    return PasswordResetResponse(
        message="If the account exists, password reset instructions have been sent."
    )


@router.post("/password-reset/confirm", response_model=PasswordResetResponse)
async def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    _rate_limit: AuthRateLimitDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> PasswordResetResponse:
    await AuthPasswordResetService(session, settings).confirm(payload)
    return PasswordResetResponse(message="Password has been reset.")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_auth: CurrentAuthDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    await AuthSessionService(session).revoke(current_auth.auth_session)
    clear_session_cookie(response, settings=settings)


@router.get("/me", response_model=RegisterResponse)
async def current_user(current_auth: CurrentAuthDependency) -> RegisterResponse:
    if current_auth.business is None:
        raise RuntimeError("authenticated user has no business")
    return to_auth_response(
        RegisterResult(
            user=current_auth.user,
            business=current_auth.business,
            raw_session_token="",
        )
    )
