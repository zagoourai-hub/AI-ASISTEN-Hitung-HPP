from __future__ import annotations

import logging
from typing import Final

import structlog

from app.core.config import Environment

_HANDLER_MARKER: Final[str] = "_hpp_structured_handler"


def configure_logging(environment: Environment) -> None:
    root_logger = logging.getLogger()
    if any(getattr(handler, _HANDLER_MARKER, False) for handler in root_logger.handlers):
        return

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
        foreign_pre_chain=[
            *shared_processors,
            structlog.stdlib.ExtraAdder(),
        ],
    )
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    setattr(handler, _HANDLER_MARKER, True)
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.DEBUG if environment == "development" else logging.INFO)
