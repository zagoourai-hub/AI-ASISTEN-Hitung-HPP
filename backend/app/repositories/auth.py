from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import AuthSession, PasswordResetToken, User


class AuthRepository:
    async def find_user_by_email(self, session: AsyncSession, email: str) -> User | None:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def find_user_with_business_by_email(
        self,
        session: AsyncSession,
        email: str,
    ) -> User | None:
        result = await session.execute(
            select(User).options(selectinload(User.business)).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def find_session_by_token_hash(
        self,
        session: AsyncSession,
        token_hash: str,
    ) -> AuthSession | None:
        result = await session.execute(
            select(AuthSession)
            .options(selectinload(AuthSession.user).selectinload(User.business))
            .where(AuthSession.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def find_password_reset_token(
        self,
        session: AsyncSession,
        token_hash: str,
    ) -> PasswordResetToken | None:
        result = await session.execute(
            select(PasswordResetToken)
            .options(selectinload(PasswordResetToken.user))
            .where(PasswordResetToken.token_hash == token_hash)
            .with_for_update()
        )
        return result.scalar_one_or_none()

    def add_user(self, session: AsyncSession, user: User) -> None:
        session.add(user)

    def add_session(self, session: AsyncSession, auth_session: AuthSession) -> None:
        session.add(auth_session)

    def add_password_reset_token(
        self,
        session: AsyncSession,
        reset_token: PasswordResetToken,
    ) -> None:
        session.add(reset_token)

    async def revoke_user_sessions(
        self,
        session: AsyncSession,
        user_id: UUID,
        revoked_at: datetime,
    ) -> None:
        await session.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=revoked_at)
        )

    async def revoke_session(
        self,
        session: AsyncSession,
        auth_session: AuthSession,
        revoked_at: datetime,
    ) -> None:
        auth_session.revoked_at = revoked_at
        await session.commit()
