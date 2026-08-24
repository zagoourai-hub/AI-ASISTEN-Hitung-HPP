from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKeyConstraint, UniqueConstraint

from app.models import Business, BusinessPricingSetting
from app.models.base import Base
from app.models.business import MARGIN_NUMERIC
from app.utils.types import RoundingStrategy


def test_business_model_enforces_owner_currency_and_margin_policy() -> None:
    businesses = Base.metadata.tables[Business.__tablename__]
    checks = {
        constraint.name
        for constraint in businesses.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in businesses.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert "uq_businesses_owner_id" in uniques
    assert "ck_businesses_currency_idr" in checks
    assert "ck_businesses_target_margin_range" in checks
    assert MARGIN_NUMERIC.precision == 5
    assert MARGIN_NUMERIC.scale == 4
    assert Business.__table__.c.default_target_margin.default.arg == Decimal("0.3000")


def test_pricing_setting_is_one_to_one_and_rounding_is_explicit() -> None:
    settings = Base.metadata.tables[BusinessPricingSetting.__tablename__]
    foreign_keys = [
        constraint
        for constraint in settings.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]
    checks = {
        constraint.name
        for constraint in settings.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert "uq_business_pricing_settings_business_id" in {
        constraint.name
        for constraint in settings.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    assert "ck_business_pricing_settings_custom_rounding_policy" in checks
    assert foreign_keys[0].ondelete == "CASCADE"
    assert (
        BusinessPricingSetting.__table__.c.rounding_strategy.default.arg
        == RoundingStrategy.NEAREST_100
    )
