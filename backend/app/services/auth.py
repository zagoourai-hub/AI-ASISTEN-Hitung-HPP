from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import AppError, ErrorCode
from app.core.security import (
    hash_password,
    hash_token,
    issue_token,
    normalize_email,
    verify_password,
)
from app.models.auth import AuthSession, PasswordResetToken, User
from app.models.business import Business, BusinessPricingSetting
from app.repositories.auth import AuthRepository
from app.repositories.business import BusinessRepository
from app.schemas.auth import (
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RegisterRequest,
)
from app.utils.types import Timestamp, UserRole, ensure_utc, new_id, utc_now


@dataclass(frozen=True, slots=True)
class RegisterResult:
    user: User
    business: Business
    raw_session_token: str


@dataclass(frozen=True, slots=True)
class PasswordResetRequestResult:
    raw_token: str | None


class AuthRegistrationService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        *,
        auth_repository: AuthRepository | None = None,
        business_repository: BusinessRepository | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.auth_repository = auth_repository or AuthRepository()
        self.business_repository = business_repository or BusinessRepository()

    async def register(self, payload: RegisterRequest) -> RegisterResult:
        email = normalize_email(payload.email)
        try:
            async with self.session.begin():
                if await self.auth_repository.find_user_by_email(self.session, email):
                    raise AppError(
                        ErrorCode.DUPLICATE_RESOURCE,
                        "An account with this email already exists.",
                        status_code=409,
                    )

                user = User(
                    id=new_id(),
                    email=email,
                    password_hash=hash_password(payload.password),
                    role=UserRole.OWNER,
                )
                business = Business(
                    id=new_id(),
                    owner_id=user.id,
                    name=payload.business_name,
                    business_type=payload.business_type,
                    timezone=payload.timezone,
                    default_target_margin=payload.default_target_margin,
                )
                pricing_setting = BusinessPricingSetting(
                    id=new_id(),
                    business_id=business.id,
                )
                issued_token = issue_token(
                    lifetime=timedelta(seconds=self.settings.session_cookie_max_age_seconds)
                )
                auth_session = AuthSession(
                    id=new_id(),
                    user_id=user.id,
                    token_hash=issued_token.token_hash,
                    expires_at=issued_token.expires_at,
                )

                self.auth_repository.add_user(self.session, user)
                self.business_repository.add_business(self.session, business)
                self.business_repository.add_pricing_setting(self.session, pricing_setting)
                self.auth_repository.add_session(self.session, auth_session)
                await self.session.flush()
        except IntegrityError as error:
            raise AppError(
                ErrorCode.DUPLICATE_RESOURCE,
                "An account with this email already exists.",
                status_code=409,
            ) from error

        return RegisterResult(
            user=user,
            business=business,
            raw_session_token=issued_token.raw_token,
        )


class AuthLoginService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        *,
        auth_repository: AuthRepository | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.auth_repository = auth_repository or AuthRepository()

    async def login(self, payload: LoginRequest) -> RegisterResult:
        email = normalize_email(payload.email)
        async with self.session.begin():
            user = await self.auth_repository.find_user_with_business_by_email(
                self.session,
                email,
            )
            if user is None or not verify_password(payload.password, user.password_hash):
                raise AppError(
                    ErrorCode.UNAUTHENTICATED,
                    "Invalid email or password.",
                    status_code=401,
                )
            if user.business is None:
                raise AppError(
                    ErrorCode.INTERNAL_ERROR,
                    "Account setup is incomplete.",
                    status_code=500,
                )

            issued_token = issue_token(
                lifetime=timedelta(seconds=self.settings.session_cookie_max_age_seconds)
            )
            auth_session = AuthSession(
                id=new_id(),
                user_id=user.id,
                token_hash=issued_token.token_hash,
                expires_at=issued_token.expires_at,
            )
            self.auth_repository.add_session(self.session, auth_session)
            await self.session.flush()

        return RegisterResult(
            user=user,
            business=user.business,
            raw_session_token=issued_token.raw_token,
        )


class AuthSessionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def revoke(self, auth_session: AuthSession, *, now: Timestamp | None = None) -> None:
        auth_session.revoked_at = ensure_utc(now or utc_now())
        await self.session.commit()


class AuthPasswordResetService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        *,
        auth_repository: AuthRepository | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.auth_repository = auth_repository or AuthRepository()

    async def request(self, payload: PasswordResetRequest) -> PasswordResetRequestResult:
        email = normalize_email(payload.email)
        async with self.session.begin():
            user = await self.auth_repository.find_user_by_email(self.session, email)
            if user is None:
                return PasswordResetRequestResult(raw_token=None)

            issued_token = issue_token(
                lifetime=timedelta(
                    seconds=self.settings.password_reset_token_max_age_seconds,
                )
            )
            reset_token = PasswordResetToken(
                id=new_id(),
                user_id=user.id,
                token_hash=issued_token.token_hash,
                expires_at=issued_token.expires_at,
            )
            self.auth_repository.add_password_reset_token(self.session, reset_token)
            await self.session.flush()

        return PasswordResetRequestResult(raw_token=issued_token.raw_token)

    async def confirm(self, payload: PasswordResetConfirmRequest) -> None:
        now = utc_now()
        async with self.session.begin():
            reset_token = await self.auth_repository.find_password_reset_token(
                self.session,
                hash_token(payload.token),
            )
            if (
                reset_token is None
                or reset_token.used_at is not None
                or ensure_utc(reset_token.expires_at) <= now
            ):
                raise AppError(
                    ErrorCode.UNAUTHENTICATED,
                    "Reset token is invalid or expired.",
                    status_code=400,
                )

            reset_token.used_at = now
            reset_token.user.password_hash = hash_password(payload.new_password)
            await self.auth_repository.revoke_user_sessions(
                self.session,
                reset_token.user.id,
                now,
            )
            await self.session.flush()
