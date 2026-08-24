from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.pagination import PageResponse
from app.utils.types import RecipeStatus


class RecipeItemInput(BaseModel):
    ingredient_id: UUID
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=32)

    @field_validator("unit")
    @classmethod
    def normalize_unit(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("unit must not be blank")
        return normalized


def empty_recipe_items() -> list[RecipeItemInput]:
    return []


class RecipeCreateRequest(BaseModel):
    change_reason: str | None = Field(default=None, max_length=500)
    items: list[RecipeItemInput] = Field(default_factory=empty_recipe_items, max_length=200)

    @field_validator("change_reason")
    @classmethod
    def normalize_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("change_reason must not be blank")
        return normalized

    @model_validator(mode="after")
    def reject_duplicate_ingredients(self) -> "RecipeCreateRequest":
        ingredient_ids = [item.ingredient_id for item in self.items]
        if len(ingredient_ids) != len(set(ingredient_ids)):
            raise ValueError("an ingredient may appear only once per recipe version")
        return self


class RecipeUpdateRequest(BaseModel):
    change_reason: str | None = Field(default=None, max_length=500)
    items: list[RecipeItemInput] | None = Field(default=None, max_length=200)

    @field_validator("change_reason")
    @classmethod
    def normalize_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("change_reason must not be blank")
        return normalized

    @model_validator(mode="after")
    def validate_update(self) -> "RecipeUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one recipe field is required")
        if self.items is not None:
            ingredient_ids = [item.ingredient_id for item in self.items]
            if len(ingredient_ids) != len(set(ingredient_ids)):
                raise ValueError("an ingredient may appear only once per recipe version")
        return self


class RecipeItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_version_id: UUID
    ingredient_id: UUID
    quantity: Decimal
    unit: str


def empty_recipe_item_responses() -> list[RecipeItemResponse]:
    return []


class RecipeVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_variant_id: UUID
    version: int
    status: RecipeStatus
    change_reason: str | None
    activated_at: datetime | None
    created_at: datetime
    items: list[RecipeItemResponse] = Field(default_factory=empty_recipe_item_responses)


RecipeVersionPageResponse = PageResponse[RecipeVersionResponse]
