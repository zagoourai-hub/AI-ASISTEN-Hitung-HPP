from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from enum import StrEnum
from uuid import UUID, uuid4

type Money = Decimal
type EntityId = UUID
type Timestamp = datetime

MONEY_QUANTUM = Decimal("0.0001")


class UserRole(StrEnum):
    OWNER = "OWNER"


class ProductStatus(StrEnum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class RecipeStatus(StrEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class AllocationMethod(StrEnum):
    MANUAL_PER_UNIT = "MANUAL_PER_UNIT"


class RoundingStrategy(StrEnum):
    NONE = "NONE"
    NEAREST_100 = "NEAREST_100"
    CUSTOM = "CUSTOM"


class RecommendationStatus(StrEnum):
    DRAFT = "DRAFT"
    APPLIED = "APPLIED"
    DISMISSED = "DISMISSED"


class CashTransactionType(StrEnum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


def parse_decimal(value: object) -> Decimal:
    if isinstance(value, bool):
        raise TypeError("boolean is not a valid decimal value")
    if not isinstance(value, (str, int, Decimal)):
        raise TypeError("decimal values must be strings, integers, or Decimal instances")

    try:
        parsed = value if isinstance(value, Decimal) else Decimal(value)
    except (InvalidOperation, ValueError) as error:
        raise ValueError("invalid decimal value") from error
    if not parsed.is_finite():
        raise ValueError("decimal value must be finite")
    return parsed


def quantize_money(value: Decimal) -> Decimal:
    return parse_decimal(value).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def decimal_to_string(value: Decimal) -> str:
    return format(parse_decimal(value), "f")


def money_to_string(value: Decimal) -> str:
    return format(quantize_money(value), "f")


def new_id() -> EntityId:
    return uuid4()


def utc_now() -> Timestamp:
    return datetime.now(UTC)


def ensure_utc(value: Timestamp) -> Timestamp:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamp must be timezone-aware")
    return value.astimezone(UTC)
