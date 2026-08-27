from decimal import Decimal
from pathlib import Path
from typing import cast

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, Enum, ForeignKeyConstraint, Numeric, UniqueConstraint

from app.models import Product, ProductCategory, ProductVariant
from app.models.base import MONEY_NUMERIC, Base
from app.models.business import MARGIN_NUMERIC
from app.utils.types import ProductStatus


def test_product_category_is_tenant_scoped_with_margin_validation() -> None:
    categories = Base.metadata.tables[ProductCategory.__tablename__]
    checks = {
        constraint.name
        for constraint in categories.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in categories.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert "ck_product_categories_target_margin_range" in checks
    assert "product_category_name" in uniques
    assert categories.c.business_id.index is True
    assert (
        cast(Numeric[Decimal], categories.c.target_margin.type).precision
        == MARGIN_NUMERIC.precision
    )
    assert cast(Numeric[Decimal], categories.c.target_margin.type).scale == MARGIN_NUMERIC.scale
    assert next(iter(categories.c.business_id.foreign_keys)).ondelete == "CASCADE"


def test_product_has_active_status_and_nullable_category() -> None:
    products = Base.metadata.tables[Product.__tablename__]
    foreign_keys = [
        constraint
        for constraint in products.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]
    uniques = {
        constraint.name
        for constraint in products.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    status = cast(Enum, products.c.status.type)

    assert products.c.category_id.nullable is True
    assert products.c.status.default is not None
    assert set(status.enums) == {ProductStatus.ACTIVE.value, ProductStatus.ARCHIVED.value}
    assert "product_business_name" in uniques
    assert {
        foreign_key.ondelete for constraint in foreign_keys for foreign_key in constraint.elements
    } == {
        "CASCADE",
        "SET NULL",
    }
    assert products.c.image_key.nullable is True
    assert products.c.image_media_type.nullable is True
    assert products.c.image_size_bytes.nullable is True
    checks = {
        constraint.name
        for constraint in products.constraints
        if isinstance(constraint, CheckConstraint)
    }
    assert "ck_products_product_image_metadata_consistency" in checks


def test_product_variant_enforces_cost_and_margin_invariants() -> None:
    variants = Base.metadata.tables[ProductVariant.__tablename__]
    checks = {
        constraint.name
        for constraint in variants.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in variants.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert {
        "ck_product_variants_selling_price_non_negative",
        "ck_product_variants_packaging_cost_non_negative",
        "ck_product_variants_direct_cost_non_negative",
        "ck_product_variants_target_margin_override_range",
    } <= checks
    assert "product_variant_product_name" in uniques
    assert variants.c.target_margin_override.nullable is True
    for column_name in ("selling_price", "packaging_cost", "direct_cost"):
        column_type = cast(Numeric[Decimal], variants.c[column_name].type)
        assert column_type.precision == MONEY_NUMERIC.precision
        assert column_type.scale == MONEY_NUMERIC.scale
    assert next(iter(variants.c.product_id.foreign_keys)).ondelete == "CASCADE"


def test_product_migration_is_registered_after_ingredient_migration() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    scripts = ScriptDirectory.from_config(config)

    revisions = list(scripts.walk_revisions("base", "heads"))

    assert [revision.revision for revision in revisions] == [
        "0013_cash_tracking",
        "0012_product_images",
        "0011_audit_logs",
        "0010_recommendation_drafts",
        "0009_cost_versions",
        "0008_ingredient_archive",
        "0007_overheads",
        "0006_recipes",
        "0005_products",
        "0004_ingredients",
        "0003_password_reset",
        "0002_business",
        "0001_auth_session",
    ]
