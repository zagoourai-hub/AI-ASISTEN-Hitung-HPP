from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.pagination import PageResponse
from app.utils.types import ProductStatus

ProductName = Annotated[str, Field(min_length=1, max_length=160)]
MoneyAmount = Annotated[Decimal, Field(ge=0)]
Margin = Annotated[Decimal, Field(ge=0, lt=1)]


def strip_name(value: str) -> str:
    return value.strip()


def empty_variant_inputs() -> list["ProductVariantCreateRequest"]:
    return []


class ProductCategoryCreateRequest(BaseModel):
    name: ProductName
    target_margin: Margin = Decimal("0.3000")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return strip_name(value)


class ProductCategoryUpdateRequest(BaseModel):
    name: ProductName | None = None
    target_margin: Margin | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return strip_name(value) if value is not None else None

    @model_validator(mode="after")
    def require_update_field(self) -> "ProductCategoryUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one category field is required")
        return self


class ProductVariantCreateRequest(BaseModel):
    name: ProductName
    selling_price: MoneyAmount
    packaging_cost: MoneyAmount = Decimal("0.0000")
    direct_cost: MoneyAmount = Decimal("0.0000")
    target_margin_override: Margin | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return strip_name(value)


class ProductVariantUpdateRequest(BaseModel):
    name: ProductName | None = None
    selling_price: MoneyAmount | None = None
    packaging_cost: MoneyAmount | None = None
    direct_cost: MoneyAmount | None = None
    target_margin_override: Margin | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return strip_name(value) if value is not None else None

    @model_validator(mode="after")
    def require_update_field(self) -> "ProductVariantUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one variant field is required")
        return self


class ProductCreateRequest(BaseModel):
    name: ProductName
    category_id: UUID | None = None
    category: ProductName | None = None
    variant: ProductVariantCreateRequest | None = None
    variants: list[ProductVariantCreateRequest] = Field(
        default_factory=empty_variant_inputs,
        max_length=50,
    )

    @field_validator("name", "category")
    @classmethod
    def normalize_names(cls, value: str | None) -> str | None:
        return strip_name(value) if value is not None else None

    @model_validator(mode="after")
    def prevent_duplicate_variant_inputs(self) -> "ProductCreateRequest":
        if self.variant is not None and self.variants:
            raise ValueError("use variant or variants, not both")
        return self


class ProductUpdateRequest(BaseModel):
    name: ProductName | None = None
    category_id: UUID | None = None
    category: ProductName | None = None
    status: ProductStatus | None = None

    @field_validator("name", "category")
    @classmethod
    def normalize_names(cls, value: str | None) -> str | None:
        return strip_name(value) if value is not None else None

    @model_validator(mode="after")
    def require_update_field(self) -> "ProductUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one product field is required")
        if "category_id" in self.model_fields_set and "category" in self.model_fields_set:
            raise ValueError("use category_id or category, not both")
        return self


class ProductCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    name: str
    target_margin: Decimal


class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    name: str
    selling_price: Decimal
    packaging_cost: Decimal
    direct_cost: Decimal
    target_margin_override: Decimal | None


def empty_variants() -> list[ProductVariantResponse]:
    return []


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    category_id: UUID | None
    name: str
    status: ProductStatus
    created_at: datetime
    category: ProductCategoryResponse | None = None
    variants: list[ProductVariantResponse] = Field(default_factory=empty_variants)


ProductPageResponse = PageResponse[ProductResponse]
ProductCategoryPageResponse = PageResponse[ProductCategoryResponse]
