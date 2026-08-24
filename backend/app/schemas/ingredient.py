from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.pagination import PageResponse
from app.utils.types import utc_now

UnitName = Annotated[str, Field(min_length=1, max_length=32)]


def normalize_unit(value: str) -> str:
    return value.strip().lower()


class IngredientCreateRequest(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=160)]
    category: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    base_unit: UnitName
    purchase_unit: UnitName | None = None
    conversion_factor: Annotated[Decimal, Field(gt=0)] | None = None
    initial_price: Annotated[Decimal, Field(gt=0)] | None = None

    @field_validator("name", "category")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("base_unit", "purchase_unit")
    @classmethod
    def normalize_units(cls, value: str | None) -> str | None:
        return normalize_unit(value) if value is not None else None

    @model_validator(mode="after")
    def validate_initial_price_inputs(self) -> "IngredientCreateRequest":
        has_price = self.initial_price is not None
        has_purchase_unit = self.purchase_unit is not None
        has_conversion = self.conversion_factor is not None
        if has_price != has_purchase_unit:
            raise ValueError("initial_price and purchase_unit must be provided together")
        if has_price and self.purchase_unit != self.base_unit and not has_conversion:
            raise ValueError("conversion_factor is required for a non-base purchase unit")
        if not has_price and (has_conversion or has_purchase_unit):
            raise ValueError("purchase inputs require initial_price")
        return self


class IngredientUpdateRequest(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=160)] | None = None
    category: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    base_unit: UnitName | None = None

    @field_validator("name", "category")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("base_unit")
    @classmethod
    def normalize_base_unit(cls, value: str | None) -> str | None:
        return normalize_unit(value) if value is not None else None

    @model_validator(mode="after")
    def require_update_field(self) -> "IngredientUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one ingredient field is required")
        return self


class PriceHistoryCreateRequest(BaseModel):
    purchase_price: Annotated[Decimal, Field(gt=0)]
    purchase_quantity: Annotated[Decimal, Field(gt=0)]
    purchase_unit: UnitName
    effective_at: AwareDatetime = Field(default_factory=utc_now)

    @field_validator("purchase_unit")
    @classmethod
    def normalize_purchase_unit(cls, value: str) -> str:
        return normalize_unit(value)


class UnitConversionCreateRequest(BaseModel):
    from_unit: UnitName
    to_unit: UnitName
    conversion_factor: Annotated[Decimal, Field(gt=0)]

    @field_validator("from_unit", "to_unit")
    @classmethod
    def normalize_conversion_units(cls, value: str) -> str:
        return normalize_unit(value)


class UnitConversionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ingredient_id: UUID
    from_unit: str
    to_unit: str
    conversion_factor: Decimal


class PriceHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ingredient_id: UUID
    purchase_price: Decimal
    purchase_quantity: Decimal
    purchase_unit: str
    unit_cost: Decimal
    effective_at: datetime


class IngredientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    name: str
    category: str | None
    base_unit: str
    current_unit_cost: Decimal | None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None


def empty_price_history() -> list[PriceHistoryResponse]:
    return []


def empty_unit_conversions() -> list[UnitConversionResponse]:
    return []


class IngredientDetailResponse(IngredientResponse):
    price_history: list[PriceHistoryResponse] = Field(default_factory=empty_price_history)
    unit_conversions: list[UnitConversionResponse] = Field(default_factory=empty_unit_conversions)


IngredientPageResponse = PageResponse[IngredientResponse]
