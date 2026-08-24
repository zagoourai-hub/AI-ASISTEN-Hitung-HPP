from collections.abc import AsyncIterator
from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import current_business_dependency
from app.core.config import Settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.models.audit import AuditLog
from app.models.business import Business
from app.models.cost import ProductCostVersion
from app.models.overhead import Overhead
from app.models.product import ProductVariant
from app.models.recipe import RecipeVersion
from app.repositories.cost import CostRepository
from app.schemas.cost import HppCalculationRequest, ProductCostVersionResponse
from app.services.cost import CostService
from app.services.hpp import HppBreakdown, HppCalculationService, HppIngredientLine
from app.utils.types import AllocationMethod, RecipeStatus


class FakeTransaction:
    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    def begin(self) -> FakeTransaction:
        return FakeTransaction()

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        return None


class ConflictSession(FakeSession):
    async def flush(self) -> None:
        raise IntegrityError("insert", {}, RuntimeError("constraint conflict"))


class FakeCalculator:
    def __init__(self, breakdown: HppBreakdown) -> None:
        self.breakdown = breakdown

    async def calculate(
        self,
        *,
        business_id: UUID,
        variant: ProductVariant,
        recipe_version: RecipeVersion,
        overheads: list[Overhead],
        price_as_of: datetime | None = None,
    ) -> HppBreakdown:
        return self.breakdown


class FakeCostRepository:
    def __init__(self, business_id: UUID, variant: ProductVariant, recipe: RecipeVersion) -> None:
        self.business_id = business_id
        self.variant = variant
        self.recipe = recipe
        self.overheads: list[Overhead] = []
        self.costs: list[ProductCostVersion] = []
        self.audits: list[AuditLog] = []

    async def find_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        if business_id == self.business_id and variant_id == self.variant.id:
            return self.variant
        return None

    async def find_active_recipe(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> RecipeVersion | None:
        if business_id == self.business_id and variant_id == self.variant.id:
            return self.recipe if self.recipe.status == RecipeStatus.ACTIVE else None
        return None

    async def list_overheads(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
    ) -> list[Overhead]:
        return self.overheads if business_id == self.business_id else []

    async def list_cost_versions(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
        pagination: object,
    ) -> tuple[list[ProductCostVersion], int]:
        if business_id != self.business_id or variant_id != self.variant.id:
            return [], 0
        return self.costs, len(self.costs)

    def add_cost_version(self, session: AsyncSession, cost: ProductCostVersion) -> None:
        self.costs.append(cost)
        session.add(cost)

    def add_audit_log(self, session: AsyncSession, audit_log: AuditLog) -> None:
        self.audits.append(audit_log)
        session.add(audit_log)


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_fixture() -> tuple[CostService, FakeCostRepository, UUID, ProductVariant, RecipeVersion]:
    business_id = uuid4()
    variant = ProductVariant(id=uuid4(), product_id=uuid4(), name="Regular")
    recipe = RecipeVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        version=1,
        status=RecipeStatus.ACTIVE,
    )
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    breakdown = HppBreakdown(
        product_variant_id=variant.id,
        recipe_version_id=recipe.id,
        ingredient_cost=Decimal("40000.0000"),
        packaging_cost=Decimal("2000.0000"),
        direct_cost=Decimal("3000.0000"),
        overhead_cost=Decimal("5000.0000"),
        full_hpp=Decimal("50000.0000"),
        calculation_version="hpp-v1",
        price_as_of=as_of,
        calculated_at=as_of,
        ingredient_lines=(
            HppIngredientLine(
                ingredient_id=uuid4(),
                quantity=Decimal("20"),
                unit="gram",
                normalized_quantity=Decimal("20"),
                unit_cost=Decimal("2000.0000"),
                total_cost=Decimal("40000.0000"),
                price_history_id=uuid4(),
            ),
        ),
    )
    repository = FakeCostRepository(business_id, variant, recipe)
    repository.overheads.append(
        Overhead(
            id=uuid4(),
            business_id=business_id,
            name="Listrik",
            per_unit_amount=Decimal("5000"),
            allocation_method=AllocationMethod.MANUAL_PER_UNIT,
        )
    )
    service = CostService(
        cast(AsyncSession, FakeSession()),
        repository=cast(CostRepository, repository),
        calculator=cast(HppCalculationService, FakeCalculator(breakdown)),
    )
    return service, repository, business_id, variant, recipe


@pytest.mark.asyncio
async def test_calculation_persists_immutable_cost_snapshot_with_price_as_of() -> None:
    service, repository, business_id, variant, recipe = make_fixture()
    requested_as_of = datetime(2026, 8, 22, 9, tzinfo=UTC)

    cost = await service.calculate(
        business_id=business_id,
        variant_id=variant.id,
        payload=HppCalculationRequest(price_as_of=requested_as_of),
    )

    assert cost.id is not None
    assert cost.product_variant_id == variant.id
    assert cost.recipe_version_id == recipe.id
    assert cost.full_hpp == Decimal("50000.0000")
    assert cost.price_as_of == datetime(2026, 8, 22, 10, tzinfo=UTC)
    assert len(repository.costs) == 1
    assert not hasattr(service, "update")

    actor_id = uuid4()
    request_id = uuid4()
    await service.calculate(
        business_id=business_id,
        variant_id=variant.id,
        payload=HppCalculationRequest(price_as_of=requested_as_of),
        actor_id=actor_id,
        request_id=request_id,
    )
    assert repository.audits[-1].actor_id == actor_id
    assert repository.audits[-1].action == "HPP_CALCULATION"
    assert repository.audits[-1].entity_type == "PRODUCT_COST_VERSION"
    assert repository.audits[-1].entity_id == repository.costs[-1].id
    assert repository.audits[-1].request_id == request_id


