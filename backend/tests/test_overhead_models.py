from decimal import Decimal
from pathlib import Path
from typing import cast

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, Enum, Numeric, UniqueConstraint

from app.models import Overhead
from app.models.base import MONEY_NUMERIC, Base
from app.utils.types import AllocationMethod


def test_overhead_is_tenant_scoped_and_manual_per_unit() -> None:
    overheads = Base.metadata.tables[Overhead.__tablename__]
    checks = {
        constraint.name
        for constraint in overheads.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in overheads.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    allocation = cast(Enum, overheads.c.allocation_method.type)

    assert "ck_overheads_per_unit_amount_non_negative" in checks
    assert "overhead_business_name" in uniques
    assert set(allocation.enums) == {AllocationMethod.MANUAL_PER_UNIT.value}
    assert overheads.c.per_unit_amount.server_default is not None
    assert (
        cast(Numeric[Decimal], overheads.c.per_unit_amount.type).precision
        == MONEY_NUMERIC.precision
    )
    assert next(iter(overheads.c.business_id.foreign_keys)).ondelete == "CASCADE"


def test_overhead_migration_is_registered_after_recipes() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    revisions = list(ScriptDirectory.from_config(config).walk_revisions("base", "heads"))

    assert [revision.revision for revision in revisions[:8]] == [
        "0013_cash_tracking",
        "0012_product_images",
        "0011_audit_logs",
        "0010_recommendation_drafts",
        "0009_cost_versions",
        "0008_ingredient_archive",
        "0007_overheads",
        "0006_recipes",
    ]
