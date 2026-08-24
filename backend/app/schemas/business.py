from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.cost import SingleResponse
from app.utils.types import RoundingStrategy


class BusinessPricingSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    rounding_strategy: RoundingStrategy
    custom_rounding: Decimal | None


class BusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    name: str
    business_type: str
    currency: str
    timezone: str
    default_target_margin: Decimal
    pricing_setting: BusinessPricingSettingResponse | None


class BusinessUpdateRequest(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=160)]
    default_target_margin: Annotated[Decimal, Field(ge=0, lt=1)]
    rounding_strategy: RoundingStrategy
    custom_rounding: Annotated[Decimal, Field(gt=0)] | None = None

    @model_validator(mode="after")
    def validate_rounding(self) -> "BusinessUpdateRequest":
        if self.rounding_strategy is RoundingStrategy.CUSTOM and self.custom_rounding is None:
            raise ValueError("custom_rounding is required for CUSTOM rounding")
        if (
            self.rounding_strategy is not RoundingStrategy.CUSTOM
            and self.custom_rounding is not None
        ):
            raise ValueError("custom_rounding is only valid for CUSTOM rounding")
        return self


BusinessSingleResponse = SingleResponse[BusinessResponse]
