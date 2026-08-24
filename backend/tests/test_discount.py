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
from app.repositories.recommendation import RecommendationRepository
from app.schemas.discount import DiscountSimulationRequest, DiscountSimulationResponse
from app.services.discount import DiscountService


class FakeRecommendationRepository:
    def __init__(self, business_id: UUID, variant: ProductVariant) -> None:
        self.business_id = business_id
        self.variant = variant
        self.cost: ProductCostVersion | None = None

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


def make_fixture() -> tuple[DiscountService, FakeRecommendationRepository, UUID, ProductVariant]:
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
    service = DiscountService(
        cast(AsyncSession, object()),
        repository=cast(RecommendationRepository, repository),
    )
    return service, repository, business_id, variant


@pytest.mark.asyncio
async def test_discount_simulation_returns_decimal_profit_margin_without_mutation() -> None:
    service, _repository, business_id, variant = make_fixture()
    result = await service.simulate(
        business_id=business_id,
        variant_id=variant.id,
        payload=DiscountSimulationRequest.model_validate(
            {"discountPercent": "10", "baseSellingPrice": "60000"}
        ),
    )

    assert result.base_selling_price == Decimal("60000.0000")
    assert result.discount_amount == Decimal("6000.0000")
    assert result.net_selling_price == Decimal("54000.0000")
    assert result.full_hpp == Decimal("50000.0000")
    assert result.net_profit == Decimal("4000.0000")
    assert result.net_margin_percent == Decimal("7.4074")
    assert result.is_loss is False
    assert variant.selling_price == Decimal("60000.0000")


@pytest.mark.asyncio
async def test_discount_simulation_flags_loss_and_rejects_invalid_discount_or_net_price() -> None:
    service, _repository, business_id, variant = make_fixture()
    loss = await service.simulate(
        business_id=business_id,
        variant_id=variant.id,
        payload=DiscountSimulationRequest(
            discount_percent=Decimal("0"),
            base_selling_price=Decimal("40000"),
        ),
    )
    assert loss.net_profit == Decimal("-10000.0000")
    assert loss.net_margin_percent == Decimal("-25.0000")
    assert loss.is_loss is True

    with pytest.raises(ValidationError):
        DiscountSimulationRequest.model_validate({"discountPercent": "100"})

    with pytest.raises(AppError) as zero_price:
        await service.simulate(
            business_id=business_id,
            variant_id=variant.id,
            payload=DiscountSimulationRequest(
                discount_percent=Decimal("0"),
                base_selling_price=Decimal("0"),
            ),
        )
    assert zero_price.value.code == ErrorCode.VALIDATION_ERROR


@pytest.mark.asyncio
async def test_discount_simulation_requires_cost_and_tenant_scope() -> None:
    service, repository, business_id, variant = make_fixture()
    payload = DiscountSimulationRequest(discount_percent=Decimal("10"))
    repository.cost = None
    with pytest.raises(AppError) as missing_cost:
        await service.simulate(business_id=business_id, variant_id=variant.id, payload=payload)
    assert missing_cost.value.code == ErrorCode.CALCULATION_CONFLICT

    with pytest.raises(AppError) as tenant_error:
        await service.simulate(business_id=uuid4(), variant_id=variant.id, payload=payload)
    assert tenant_error.value.code == ErrorCode.RESOURCE_NOT_FOUND


def test_discount_response_serializes_decimal_strings_and_aliases() -> None:
    response = DiscountSimulationResponse(
        base_selling_price=Decimal("60000.0000"),
        discount_percent=Decimal("10.0000"),
        discount_amount=Decimal("6000.0000"),
        net_selling_price=Decimal("54000.0000"),
        full_hpp=Decimal("50000.0000"),
        net_profit=Decimal("4000.0000"),
        net_margin_percent=Decimal("7.4074"),
        is_loss=False,
    )
    dumped = response.model_dump(mode="json", by_alias=True)
    assert dumped["netSellingPrice"] == "54000.0000"
    assert dumped["netMarginPercent"] == "7.4074"
    assert dumped["isLoss"] is False


def test_discount_openapi_path_and_request_aliases_exist() -> None:
    openapi = create_app(
        Settings(
            database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
            secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        )
    ).openapi()
    assert "/api/v1/product-variants/{variant_id}/pricing/discount-simulations" in openapi["paths"]
    schema = openapi["components"]["schemas"]["DiscountSimulationRequest"]
    assert {"discountPercent", "baseSellingPrice"} <= set(schema["properties"])
