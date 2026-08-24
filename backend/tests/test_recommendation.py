from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from pydantic import SecretStr, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.models.cost import ProductCostVersion
from app.models.product import ProductVariant
from app.models.recommendation import RecommendationDraft
from app.repositories.recommendation import RecommendationRepository
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation import RecommendationService
from app.utils.types import RecommendationStatus, RoundingStrategy


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


class FakeRecommendationRepository:
    def __init__(self, business_id: UUID, variant: ProductVariant) -> None:
        self.business_id = business_id
        self.variant = variant
        self.cost: ProductCostVersion | None = None
        self.drafts: list[RecommendationDraft] = []

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

    async def find_latest_cost(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductCostVersion | None:
        if business_id == self.business_id and variant_id == self.variant.id:
            return self.cost
        return None

    def add_draft(self, session: AsyncSession, draft: RecommendationDraft) -> None:
        self.drafts.append(draft)
        session.add(draft)


def make_fixture() -> tuple[
    RecommendationService,
    FakeRecommendationRepository,
    UUID,
    ProductVariant,
]:
    business_id = uuid4()
    variant = ProductVariant(
        id=uuid4(),
        product_id=uuid4(),
        name="Regular",
        selling_price=Decimal("60000.0000"),
    )
    repository = FakeRecommendationRepository(business_id, variant)
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    repository.cost = ProductCostVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        recipe_version_id=uuid4(),
        ingredient_cost=Decimal("40000.0000"),
        packaging_cost=Decimal("2000.0000"),
        direct_cost=Decimal("3000.0000"),
        overhead_cost=Decimal("5000.0000"),
        full_hpp=Decimal("50000.0000"),
        calculation_version="hpp-v1",
        price_as_of=as_of,
        calculated_at=as_of,
    )
    service = RecommendationService(
        cast(AsyncSession, FakeSession()),
        repository=cast(RecommendationRepository, repository),
    )
    return service, repository, business_id, variant


@pytest.mark.asyncio
async def test_recommendation_formula_and_none_rounding_keep_selling_price_unchanged() -> None:
    service, repository, business_id, variant = make_fixture()
    payload = RecommendationRequest.model_validate(
        {"targetMargin": "0.2500", "roundingStrategy": "NONE"}
    )

    result = await service.create(
        business_id=business_id,
        variant_id=variant.id,
        payload=payload,
    )

    assert result.draft.proposed_value == Decimal("66666.6667")
    assert result.draft.current_value == Decimal("60000.0000")
    assert result.draft.status == RecommendationStatus.DRAFT
    assert result.draft.target_margin == Decimal("0.2500")
    assert len(result.scenarios) == 3
    assert result.scenarios[1].name == "Ideal"
    assert result.scenarios[1].proposed_price == Decimal("66666.6667")
    assert variant.selling_price == Decimal("60000.0000")
    assert len(repository.drafts) == 1


@pytest.mark.asyncio
async def test_recommendation_rounding_strategies_are_deterministic() -> None:
    service, _repository, business_id, variant = make_fixture()
    nearest = await service.create(
        business_id=business_id,
        variant_id=variant.id,
        payload=RecommendationRequest(
            target_margin=Decimal("0.25"),
            rounding_strategy=RoundingStrategy.NEAREST_100,
        ),
    )
    custom = await service.create(
        business_id=business_id,
        variant_id=variant.id,
        payload=RecommendationRequest(
            target_margin=Decimal("0.25"),
            rounding_strategy=RoundingStrategy.CUSTOM,
            custom_rounding=Decimal("500"),
        ),
    )

    assert nearest.draft.proposed_value == Decimal("66700.0000")
    assert custom.draft.proposed_value == Decimal("67000.0000")


@pytest.mark.asyncio
async def test_recommendation_requires_cost_and_respects_tenant_scope() -> None:
    service, repository, business_id, variant = make_fixture()
    payload = RecommendationRequest(
        target_margin=Decimal("0.25"),
        rounding_strategy=RoundingStrategy.NONE,
    )
    repository.cost = None
    with pytest.raises(AppError) as missing_cost:
        await service.create(business_id=business_id, variant_id=variant.id, payload=payload)
    assert missing_cost.value.code == ErrorCode.CALCULATION_CONFLICT

    with pytest.raises(AppError) as wrong_tenant:
        await service.create(business_id=uuid4(), variant_id=variant.id, payload=payload)
    assert wrong_tenant.value.code == ErrorCode.RESOURCE_NOT_FOUND


def test_recommendation_schema_validates_margin_rounding_and_serializes_contract() -> None:
    with pytest.raises(ValidationError):
        RecommendationRequest.model_validate({"targetMargin": "1", "roundingStrategy": "NONE"})
    with pytest.raises(ValidationError):
        RecommendationRequest.model_validate({"targetMargin": "0.25", "roundingStrategy": "CUSTOM"})
    with pytest.raises(ValidationError):
        RecommendationRequest.model_validate(
            {"targetMargin": "0.25", "roundingStrategy": "NONE", "customRounding": "500"}
        )

    service, repository, business_id, variant = make_fixture()
    _ = service, repository, business_id
    draft = RecommendationDraft(
        id=uuid4(),
        product_variant_id=variant.id,
        type="COST_PLUS",
        current_value=Decimal("60000.0000"),
        proposed_value=Decimal("66700.0000"),
        target_margin=Decimal("0.2500"),
        rounding_strategy=RoundingStrategy.NEAREST_100,
        status=RecommendationStatus.DRAFT,
        created_at=datetime(2026, 8, 22, 10, tzinfo=UTC),
    )
    response = RecommendationResponse(
        id=draft.id,
        product_variant_id=draft.product_variant_id,
        type=draft.type,
        current_value=draft.current_value,
        proposed_value=draft.proposed_value,
        target_margin=draft.target_margin,
        rounding_strategy=draft.rounding_strategy,
        custom_rounding=draft.custom_rounding,
        scenarios=[],
        status=draft.status,
        created_at=draft.created_at,
    )
    dumped = response.model_dump(mode="json", by_alias=True)
    assert dumped["productVariantId"] == str(variant.id)
    assert dumped["proposedValue"] == "66700.0000"
    assert dumped["roundingStrategy"] == "NEAREST_100"


def test_recommendation_openapi_path_and_aliases_exist() -> None:
    openapi = create_app(
        Settings(
            database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
            secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        )
    ).openapi()
    paths = openapi["paths"]
    assert "/api/v1/product-variants/{variant_id}/pricing/recommendations" in paths
    schema = openapi["components"]["schemas"]["RecommendationRequest"]
    assert {"targetMargin", "roundingStrategy", "customRounding"} <= set(schema["properties"])
