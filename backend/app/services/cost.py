from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.audit import AuditLog
from app.models.cost import ProductCostVersion
from app.repositories.cost import CostRepository
from app.schemas.cost import HppCalculationRequest
from app.services.hpp import HppCalculationService
from app.utils.types import new_id, utc_now


class CostService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: CostRepository | None = None,
        calculator: HppCalculationService | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or CostRepository()
        self.calculator = calculator or HppCalculationService(session)

    async def calculate(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        payload: HppCalculationRequest,
        actor_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> ProductCostVersion:
        try:
            async with self.session.begin():
                variant = await self.repository.find_variant(
                    self.session,
                    business_id=business_id,
                    variant_id=variant_id,
                )
                if variant is None:
                    raise self._not_found("Product variant")
                recipe = await self.repository.find_active_recipe(
                    self.session,
                    business_id=business_id,
                    variant_id=variant.id,
                )
                if recipe is None:
                    raise AppError(
                        ErrorCode.INVALID_RECIPE_STATE,
                        "An active recipe is required before calculating HPP.",
                        status_code=422,
                    )
                overheads = await self.repository.list_overheads(
                    self.session,
                    business_id=business_id,
                )
                breakdown = await self.calculator.calculate(
                    business_id=business_id,
                    variant=variant,
                    recipe_version=recipe,
                    overheads=overheads,
                    price_as_of=payload.price_as_of,
                )
                cost = ProductCostVersion(
                    id=new_id(),
                    product_variant_id=breakdown.product_variant_id,
                    recipe_version_id=breakdown.recipe_version_id,
                    ingredient_cost=breakdown.ingredient_cost,
                    packaging_cost=breakdown.packaging_cost,
                    direct_cost=breakdown.direct_cost,
                    overhead_cost=breakdown.overhead_cost,
                    full_hpp=breakdown.full_hpp,
                    calculation_version=breakdown.calculation_version,
                    price_as_of=breakdown.price_as_of,
                    calculated_at=breakdown.calculated_at,
                )
                self.repository.add_cost_version(self.session, cost)
                await self.session.flush()
                if actor_id is not None and request_id is not None:
                    self.repository.add_audit_log(
                        self.session,
                        AuditLog(
                            id=new_id(),
                            actor_id=actor_id,
                            action="HPP_CALCULATION",
                            entity_type="PRODUCT_COST_VERSION",
                            entity_id=cost.id,
                            request_id=request_id,
                            created_at=utc_now(),
                        ),
                    )
                    await self.session.flush()
        except IntegrityError as error:
            raise AppError(
                ErrorCode.CALCULATION_CONFLICT,
                "HPP calculation conflicted with another database change. Please retry.",
                status_code=409,
            ) from error
        return cost

    async def history(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[ProductCostVersion], int]:
        from app.schemas.pagination import PaginationParams

        return await self.repository.list_cost_versions(
            self.session,
            business_id=business_id,
            variant_id=variant_id,
            pagination=PaginationParams(page=page, page_size=page_size),
        )

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found.",
            status_code=404,
        )
