from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    http_exception_handler,
    request_validation_error_handler,
    timeout_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import configure_logging
from app.core.request_context import request_id_middleware

APP_VERSION = "0.1.0"


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings.environment)
    application = FastAPI(
        title=resolved_settings.app_name,
        version=APP_VERSION,
    )
    application.middleware("http")(request_id_middleware)
    application.add_exception_handler(AppError, app_error_handler)
    application.add_exception_handler(RequestValidationError, request_validation_error_handler)
    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(TimeoutError, timeout_exception_handler)
    application.add_exception_handler(Exception, unhandled_exception_handler)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_allowed_origins,
        allow_credentials=resolved_settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )
    application.include_router(api_router, prefix=resolved_settings.api_v1_prefix)
    return application


app = create_app()
