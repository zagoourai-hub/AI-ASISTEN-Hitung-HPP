from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business, BusinessPricingSetting
from app.repositories.tenant import business_scope_clause


class BusinessRepository:
    async def find_owned_business(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        owner_id: UUID,
    ) -> Business | None:
        result = await session.execute(
            select(Business).where(
                business_scope_clause(Business.id, business_id),
                Business.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_pricing_setting(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
    ) -> BusinessPricingSetting | None:
        result = await session.execute(
            select(BusinessPricingSetting).where(
                business_scope_clause(BusinessPricingSetting.business_id, business_id)
            )
        )
        return result.scalar_one_or_none()

    def add_business(self, session: AsyncSession, business: Business) -> None:
        session.add(business)

    def add_pricing_setting(
        self,
        session: AsyncSession,
        pricing_setting: BusinessPricingSetting,
    ) -> None:
        session.add(pricing_setting)
