from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.business import Business
from app.repositories.business import BusinessRepository
from app.schemas.business import BusinessUpdateRequest


class BusinessService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: BusinessRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or BusinessRepository()

    async def get(self, *, business_id: UUID, owner_id: UUID) -> Business:
        business = await self.repository.find_owned_business(
            self.session,
            business_id=business_id,
            owner_id=owner_id,
        )
        if business is None:
            raise self._not_found()
        return business

    async def update(
        self,
        *,
        business_id: UUID,
        owner_id: UUID,
        payload: BusinessUpdateRequest,
    ) -> Business:
        async with self.session.begin():
            business = await self.repository.find_owned_business(
                self.session,
                business_id=business_id,
                owner_id=owner_id,
            )
            if business is None:
                raise self._not_found()
            pricing_setting = await self.repository.find_pricing_setting(
                self.session,
                business_id=business.id,
            )
            if pricing_setting is None:
                raise AppError(
                    ErrorCode.INTERNAL_ERROR,
                    "Business pricing setting is unavailable.",
                    status_code=500,
                )
            business.name = payload.name.strip()
            business.default_target_margin = payload.default_target_margin
            pricing_setting.rounding_strategy = payload.rounding_strategy
            pricing_setting.custom_rounding = payload.custom_rounding
            await self.session.flush()
        return business

    @staticmethod
    def _not_found() -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            "Business not found.",
            status_code=404,
        )
