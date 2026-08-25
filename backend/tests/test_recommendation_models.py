from decimal import Decimal
from pathlib import Path
from typing import cast

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, Enum, ForeignKeyConstraint, Numeric

from app.models import RecommendationDraft
from app.models.base import MONEY_NUMERIC, Base
from app.models.business import MARGIN_NUMERIC
from app.utils.types import RecommendationStatus, RoundingStrategy


def test_recommendation_draft_enforces_margin_rounding_and_status() -> None:
    drafts = Base.metadata.tables[RecommendationDraft.__tablename__]
    checks = {
        constraint.name
        for constraint in drafts.constraints
        if isinstance(constraint, CheckConstraint)
    }
    status = cast(Enum, drafts.c.status.type)
    rounding = cast(Enum, drafts.c.rounding_strategy.type)
    foreign_keys = [
        constraint
        for constraint in drafts.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]

    assert {
        "ck_recommendation_drafts_target_margin_range",
        "ck_recommendation_drafts_current_value_non_negative",
        "ck_recommendation_drafts_proposed_value_non_negative",
        "ck_recommendation_drafts_custom_rounding_policy",
    } <= checks
    assert set(status.enums) == {item.value for item in RecommendationStatus}
    assert set(rounding.enums) == {item.value for item in RoundingStrategy}
    assert next(iter(foreign_keys[0].elements)).ondelete == "RESTRICT"
    money_type = cast(Numeric[Decimal], drafts.c.current_value.type)
    margin_type = cast(Numeric[Decimal], drafts.c.target_margin.type)
    assert money_type.precision == MONEY_NUMERIC.precision
    assert margin_type.precision == MARGIN_NUMERIC.precision
    assert margin_type.scale == MARGIN_NUMERIC.scale


def test_recommendation_migration_is_latest() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    revisions = list(ScriptDirectory.from_config(config).walk_revisions("base", "heads"))

    assert revisions[0].revision == "0012_product_images"
    assert revisions[0].down_revision == "0011_audit_logs"