@pytest.mark.asyncio
async def test_calculation_rejects_missing_active_recipe_and_cross_tenant_variant() -> None:
    service, repository, business_id, variant, _recipe = make_fixture()
    repository.recipe = RecipeVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        version=1,
        status=RecipeStatus.DRAFT,
    )
    with pytest.raises(AppError) as recipe_error:
        await service.calculate(
            business_id=business_id,
            variant_id=variant.id,
            payload=HppCalculationRequest(),
        )
    assert recipe_error.value.code == ErrorCode.INVALID_RECIPE_STATE

    with pytest.raises(AppError) as tenant_error:
        await service.calculate(
            business_id=uuid4(),
            variant_id=variant.id,
            payload=HppCalculationRequest(),
        )
    assert tenant_error.value.code == ErrorCode.RESOURCE_NOT_FOUND


@pytest.mark.asyncio
async def test_calculation_maps_database_conflict_to_retryable_domain_error() -> None:
    service, repository, business_id, variant, _recipe = make_fixture()
    service.session = cast(AsyncSession, ConflictSession())

    with pytest.raises(AppError) as error:
        await service.calculate(
            business_id=business_id,
            variant_id=variant.id,
            payload=HppCalculationRequest(),
        )

    assert error.value.code == ErrorCode.CALCULATION_CONFLICT
    assert error.value.status_code == 409
    assert repository.costs


def test_cost_response_serializes_decimal_and_camel_case_contract() -> None:
    _service, _repository, business_id, variant, recipe = make_fixture()
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    cost = ProductCostVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        recipe_version_id=recipe.id,
        ingredient_cost=Decimal("40000.0000"),
        packaging_cost=Decimal("2000.0000"),
        direct_cost=Decimal("3000.0000"),
        overhead_cost=Decimal("5000.0000"),
        full_hpp=Decimal("50000.0000"),
        calculation_version="hpp-v1",
        price_as_of=as_of,
        calculated_at=as_of,
    )
    response = ProductCostVersionResponse.model_validate(cost)
    payload = response.model_dump(mode="json", by_alias=True)

    assert payload["productVariantId"] == str(variant.id)
    assert payload["fullHpp"] == "50000.0000"
    assert payload["calculationVersion"] == "hpp-v1"
    assert str(business_id) not in payload.values()


def test_hpp_openapi_paths_accept_camel_price_as_of() -> None:
    openapi = create_app(make_settings()).openapi()
    paths = openapi["paths"]
    assert "/api/v1/product-variants/{variant_id}/hpp/calculations" in paths
    assert "/api/v1/product-variants/{variant_id}/hpp/history" in paths
    schema_name = paths["/api/v1/product-variants/{variant_id}/hpp/calculations"]["post"][
        "requestBody"
    ]["content"]["application/json"]["schema"]["$ref"].rsplit("/", maxsplit=1)[-1]
    assert schema_name == "HppCalculationRequest"
    assert "priceAsOf" in openapi["components"]["schemas"][schema_name]["properties"]


class CostHistoryResult:
    def __init__(self, cost: ProductCostVersion | None = None) -> None:
        self.cost = cost

    def scalar_one(self) -> int:
        return 1 if self.cost is not None else 0

    def scalars(self) -> "CostHistoryResult":
        return self

    def all(self) -> list[ProductCostVersion]:
        return [self.cost] if self.cost is not None else []


class CostHistorySession:
    def __init__(self, cost: ProductCostVersion) -> None:
        self.cost = cost
        self.calls = 0

    async def execute(self, statement: object) -> CostHistoryResult:
        self.calls += 1
        return CostHistoryResult(self.cost)


@pytest.mark.asyncio
async def test_hpp_history_route_is_paginated_and_tenant_scoped() -> None:
    _service, _repository, _business_id, variant, recipe = make_fixture()
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    cost = ProductCostVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        recipe_version_id=recipe.id,
        ingredient_cost=Decimal("40000.0000"),
        packaging_cost=Decimal("2000.0000"),
        direct_cost=Decimal("3000.0000"),
        overhead_cost=Decimal("5000.0000"),
        full_hpp=Decimal("50000.0000"),
        calculation_version="hpp-v1",
        price_as_of=as_of,
        calculated_at=as_of,
    )
    application = create_app(make_settings())
    business = Business(
        id=uuid4(),
        owner_id=uuid4(),
        name="Warung",
        business_type="Kuliner",
    )

    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, CostHistorySession(cost))

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[current_business_dependency] = lambda: business
    transport = httpx.ASGITransport(app=application)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/v1/product-variants/{variant.id}/hpp/history")

    assert response.status_code == 200
    assert response.json()["meta"] == {"page": 1, "pageSize": 20, "total": 1}
    assert response.json()["data"][0]["fullHpp"] == "50000.0000"
