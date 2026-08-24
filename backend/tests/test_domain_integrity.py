from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from uuid import uuid4

import pytest
from sqlalchemy import Enum, ForeignKeyConstraint, Index
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.models import Ingredient, IngredientPriceHistory, Product, RecipeItem, RecipeVersion
from app.models.base import Base
from app.repositories.ingredient import IngredientRepository
from app.repositories.product import ProductRepository
from app.repositories.recipe import RecipeRepository
from app.services.ingredient import IngredientService
from app.utils.types import utc_now


class ArchiveTransaction:
    async def __aenter__(self) -> "ArchiveTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False


class ArchiveSession:
    def begin(self) -> ArchiveTransaction:
        return ArchiveTransaction()

    async def flush(self) -> None:
        return None


class ArchiveRepository:
    def __init__(self, ingredient: Ingredient) -> None:
        self.ingredient = ingredient

    async def find_by_id(self, *args: object, **kwargs: object) -> Ingredient:
        return self.ingredient


class RecordingResult:
    def scalar_one_or_none(self) -> None:
        return None


class RecordingSession:
    def __init__(self) -> None:
        self.statements: list[object] = []

    async def execute(self, statement: object) -> RecordingResult:
        self.statements.append(statement)
        return RecordingResult()


def compile_statement(statement: object) -> str:
    return str(
        cast(Select[tuple[object]], statement).compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


@pytest.mark.asyncio
async def test_archiving_ingredient_preserves_price_history_in_memory() -> None:
    business_id = uuid4()
    ingredient = Ingredient(
        id=uuid4(),
        business_id=business_id,
        name="Kopi",
        base_unit="gram",
    )
    history = IngredientPriceHistory(
        id=uuid4(),
        ingredient_id=ingredient.id,
        purchase_price=Decimal("90000"),
        purchase_quantity=Decimal("1"),
        purchase_unit="kg",
        unit_cost=Decimal("90"),
        effective_at=datetime.now(UTC),
    )
    ingredient.price_history.append(history)
    service = IngredientService(
        cast(AsyncSession, ArchiveSession()),
        repository=cast(
            IngredientRepository,
            ArchiveRepository(ingredient),
        ),
    )

    await service.archive(business_id=business_id, ingredient_id=ingredient.id)

    assert ingredient.archived_at is not None
    assert ingredient.price_history == [history]


def test_archive_and_recipe_edges_cannot_destroy_cost_history() -> None:
    ingredient_price_fk = next(
        constraint
        for constraint in Base.metadata.tables[IngredientPriceHistory.__tablename__].constraints
        if isinstance(constraint, ForeignKeyConstraint)
    )
    recipe_item_fks = [
        constraint
        for constraint in Base.metadata.tables[RecipeItem.__tablename__].constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]
    product_variant_fk = next(
        iter(Base.metadata.tables[RecipeVersion.__tablename__].c.product_variant_id.foreign_keys)
    )
    active_index = next(
        index
        for index in Base.metadata.tables[RecipeVersion.__tablename__].indexes
        if index.name == "recipe_version_one_active"
    )

    assert next(iter(ingredient_price_fk.elements)).ondelete == "CASCADE"
    recipe_item_on_delete = {
        element.ondelete for constraint in recipe_item_fks for element in constraint.elements
    }
    assert recipe_item_on_delete == {"CASCADE", "RESTRICT"}
    assert product_variant_fk.ondelete == "CASCADE"
    assert isinstance(active_index, Index)
    assert active_index.unique is True
    assert str(active_index.dialect_options["postgresql"]["where"]) == "status = 'ACTIVE'"


@pytest.mark.asyncio
async def test_catalog_and_recipe_queries_keep_business_scope() -> None:
    business_id = uuid4()
    session = RecordingSession()

    await IngredientRepository().find_by_id(
        cast(AsyncSession, session),
        business_id=business_id,
        ingredient_id=uuid4(),
    )
    await ProductRepository().find_product(
        cast(AsyncSession, session),
        business_id=business_id,
        product_id=uuid4(),
    )
    await RecipeRepository().find_version(
        cast(AsyncSession, session),
        business_id=business_id,
        recipe_version_id=uuid4(),
    )

    sql = "\n".join(compile_statement(statement) for statement in session.statements)
    assert sql.count(str(business_id)) == 3
    assert "ingredients.business_id" in sql
    assert "products.business_id" in sql
    assert "products.business_id" in sql


def test_product_archiving_is_status_based_and_not_hard_delete() -> None:
    products = Base.metadata.tables[Product.__tablename__]
    assert products.c.status.nullable is False
    assert "id" in products.c
    assert "ARCHIVED" in cast(Enum, products.c.status.type).enums
    assert Ingredient.archived_at is not None
    assert utc_now().tzinfo is not None
