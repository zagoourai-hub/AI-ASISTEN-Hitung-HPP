from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

from app.schemas.cost import SingleResponse
from app.utils.types import RecommendationStatus, RoundingStrategy


class RecommendationRequest(BaseModel):
    target_margin: Annotated[
        Decimal,
        Field(
            ge=0,
            lt=1,
            validation_alias=AliasChoices("targetMargin", "target_margin"),
        ),
    ]
    rounding_strategy: RoundingStrategy = Field(
        validation_alias=AliasChoices("roundingStrategy", "rounding_strategy"),
    )
    custom_rounding: Annotated[Decimal, Field(gt=0)] | None = Field(
        default=None,
        validation_alias=AliasChoices("customRounding", "custom_rounding"),
    )

    @model_validator(mode="after")
    def validate_rounding(self) -> "RecommendationRequest":
        if self.rounding_strategy == RoundingStrategy.CUSTOM and self.custom_rounding is None:
            raise ValueError("custom_rounding is required for CUSTOM strategy")
        if self.rounding_strategy != RoundingStrategy.CUSTOM and self.custom_rounding is not None:
            raise ValueError("custom_rounding is only valid for CUSTOM strategy")
        return self


class RecommendationScenarioResponse(BaseModel):
    name: Literal["Hemat", "Ideal", "Premium"]
    target_margin: Decimal = Field(serialization_alias="targetMargin")
    proposed_price: Decimal = Field(serialization_alias="proposedPrice")
    margin_percent: Decimal = Field(serialization_alias="marginPercent")
    profit_per_unit: Decimal = Field(serialization_alias="profitPerUnit")


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_variant_id: UUID = Field(serialization_alias="productVariantId")
    type: str
    current_value: Decimal = Field(serialization_alias="currentValue")
    proposed_value: Decimal = Field(serialization_alias="proposedValue")
    target_margin: Decimal = Field(serialization_alias="targetMargin")
    rounding_strategy: RoundingStrategy = Field(serialization_alias="roundingStrategy")
    custom_rounding: Decimal | None = Field(serialization_alias="customRounding")
    scenarios: list[RecommendationScenarioResponse]
    status: RecommendationStatus
    created_at: datetime = Field(serialization_alias="createdAt")


RecommendationSingleResponse = SingleResponse[RecommendationResponse]
