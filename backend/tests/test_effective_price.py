from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.ingredient import Ingredient, IngredientPriceHistory, IngredientUnitConversion
from app.repositories.ingredient import IngredientRepository
from app.services.effective_price import EffectivePriceResolver


class FakeEffectiveRepository:
    def __init__(self, ingredient: Ingredient) -> None:
        self.ingredient = ingredient
        self.prices: list[IngredientPriceHistory] = []
        self.conversions: dict[tuple[str, str], IngredientUnitConversion] = {}

    async def find_by_id(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        ingredient_id: UUID,
    ) -> Ingredient | None:
        if business_id != self.ingredient.business_id or ingredient_id != self.ingredient.id:
            return None
        return self.ingredient

    async def find_effective_price(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
        price_as_of: datetime,
    ) -> IngredientPriceHistory | None:
        candidates = [
            price
            for price in self.prices
            if price.ingredient_id == ingredient_id and price.effective_at <= price_as_of
        ]
        return max(candidates, key=lambda price: (price.effective_at, price.id), default=None)

    async def find_conversion(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
        from_unit: str,
        to_unit: str,
    ) -> IngredientUnitConversion | None:
        return self.conversions.get((from_unit, to_unit))


def make_resolver() -> tuple[EffectivePriceResolver, FakeEffectiveRepository, UUID, UUID]:
    business_id = uuid4()
    ingredient = Ingredient(
        id=uuid4(),
        business_id=business_id,
        name="Kopi",
        base_unit="gram",
    )
    repository = FakeEffectiveRepository(ingredient)
    resolver = EffectivePriceResolver(
        cast(AsyncSession, object()),
        repository=cast(IngredientRepository, repository),
    )
    return resolver, repository, business_id, ingredient.id


def price(
    ingredient_id: UUID,
    effective_at: datetime,
    unit_cost: str,
) -> IngredientPriceHistory:
    return IngredientPriceHistory(
        id=uuid4(),
        ingredient_id=ingredient_id,
        purchase_price=Decimal("1"),
        purchase_quantity=Decimal("1"),
        purchase_unit="gram",
        unit_cost=Decimal(unit_cost),
        effective_at=effective_at,
    )


@pytest.mark.asyncio
async def test_resolver_uses_latest_price_not_after_price_as_of() -> None:
    resolver, repository, business_id, ingredient_id = make_resolver()
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    repository.prices.extend(
        [
            price(ingredient_id, as_of - timedelta(days=2), "80.0000"),
            price(ingredient_id, as_of - timedelta(hours=1), "90.0000"),
            price(ingredient_id, as_of + timedelta(hours=1), "120.0000"),
        ]
    )

    resolved = await resolver.resolve_price(
        business_id=business_id,
        ingredient_id=ingredient_id,
        price_as_of=as_of,
    )

    assert resolved.unit_cost == Decimal("90.0000")
    assert resolved.effective_at == as_of - timedelta(hours=1)
    assert resolved.price_as_of == as_of


@pytest.mark.asyncio
async def test_resolver_normalizes_direct_and_reverse_units_as_decimal() -> None:
    resolver, repository, business_id, ingredient_id = make_resolver()
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)
    repository.prices.append(price(ingredient_id, as_of, "90.0000"))
    repository.conversions[("kg", "gram")] = IngredientUnitConversion(
        id=uuid4(),
        ingredient_id=ingredient_id,
        from_unit="kg",
        to_unit="gram",
        conversion_factor=Decimal("1000"),
    )

    direct = await resolver.resolve_cost(
        business_id=business_id,
        ingredient_id=ingredient_id,
        quantity=Decimal("2"),
        unit="KG",
        price_as_of=as_of,
    )
    repository.conversions.clear()
    repository.conversions[("gram", "kg")] = IngredientUnitConversion(
        id=uuid4(),
        ingredient_id=ingredient_id,
        from_unit="gram",
        to_unit="kg",
        conversion_factor=Decimal("0.001"),
    )
    reverse = await resolver.resolve_cost(
        business_id=business_id,
        ingredient_id=ingredient_id,
        quantity=Decimal("2"),
        unit="kg",
        price_as_of=as_of,
    )

    assert direct.normalized_quantity == Decimal("2000")
    assert direct.total_cost == Decimal("180000.0000")
    assert reverse.normalized_quantity == Decimal("2000")
    assert isinstance(reverse.total_cost, Decimal)


@pytest.mark.asyncio
async def test_resolver_returns_semantic_errors_for_missing_price_conversion_and_tenant() -> None:
    resolver, repository, business_id, ingredient_id = make_resolver()
    as_of = datetime(2026, 8, 22, 10, tzinfo=UTC)

    with pytest.raises(AppError) as missing_price:
        await resolver.resolve_price(
            business_id=business_id,
            ingredient_id=ingredient_id,
            price_as_of=as_of,
        )
    assert missing_price.value.code == ErrorCode.MISSING_EFFECTIVE_PRICE

    repository.prices.append(price(ingredient_id, as_of, "90.0000"))
    with pytest.raises(AppError) as missing_conversion:
        await resolver.resolve_cost(
            business_id=business_id,
            ingredient_id=ingredient_id,
            quantity=Decimal("1"),
            unit="kg",
            price_as_of=as_of,
        )
    assert missing_conversion.value.code == ErrorCode.INVALID_UNIT_CONVERSION

    with pytest.raises(AppError) as wrong_tenant:
        await resolver.resolve_price(
            business_id=uuid4(),
            ingredient_id=ingredient_id,
            price_as_of=as_of,
        )
    assert wrong_tenant.value.code == ErrorCode.RESOURCE_NOT_FOUND
