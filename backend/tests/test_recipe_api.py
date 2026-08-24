from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from pydantic import SecretStr, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.models.ingredient import Ingredient, IngredientUnitConversion
from app.models.product import ProductVariant
from app.models.recipe import RecipeItem, RecipeVersion
from app.repositories.recipe import RecipeRepository
from app.schemas.recipe import RecipeCreateRequest, RecipeItemInput, RecipeUpdateRequest
from app.services.recipe import RecipeService
from app.utils.types import RecipeStatus


class FakeTransaction:
    async def __aenter__(self) -> "FakeTransaction":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    def begin(self) -> FakeTransaction:
        return FakeTransaction()

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        return None


class FakeRecipeRepository:
    def __init__(self, business_id: UUID) -> None:
        self.business_id = business_id
        self.variant = ProductVariant(id=uuid4(), product_id=uuid4(), name="Regular")
        self.ingredients: dict[UUID, Ingredient] = {}
        self.versions: dict[UUID, RecipeVersion] = {}
        self.conversions: dict[tuple[UUID, str, str], IngredientUnitConversion] = {}

    async def find_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        if business_id != self.business_id or variant_id != self.variant.id:
            return None
        return self.variant

    async def lock_variant(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        variant_id: UUID,
    ) -> ProductVariant | None:
        return await self.find_variant(
            session,
            business_id=business_id,
            variant_id=variant_id,
        )

    async def next_version(self, session: AsyncSession, *, variant_id: UUID) -> int:
        versions = [
            version.version
            for version in self.versions.values()
            if version.product_variant_id == variant_id
        ]
        return max(versions, default=0) + 1

    async def find_version(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        recipe_version_id: UUID,
        lock: bool = False,
    ) -> RecipeVersion | None:
        if business_id != self.business_id:
            return None
        return self.versions.get(recipe_version_id)

    async def list_active_versions(
        self,
        session: AsyncSession,
        *,
        variant_id: UUID,
        lock: bool = False,
    ) -> list[RecipeVersion]:
        return [
            version
            for version in self.versions.values()
            if version.product_variant_id == variant_id and version.status == RecipeStatus.ACTIVE
        ]

    async def find_ingredient(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
        ingredient_id: UUID,
    ) -> Ingredient | None:
        if business_id != self.business_id:
            return None
        return self.ingredients.get(ingredient_id)

    async def find_conversion(
        self,
        session: AsyncSession,
        *,
        ingredient_id: UUID,
        from_unit: str,
        to_unit: str,
    ) -> IngredientUnitConversion | None:
        return self.conversions.get((ingredient_id, from_unit, to_unit))

    def add_version(self, session: AsyncSession, version: RecipeVersion) -> None:
        self.versions[version.id] = version
        session.add(version)

    def add_item(self, session: AsyncSession, item: RecipeItem) -> None:
        session.add(item)


def make_service() -> tuple[RecipeService, FakeRecipeRepository, UUID]:
    business_id = uuid4()
    repository = FakeRecipeRepository(business_id)
    ingredient = Ingredient(
        id=uuid4(),
        business_id=business_id,
        name="Kopi",
        base_unit="gram",
    )
    repository.ingredients[ingredient.id] = ingredient
    service = RecipeService(
        cast(AsyncSession, FakeSession()),
        repository=cast(RecipeRepository, repository),
    )
    return service, repository, business_id


def recipe_payload(repository: FakeRecipeRepository) -> RecipeCreateRequest:
    ingredient_id = next(iter(repository.ingredients))
    return RecipeCreateRequest(
        change_reason="Versi awal",
        items=[RecipeItemInput(ingredient_id=ingredient_id, quantity=Decimal("18"), unit="GRAM")],
    )


@pytest.mark.asyncio
async def test_recipe_create_edit_and_activate_archives_previous_active_version() -> None:
    service, repository, business_id = make_service()
    first = await service.create_version(
        business_id=business_id,
        variant_id=repository.variant.id,
        payload=recipe_payload(repository),
    )
    await service.activate(business_id=business_id, recipe_version_id=first.id)
    second = await service.create_version(
        business_id=business_id,
        variant_id=repository.variant.id,
        payload=recipe_payload(repository),
    )
    await service.update_draft(
        business_id=business_id,
        recipe_version_id=second.id,
        payload=RecipeUpdateRequest(change_reason="Revisi gramasi"),
    )
    activated = await service.activate(business_id=business_id, recipe_version_id=second.id)

    assert first.status == RecipeStatus.ARCHIVED
    assert activated.status == RecipeStatus.ACTIVE
    assert activated.activated_at is not None
    active_versions = [
        version for version in repository.versions.values() if version.status == RecipeStatus.ACTIVE
    ]
    assert active_versions == [second]


@pytest.mark.asyncio
async def test_recipe_activation_rejects_empty_or_invalid_unit_and_cross_tenant_variant() -> None:
    service, repository, business_id = make_service()
    empty = await service.create_version(
        business_id=business_id,
        variant_id=repository.variant.id,
        payload=RecipeCreateRequest(),
    )
    with pytest.raises(AppError) as empty_error:
        await service.activate(business_id=business_id, recipe_version_id=empty.id)
    assert empty_error.value.code == ErrorCode.INVALID_RECIPE_STATE

    ingredient_id = next(iter(repository.ingredients))
    with pytest.raises(AppError) as unit_error:
        await service.create_version(
            business_id=business_id,
            variant_id=repository.variant.id,
            payload=RecipeCreateRequest(
                items=[
                    RecipeItemInput(
                        ingredient_id=ingredient_id,
                        quantity=Decimal("1"),
                        unit="kg",
                    )
                ]
            ),
        )
    assert unit_error.value.code == ErrorCode.INVALID_UNIT_CONVERSION

    with pytest.raises(AppError) as tenant_error:
        await service.create_version(
            business_id=uuid4(),
            variant_id=repository.variant.id,
            payload=recipe_payload(repository),
        )
    assert tenant_error.value.code == ErrorCode.RESOURCE_NOT_FOUND


@pytest.mark.asyncio
async def test_active_recipe_cannot_be_edited_and_duplicate_ingredients_are_rejected() -> None:
    service, repository, business_id = make_service()
    version = await service.create_version(
        business_id=business_id,
        variant_id=repository.variant.id,
        payload=recipe_payload(repository),
    )
    await service.activate(business_id=business_id, recipe_version_id=version.id)

    with pytest.raises(AppError) as edit_error:
        await service.update_draft(
            business_id=business_id,
            recipe_version_id=version.id,
            payload=RecipeUpdateRequest(change_reason="Tidak boleh"),
        )
    assert edit_error.value.code == ErrorCode.INVALID_RECIPE_STATE

    ingredient_id = next(iter(repository.ingredients))
    with pytest.raises(ValidationError):
        RecipeCreateRequest.model_validate(
            {
                "items": [
                    {"ingredient_id": str(ingredient_id), "quantity": "1", "unit": "gram"},
                    {"ingredient_id": str(ingredient_id), "quantity": "2", "unit": "gram"},
                ]
            }
        )


def test_recipe_openapi_contract_and_partial_active_index_are_registered() -> None:
    paths = create_app(
        Settings(
            database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
            secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        )
    ).openapi()["paths"]
    assert "/api/v1/product-variants/{variant_id}/recipes" in paths
    assert "/api/v1/recipe-versions/{recipe_version_id}/activate" in paths
    assert "/api/v1/recipe-versions/{recipe_version_id}" in paths
