from decimal import Decimal
from typing import cast

from sqlalchemy import CheckConstraint, ForeignKeyConstraint, Numeric, UniqueConstraint

from app.models import Ingredient, IngredientPriceHistory, IngredientUnitConversion
from app.models.base import MONEY_NUMERIC, QUANTITY_NUMERIC, Base


def test_ingredient_model_has_tenant_scope_and_optional_cost_cache() -> None:
    ingredients = Base.metadata.tables[Ingredient.__tablename__]
    foreign_keys = [
        constraint
        for constraint in ingredients.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]
    checks = {
        constraint.name
        for constraint in ingredients.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert ingredients.c.business_id.index is True
    assert ingredients.c.current_unit_cost.nullable is True
    assert ingredients.c.archived_at.nullable is True
    assert "ck_ingredients_current_unit_cost_positive" in checks
    assert foreign_keys[0].ondelete == "CASCADE"
    cost_type = cast(Numeric[Decimal], Ingredient.__table__.c.current_unit_cost.type)
    assert cost_type.precision == MONEY_NUMERIC.precision
    assert cost_type.scale == MONEY_NUMERIC.scale


def test_price_history_enforces_positive_inputs_and_effective_index() -> None:
    price_history = Base.metadata.tables[IngredientPriceHistory.__tablename__]
    checks = {
        constraint.name
        for constraint in price_history.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert {
        "ck_ingredient_price_history_purchase_price_positive",
        "ck_ingredient_price_history_purchase_quantity_positive",
        "ck_ingredient_price_history_unit_cost_positive",
    } <= checks
    purchase_price_type = cast(Numeric[Decimal], price_history.c.purchase_price.type)
    purchase_quantity_type = cast(Numeric[Decimal], price_history.c.purchase_quantity.type)
    assert purchase_price_type.precision == MONEY_NUMERIC.precision
    assert purchase_quantity_type.scale == QUANTITY_NUMERIC.scale
    assert any(
        index.name == "ix_ingredient_price_history_ingredient_effective"
        for index in price_history.indexes
    )


def test_unit_conversion_is_direct_positive_and_unique_per_route() -> None:
    conversions = Base.metadata.tables[IngredientUnitConversion.__tablename__]
    checks = {
        constraint.name
        for constraint in conversions.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in conversions.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert "ck_ingredient_unit_conversions_conversion_factor_positive" in checks
    assert "ck_ingredient_unit_conversions_conversion_units_distinct" in checks
    assert "ingredient_unit_conversion_route" in uniques
    conversion_type = cast(Numeric[Decimal], conversions.c.conversion_factor.type)
    assert conversion_type.scale == QUANTITY_NUMERIC.scale
