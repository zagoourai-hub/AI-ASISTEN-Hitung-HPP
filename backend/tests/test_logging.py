import logging
from collections.abc import Mapping
from typing import cast
from uuid import uuid4

import httpx
import pytest
from pydantic import SecretStr
from structlog.stdlib import ProcessorFormatter

from app.core.config import Settings
from app.core.logging import configure_logging


class CaptureHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(record)


def test_structured_logging_installs_json_processor_formatter() -> None:
    settings = Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )

    configure_logging(settings.environment)

    handlers = [
        handler
        for handler in logging.getLogger().handlers
        if getattr(handler, "_hpp_structured_handler", False)
    ]
    assert handlers
    assert isinstance(handlers[0].formatter, ProcessorFormatter)


@pytest.mark.asyncio
async def test_request_log_contains_same_request_id_as_response() -> None:
    from app.main import create_app

    settings = Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )
    application = create_app(settings)
    capture = CaptureHandler()
    root_logger = logging.getLogger()
    root_logger.addHandler(capture)
    request_id = uuid4()

    try:
        transport = httpx.ASGITransport(app=application)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get(
                "/api/v1/health",
                headers={"X-Request-ID": str(request_id)},
            )
    finally:
        root_logger.removeHandler(capture)

    assert response.status_code == 200
    request_records: list[logging.LogRecord] = []
    for record in capture.records:
        raw_message = record.__dict__.get("msg")
        if not isinstance(raw_message, Mapping):
            continue
        event = cast(Mapping[str, object], raw_message)
        if event.get("event") == "request completed":
            request_records.append(record)
    assert request_records
    event = cast(Mapping[str, object], request_records[-1].__dict__["msg"])
    assert event["request_id"] == str(request_id)
    assert response.headers["X-Request-ID"] == str(request_id)
