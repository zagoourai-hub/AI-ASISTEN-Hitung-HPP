from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.utils.types import (
    AllocationMethod,
    ProductStatus,
    RecipeStatus,
    RecommendationStatus,
    RoundingStrategy,
    UserRole,
    decimal_to_string,
    ensure_utc,
    money_to_string,
    new_id,
    parse_decimal,
    quantize_money,
    utc_now,
)


def test_decimal_helpers_preserve_financial_safety() -> None:
    assert parse_decimal("12.3400") == Decimal("12.3400")
    assert quantize_money(Decimal("1.23456")) == Decimal("1.2346")
    assert decimal_to_string(Decimal("12.3400")) == "12.3400"
    assert money_to_string(Decimal("12.3")) == "12.3000"

    with pytest.raises(TypeError):
        parse_decimal(True)
    with pytest.raises(TypeError):
        parse_decimal(1.2)
    with pytest.raises(ValueError):
        parse_decimal("NaN")


def test_domain_enums_match_prd_contract() -> None:
    assert UserRole.OWNER.value == "OWNER"
    assert set(ProductStatus) == {ProductStatus.ACTIVE, ProductStatus.ARCHIVED}
    assert set(RecipeStatus) == {
        RecipeStatus.DRAFT,
        RecipeStatus.ACTIVE,
        RecipeStatus.ARCHIVED,
    }
    assert AllocationMethod.MANUAL_PER_UNIT.value == "MANUAL_PER_UNIT"
    assert set(RoundingStrategy) == {
        RoundingStrategy.NONE,
        RoundingStrategy.NEAREST_100,
        RoundingStrategy.CUSTOM,
    }
    assert set(RecommendationStatus) == {
        RecommendationStatus.DRAFT,
        RecommendationStatus.APPLIED,
        RecommendationStatus.DISMISSED,
    }


def test_id_and_timestamp_policy() -> None:
    identifier = new_id()
    current = utc_now()
    converted = ensure_utc(datetime.now(UTC) - timedelta(hours=2))

    assert identifier.version == 4
    assert current.tzinfo is UTC
    assert converted.tzinfo is UTC

    with pytest.raises(ValueError):
        ensure_utc(datetime.now())
