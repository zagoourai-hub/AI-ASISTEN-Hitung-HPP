from collections.abc import AsyncIterator
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import httpx
import pytest
from pydantic import SecretStr, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import current_business_dependency
from app.core.config import Settings
from app.core.database import get_db_session
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.models.business import Business
from app.models.ingredient import Ingredient, IngredientPriceHistory, IngredientUnitConversion
from app.repositories.ingredient import IngredientRepository
from app.schemas.ingredient import (
    IngredientCreateRequest,
    IngredientUpdateRequest,
    PriceHistoryCreateRequest,
)
from app.services.ingredient import IngredientService


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


class FakeResult:
    def scalar_one(self) -> int:
        return 0

    def scalar_one_or_none(self) -> None:
        return None

    def scalars(self) -> "FakeResult":
        return self

    def all(self) -> list[Ingredient]:
        return []


class ListSession(FakeSession):
    async def execute(self, statement: object) -> FakeResult:
        return FakeResult()


class FakeIngredientRepository:
    def __init__(self, ingredient: Ingredient | None = None) -> None:
        self.ingredient = ingredient
        self.conversions: dict[tuple[str, str], IngredientUnitConversion] = {}

    async def find_by_name(self, *args: object, **kwargs: object) -> Ingredient | None:
        return None

    async def find_by_id(self, *args: object, **kwargs: object) -> Ingredient | None:
        return self.ingredient

    async def find_conversion(
        self,
        session: AsyncSession,
        *,
        ingredient_id: object,
        from_unit: str,
        to_unit: str,
    ) -> IngredientUnitConversion | None:
        return self.conversions.get((from_unit, to_unit))

    def add_ingredient(self, session: AsyncSession, ingredient: Ingredient) -> None:
        session.add(ingredient)
        self.ingredient = ingredient

    def add_price_history(
        self,
        session: AsyncSession,
        price_history: IngredientPriceHistory,
    ) -> None:
        session.add(price_history)

    def add_conversion(
        self,
        session: AsyncSession,
        conversion: IngredientUnitConversion,
    ) -> None:
        session.add(conversion)
        self.conversions[(conversion.from_unit, conversion.to_unit)] = conversion


def make_settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )


def make_business() -> Business:
    return Business(
        id=uuid4(),
        owner_id=uuid4(),
        name="Warung Contoh",
        business_type="Kuliner",
    )


def make_ingredient(business_id: UUID) -> Ingredient:
    return Ingredient(
        id=uuid4(),
        business_id=business_id,
        name="Kopi",
        base_unit="gram",
    )


@pytest.mark.asyncio
async def test_create_ingredient_normalizes_initial_price_to_base_unit() -> None:
    session = FakeSession()
    repository = FakeIngredientRepository()
    service = IngredientService(
        cast(AsyncSession, session),
        repository=cast(IngredientRepository, repository),
    )

    ingredient = await service.create(
        business_id=uuid4(),
        payload=IngredientCreateRequest.model_validate(
            {
                "name": "Kopi",
                "category": "Bahan Pokok",
                "base_unit": "GRAM",
                "purchase_unit": "KG",
                "conversion_factor": "1000",
                "initial_price": "90000",
            }
        ),
    )

    price_history = next(item for item in session.added if isinstance(item, IngredientPriceHistory))
    conversion = next(item for item in session.added if isinstance(item, IngredientUnitConversion))
    assert ingredient.base_unit == "gram"
    assert price_history.unit_cost == Decimal("90.0000")
    assert conversion.from_unit == "kg"
    assert conversion.to_unit == "gram"
    assert ingredient.current_unit_cost == Decimal("90.0000")


@pytest.mark.asyncio
async def test_add_price_uses_reverse_direct_conversion() -> None:
    ingredient = make_ingredient(uuid4())
    repository = FakeIngredientRepository(ingredient)
    repository.conversions[("gram", "kg")] = IngredientUnitConversion(
        id=uuid4(),
        ingredient_id=ingredient.id,
        from_unit="gram",
        to_unit="kg",
        conversion_factor=Decimal("0.001"),
    )
    service = IngredientService(
        cast(AsyncSession, FakeSession()),
        repository=cast(IngredientRepository, repository),
    )

    price_history = await service.add_price(
        business_id=uuid4(),
        ingredient_id=ingredient.id,
        payload=PriceHistoryCreateRequest.model_validate(
            {
                "purchase_price": "90000",
                "purchase_quantity": "1",
                "purchase_unit": "KG",
            }
        ),
    )

    assert price_history.unit_cost == Decimal("90.0000")


@pytest.mark.asyncio
async def test_add_price_rejects_missing_direct_conversion() -> None:
    ingredient = make_ingredient(uuid4())
    service = IngredientService(
        cast(AsyncSession, FakeSession()),
        repository=cast(IngredientRepository, FakeIngredientRepository(ingredient)),
    )

    with pytest.raises(AppError) as error:
        await service.add_price(
            business_id=uuid4(),
            ingredient_id=ingredient.id,
            payload=PriceHistoryCreateRequest.model_validate(
                {
                    "purchase_price": "90000",
                    "purchase_quantity": "1",
                    "purchase_unit": "KG",
                }
            ),
        )

    assert error.value.code == ErrorCode.INVALID_UNIT_CONVERSION


def test_ingredient_schemas_validate_frontend_shape_and_update_contract() -> None:
    payload = IngredientCreateRequest.model_validate(
        {
            "name": " Kopi ",
            "base_unit": "GRAM",
            "purchase_unit": "KG",
            "conversion_factor": "1000",
            "initial_price": "90000",
        }
    )
    assert payload.name == "Kopi"
    assert payload.base_unit == "gram"
    assert payload.purchase_unit == "kg"

    with pytest.raises(ValidationError):
        IngredientCreateRequest.model_validate(
            {
                "name": "Kopi",
                "base_unit": "gram",
                "purchase_unit": "kg",
                "initial_price": "90000",
            }
        )
    with pytest.raises(ValidationError):
        IngredientUpdateRequest()


def test_ingredient_routes_are_in_openapi_and_use_v1_prefix() -> None:
    application = create_app(make_settings())
    paths = application.openapi()["paths"]

    assert "/api/v1/ingredients" in paths
    assert "/api/v1/ingredients/{ingredient_id}/prices" in paths
    assert "/api/v1/ingredients/{ingredient_id}/conversions" in paths


@pytest.mark.asyncio
async def test_ingredient_list_route_can_use_tenant_dependency_override() -> None:
    business = make_business()
    application = create_app(make_settings())

    async def fake_db_session() -> AsyncIterator[AsyncSession]:
        yield cast(AsyncSession, ListSession())

    application.dependency_overrides[get_db_session] = fake_db_session
    application.dependency_overrides[current_business_dependency] = lambda: business
    transport = httpx.ASGITransport(app=application)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/ingredients")

    assert response.status_code == 200
    assert response.json() == {
        "data": [],
        "meta": {"page": 1, "pageSize": 20, "total": 0},
    }
