from decimal import Decimal
from typing import Annotated

from pydantic import AliasChoices, BaseModel, Field

from app.schemas.cost import SingleResponse


class DiscountSimulationRequest(BaseModel):
    discount_percent: Annotated[
        Decimal,
        Field(
            ge=0,
            lt=100,
            validation_alias=AliasChoices("discountPercent", "discount_percent"),
        ),
    ]
    base_selling_price: Annotated[Decimal, Field(ge=0)] | None = Field(
        default=None,
        validation_alias=AliasChoices("baseSellingPrice", "base_selling_price"),
    )


class DiscountSimulationResponse(BaseModel):
    base_selling_price: Decimal = Field(serialization_alias="baseSellingPrice")
    discount_percent: Decimal = Field(serialization_alias="discountPercent")
    discount_amount: Decimal = Field(serialization_alias="discountAmount")
    net_selling_price: Decimal = Field(serialization_alias="netSellingPrice")
    full_hpp: Decimal = Field(serialization_alias="fullHpp")
    net_profit: Decimal = Field(serialization_alias="netProfit")
    net_margin_percent: Decimal = Field(serialization_alias="netMarginPercent")
    is_loss: bool = Field(serialization_alias="isLoss")


DiscountSimulationSingleResponse = SingleResponse[DiscountSimulationResponse]
