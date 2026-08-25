from decimal import Decimal
from pathlib import Path
from typing import cast

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, Enum, ForeignKeyConstraint, Numeric, UniqueConstraint

from app.models import RecipeItem, RecipeVersion
from app.models.base import QUANTITY_NUMERIC, Base
from app.utils.types import RecipeStatus


def test_recipe_version_has_lifecycle_and_unique_number_per_variant() -> None:
    versions = Base.metadata.tables[RecipeVersion.__tablename__]
    checks = {
        constraint.name
        for constraint in versions.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in versions.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    status = cast(Enum, versions.c.status.type)

    assert "ck_recipe_versions_version_positive" in checks
    assert "recipe_version_number" in uniques
    assert set(status.enums) == {
        RecipeStatus.DRAFT.value,
        RecipeStatus.ACTIVE.value,
        RecipeStatus.ARCHIVED.value,
    }
    assert versions.c.activated_at.nullable is True
    assert next(iter(versions.c.product_variant_id.foreign_keys)).ondelete == "CASCADE"


def test_recipe_item_has_positive_quantity_and_unique_ingredient() -> None:
    items = Base.metadata.tables[RecipeItem.__tablename__]
    checks = {
        constraint.name
        for constraint in items.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in items.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    foreign_keys = [
        constraint
        for constraint in items.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]

    assert "ck_recipe_items_quantity_positive" in checks
    assert "recipe_item_ingredient" in uniques
    assert cast(Numeric[Decimal], items.c.quantity.type).scale == QUANTITY_NUMERIC.scale
    assert {
        foreign_key.ondelete for constraint in foreign_keys for foreign_key in constraint.elements
    } == {
        "CASCADE",
        "RESTRICT",
    }


def test_recipe_migration_is_registered_after_product_migration() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    revisions = list(ScriptDirectory.from_config(config).walk_revisions("base", "heads"))

    assert [revision.revision for revision in revisions[:8]] == [
        "0012_product_images",
        "0011_audit_logs",
        "0010_recommendation_drafts",
        "0009_cost_versions",
        "0008_ingredient_archive",
        "0007_overheads",
        "0006_recipes",
        "0005_products",
    ]
