from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.overhead import Overhead
from app.models.product import ProductVariant
from app.models.recipe import RecipeItem, RecipeVersion
from app.services.effective_price import EffectivePriceResolver, NormalizedIngredientCost
from app.services.hpp import HPP_CALCULATION_VERSION, HppCalculationService
from app.utils.types import AllocationMethod, RecipeStatus


class FakePriceResolver:
    def __init__(self, costs: dict[UUID, NormalizedIngredientCost]) -> None:
        self.costs = costs
        self.calls: list[tuple[UUID, Decimal, str, datetime]] = []

    async def resolve_cost(
        self,
        *,
        business_id: UUID,
        ingredient_id: UUID,
        quantity: Decimal,
        unit: str,
        price_as_of: datetime,
    ) -> NormalizedIngredientCost:
        self.calls.append((ingredient_id, quantity, unit, price_as_of))
        return self.costs[ingredient_id]


def make_hpp_fixture() -> tuple[
    HppCalculationService,
    ProductVariant,
    RecipeVersion,
    tuple[UUID, Overhead, FakePriceResolver],
]:
    business_id = uuid4()
    variant = ProductVariant(
        id=uuid4(),
        product_id=uuid4(),
        name="Regular",
        selling_price=Decimal("70000"),
        packaging_cost=Decimal("2000"),
        direct_cost=Decimal("3000"),
    )
    ingredient_id = uuid4()
    recipe = RecipeVersion(
        id=uuid4(),
        product_variant_id=variant.id,
        version=1,
        status=RecipeStatus.ACTIVE,
    )
    recipe.items.append(
        RecipeItem(
            id=uuid4(),
            recipe_version_id=recipe.id,
            ingredient_id=ingredient_id,
            quantity=Decimal("20"),
            unit="gram",
        )
    )
    cost = NormalizedIngredientCost(
        ingredient_id=ingredient_id,
        input_quantity=Decimal("20"),
        input_unit="gram",
        normalized_quantity=Decimal("20"),
        base_unit="gram",
        unit_cost=Decimal("2000"),
        total_cost=Decimal("40000"),
        price_history_id=uuid4(),
        price_as_of=datetime(2026, 8, 22, 10, tzinfo=UTC),
    )
    resolver = FakePriceResolver({ingredient_id: cost})
    service = HppCalculationService(
        cast(AsyncSession, object()),
        price_resolver=cast(EffectivePriceResolver, resolver),
    )
    overhead = Overhead(
        id=uuid4(),
        business_id=business_id,
        name="Listrik",
        per_unit_amount=Decimal("5000"),
        allocation_method=AllocationMethod.MANUAL_PER_UNIT,
    )
    return service, variant, recipe, (business_id, overhead, resolver)


@pytest.mark.asyncio
async def test_hpp_golden_formula_uses_decimal_and_final_quantization() -> None:
    service, variant, recipe, context = make_hpp_fixture()
    business_id, overhead, resolver = context
    price_as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)

    result = await service.calculate(
        business_id=business_id,
        variant=variant,
        recipe_version=recipe,
        overheads=[overhead],
        price_as_of=price_as_of,
    )

    assert result.ingredient_cost == Decimal("40000.0000")
    assert result.packaging_cost == Decimal("2000.0000")
    assert result.direct_cost == Decimal("3000.0000")
    assert result.overhead_cost == Decimal("5000.0000")
    assert result.full_hpp == Decimal("50000.0000")
    assert result.calculation_version == HPP_CALCULATION_VERSION
    assert result.price_as_of == price_as_of
    assert len(resolver.calls) == 1


@pytest.mark.asyncio
async def test_hpp_rejects_inactive_recipe_wrong_tenant_overhead_and_invalid_allocation() -> None:
    service, variant, recipe, context = make_hpp_fixture()
    business_id, overhead, _resolver = context
    recipe.status = RecipeStatus.DRAFT
    with pytest.raises(AppError) as state_error:
        await service.calculate(
            business_id=business_id,
            variant=variant,
            recipe_version=recipe,
            overheads=[overhead],
        )
    assert state_error.value.code == ErrorCode.INVALID_RECIPE_STATE

    recipe.status = RecipeStatus.ACTIVE
    overhead.business_id = uuid4()
    with pytest.raises(AppError) as tenant_error:
        await service.calculate(
            business_id=business_id,
            variant=variant,
            recipe_version=recipe,
            overheads=[overhead],
        )
    assert tenant_error.value.code == ErrorCode.RESOURCE_NOT_FOUND

    overhead.business_id = business_id
    overhead.allocation_method = cast(AllocationMethod, "UNSUPPORTED")
    with pytest.raises(AppError) as allocation_error:
        await service.calculate(
            business_id=business_id,
            variant=variant,
            recipe_version=recipe,
            overheads=[overhead],
        )
    assert allocation_error.value.code == ErrorCode.VALIDATION_ERROR


@pytest.mark.asyncio
async def test_hpp_rejects_recipe_variant_mismatch_and_naive_money() -> None:
    service, variant, recipe, context = make_hpp_fixture()
    business_id, overhead, _resolver = context
    recipe.product_variant_id = uuid4()
    with pytest.raises(AppError) as mismatch_error:
        await service.calculate(
            business_id=business_id,
            variant=variant,
            recipe_version=recipe,
            overheads=[overhead],
        )
    assert mismatch_error.value.code == ErrorCode.CALCULATION_CONFLICT

    recipe.product_variant_id = variant.id
    variant.packaging_cost = Decimal("-1")
    with pytest.raises(AppError) as cost_error:
        await service.calculate(
            business_id=business_id,
            variant=variant,
            recipe_version=recipe,
            overheads=[overhead],
        )
    assert cost_error.value.code == ErrorCode.VALIDATION_ERROR
