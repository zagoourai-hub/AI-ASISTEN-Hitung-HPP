from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.security import normalize_email
from app.utils.types import UserRole


class RegisterRequest(BaseModel):
    email: Annotated[str, Field(min_length=3, max_length=320)]
    password: Annotated[str, Field(min_length=8, max_length=256)]
    business_name: Annotated[str, Field(min_length=1, max_length=160)]
    business_type: Annotated[str, Field(min_length=1, max_length=100)]
    timezone: Annotated[str, Field(min_length=1, max_length=64)] = "Asia/Jakarta"
    default_target_margin: Annotated[Decimal, Field(ge=0, lt=1)] = Decimal("0.3000")

    @field_validator("email")
    @classmethod
    def normalize_and_validate_email(cls, value: str) -> str:
        return normalize_email(value)


class LoginRequest(BaseModel):
    email: Annotated[str, Field(min_length=3, max_length=320)]
    password: Annotated[str, Field(min_length=1, max_length=256)]

    @field_validator("email")
    @classmethod
    def normalize_and_validate_email(cls, value: str) -> str:
        return normalize_email(value)


class PasswordResetRequest(BaseModel):
    email: Annotated[str, Field(min_length=3, max_length=320)]

    @field_validator("email")
    @classmethod
    def normalize_and_validate_email(cls, value: str) -> str:
        return normalize_email(value)


class PasswordResetConfirmRequest(BaseModel):
    token: Annotated[str, Field(min_length=16, max_length=256)]
    new_password: Annotated[str, Field(min_length=8, max_length=256)]


class PasswordResetResponse(BaseModel):
    message: str


class RegisteredUser(BaseModel):
    id: UUID
    email: str
    role: UserRole


class RegisteredBusiness(BaseModel):
    id: UUID
    name: str
    business_type: str
    currency: Literal["IDR"]
    timezone: str
    default_target_margin: Decimal


class RegisterResponse(BaseModel):
    user: RegisteredUser
    business: RegisteredBusiness
