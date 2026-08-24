from uuid import UUID, uuid4

import httpx
import pytest
from fastapi import HTTPException
from pydantic import SecretStr

from app.core.config import Settings
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app


def create_error_test_app():
    application = create_app(
        Settings(
            database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
            secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        )
    )

    async def domain_error() -> None:
        raise AppError(
            ErrorCode.DUPLICATE_RESOURCE,
            "Resource already exists.",
            status_code=409,
            details={"field": "name"},
        )

    async def http_error() -> None:
        raise HTTPException(status_code=404, detail="internal lookup detail")

    async def validation_error(item_id: int) -> dict[str, int]:
        return {"item_id": item_id}

    async def crash() -> None:
        raise RuntimeError("database password must not leak")

    async def timeout() -> None:
        raise TimeoutError("database timeout detail must not leak")

    application.add_api_route("/test/domain-error", domain_error, methods=["GET"])
    application.add_api_route("/test/http-error", http_error, methods=["GET"])
    application.add_api_route("/test/validation/{item_id}", validation_error, methods=["GET"])
    application.add_api_route("/test/crash", crash, methods=["GET"])
    application.add_api_route("/test/timeout", timeout, methods=["GET"])

    return application


@pytest.mark.asyncio
async def test_error_envelope_and_request_id_propagation() -> None:
    request_id = uuid4()
    transport = httpx.ASGITransport(
        app=create_error_test_app(),
        raise_app_exceptions=False,
    )

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(
            "/test/domain-error",
            headers={"X-Request-ID": str(request_id)},
        )

    body = response.json()
    assert response.status_code == 409
    assert response.headers["X-Request-ID"] == str(request_id)
    assert body["error"]["code"] == "DUPLICATE_RESOURCE"
    assert body["error"]["requestId"] == str(request_id)
    assert body["error"]["details"] == {"field": "name"}


@pytest.mark.asyncio
async def test_invalid_request_id_is_replaced_and_validation_is_sanitized() -> None:
    transport = httpx.ASGITransport(app=create_error_test_app())

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(
            "/test/validation/not-an-int",
            headers={"X-Request-ID": "not-a-uuid"},
        )

    body = response.json()
    generated_request_id = UUID(response.headers["X-Request-ID"])
    assert response.status_code == 422
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["requestId"] == str(generated_request_id)
    assert "input" not in str(body["error"]["details"])


@pytest.mark.asyncio
async def test_http_and_unhandled_errors_do_not_leak_internal_details() -> None:
    transport = httpx.ASGITransport(
        app=create_error_test_app(),
        raise_app_exceptions=False,
    )

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        not_found = await client.get("/test/http-error")
        crash = await client.get("/test/crash")

    assert not_found.status_code == 404
    assert not_found.json()["error"]["code"] == "RESOURCE_NOT_FOUND"
    assert "internal lookup detail" not in not_found.text
    assert crash.status_code == 500
    assert crash.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "database password" not in crash.text


@pytest.mark.asyncio
async def test_timeout_is_sanitized_and_returns_gateway_timeout() -> None:
    transport = httpx.ASGITransport(
        app=create_error_test_app(),
        raise_app_exceptions=False,
    )

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/test/timeout")

    assert response.status_code == 504
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "database timeout detail" not in response.text
