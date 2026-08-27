from datetime import date, datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
    model_validator,
)

from app.schemas.pagination import PageResponse
from app.utils.types import CashTransactionType, money_to_string, utc_now

CashAmount = Annotated[Decimal, Field(gt=0)]
OpeningBalance = Annotated[Decimal, Field(ge=0)]


def strip_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class CashBalanceUpdateRequest(BaseModel):
    opening_balance: OpeningBalance = Field(
        validation_alias=AliasChoices("openingBalance", "opening_balance"),
    )


class CashBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID = Field(serialization_alias="businessId")
    opening_balance: Decimal = Field(serialization_alias="openingBalance")
    updated_at: datetime = Field(serialization_alias="updatedAt")

    @field_serializer("opening_balance", when_used="json")
    def serialize_opening_balance(self, value: Decimal) -> str:
        return money_to_string(value)


class CashTransactionCreateRequest(BaseModel):
    type: CashTransactionType
    amount: CashAmount
    category: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    note: Annotated[str, Field(min_length=1, max_length=500)] | None = None
    transaction_date: date = Field(
        default_factory=lambda: utc_now().date(),
        validation_alias=AliasChoices("transactionDate", "transaction_date"),
    )

    @field_validator("category", "note")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return strip_optional_text(value)


class CashTransactionUpdateRequest(BaseModel):
    type: CashTransactionType | None = None
    amount: CashAmount | None = None
    category: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    note: Annotated[str, Field(min_length=1, max_length=500)] | None = None
    transaction_date: date | None = Field(
        default=None,
        validation_alias=AliasChoices("transactionDate", "transaction_date"),
    )

    @field_validator("category", "note")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return strip_optional_text(value)

    @model_validator(mode="after")
    def require_update_field(self) -> "CashTransactionUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one cash transaction field is required")
        return self


class CashTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID = Field(serialization_alias="businessId")
    type: CashTransactionType
    amount: Decimal
    category: str | None
    note: str | None
    transaction_date: date = Field(serialization_alias="transactionDate")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return money_to_string(value)


class CashSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opening_balance: Decimal = Field(serialization_alias="openingBalance")
    total_income: Decimal = Field(serialization_alias="totalIncome")
    total_expense: Decimal = Field(serialization_alias="totalExpense")
    net_cashflow: Decimal = Field(serialization_alias="netCashflow")
    closing_balance: Decimal = Field(serialization_alias="closingBalance")
    date_from: date = Field(serialization_alias="dateFrom")
    date_to: date = Field(serialization_alias="dateTo")

    @field_serializer(
        "opening_balance",
        "total_income",
        "total_expense",
        "net_cashflow",
        "closing_balance",
        when_used="json",
    )
    def serialize_money(self, value: Decimal) -> str:
        return money_to_string(value)


CashTransactionPageResponse = PageResponse[CashTransactionResponse]
