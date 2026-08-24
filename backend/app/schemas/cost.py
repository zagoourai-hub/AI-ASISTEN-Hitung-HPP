from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import AliasChoices, AwareDatetime, BaseModel, ConfigDict, Field

from app.schemas.pagination import PageResponse


class HppCalculationRequest(BaseModel):
    price_as_of: AwareDatetime | None = Field(
        default=None,
        validation_alias=AliasChoices("priceAsOf", "price_as_of"),
    )


class ProductCostVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_variant_id: UUID = Field(serialization_alias="productVariantId")
    recipe_version_id: UUID = Field(serialization_alias="recipeVersionId")
    ingredient_cost: Annotated[Decimal, Field(serialization_alias="ingredientCost")]
    packaging_cost: Annotated[Decimal, Field(serialization_alias="packagingCost")]
    direct_cost: Annotated[Decimal, Field(serialization_alias="directCost")]
    overhead_cost: Annotated[Decimal, Field(serialization_alias="overheadCost")]
    full_hpp: Annotated[Decimal, Field(serialization_alias="fullHpp")]
    calculation_version: str = Field(serialization_alias="calculationVersion")
    price_as_of: datetime = Field(serialization_alias="priceAsOf")
    calculated_at: datetime = Field(serialization_alias="calculatedAt")


class SingleResponse[T](BaseModel):
    data: T


ProductCostVersionPageResponse = PageResponse[ProductCostVersionResponse]
ProductCostVersionSingleResponse = SingleResponse[ProductCostVersionResponse]
