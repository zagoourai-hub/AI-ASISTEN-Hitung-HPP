from __future__ import annotations

from collections.abc import Mapping
from enum import StrEnum
from typing import Final
from uuid import UUID

import structlog
from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.core.request_context import get_request_id

logger = structlog.get_logger(__name__)


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHENTICATED = "UNAUTHENTICATED"
    FORBIDDEN = "FORBIDDEN"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    MISSING_EFFECTIVE_PRICE = "MISSING_EFFECTIVE_PRICE"
    INVALID_UNIT_CONVERSION = "INVALID_UNIT_CONVERSION"
    INVALID_RECIPE_STATE = "INVALID_RECIPE_STATE"
    INVALID_MARGIN = "INVALID_MARGIN"
    CALCULATION_CONFLICT = "CALCULATION_CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED"
    AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ApiError(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: ErrorCode
    message: str
    details: dict[str, object] = Field(default_factory=dict)
    request_id: UUID = Field(alias="requestId")


class ErrorResponse(BaseModel):
    error: ApiError


class AppError(Exception):
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        *,
        status_code: int = 400,
        details: Mapping[str, object] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = dict(details or {})


_STATUS_CODE_MAP: Final[dict[int, ErrorCode]] = {
    400: ErrorCode.VALIDATION_ERROR,
    401: ErrorCode.UNAUTHENTICATED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.RESOURCE_NOT_FOUND,
    409: ErrorCode.DUPLICATE_RESOURCE,
    422: ErrorCode.VALIDATION_ERROR,
    429: ErrorCode.RATE_LIMITED,
}


def _error_response(
    request: Request,
    *,
    status_code: int,
    code: ErrorCode,
    message: str,
    details: Mapping[str, object] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ApiError(
            code=code,
            message=message,
            details=dict(details or {}),
            requestId=get_request_id(request),
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json", by_alias=True),
    )


def _validation_details(exc: RequestValidationError) -> dict[str, object]:
    errors: list[dict[str, object]] = []
    for error in exc.errors():
        errors.append(
            {
                "loc": [str(part) for part in error.get("loc", ())],
                "type": str(error.get("type", "validation_error")),
                "message": str(error.get("msg", "Invalid value")),
            }
        )
    return {"errors": errors}


async def app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppError):
        return await unhandled_exception_handler(request, exc)
    return _error_response(
        request,
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def request_validation_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        return await unhandled_exception_handler(request, exc)
    return _error_response(
        request,
        status_code=422,
        code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed.",
        details=_validation_details(exc),
    )


def _http_error_message(status_code: int) -> str:
    return {
        400: "Request validation failed.",
        401: "Authentication required.",
        403: "Access denied.",
        404: "Resource not found.",
        409: "Resource conflict.",
        422: "Request validation failed.",
        429: "Too many requests.",
    }.get(status_code, "Request failed.")


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, HTTPException):
        return await unhandled_exception_handler(request, exc)
    status_code = exc.status_code if 400 <= exc.status_code < 500 else 500
    code = _STATUS_CODE_MAP.get(status_code, ErrorCode.INTERNAL_ERROR)
    message = _http_error_message(status_code)
    return _error_response(
        request,
        status_code=status_code,
        code=code,
        message=message,
    )


async def timeout_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.warning(
        "request timed out",
        request_id=str(get_request_id(request)),
        error_type=type(exc).__name__,
    )
    return _error_response(
        request,
        status_code=504,
        code=ErrorCode.INTERNAL_ERROR,
        message="The request timed out.",
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled application error",
        request_id=str(get_request_id(request)),
        error_type=type(exc).__name__,
    )
    return _error_response(
        request,
        status_code=500,
        code=ErrorCode.INTERNAL_ERROR,
        message="An unexpected error occurred.",
    )
