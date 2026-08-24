import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.main import create_app


@pytest.mark.asyncio
async def test_health_is_registered_under_api_v1_and_openapi() -> None:
    settings = Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
    )
    transport = httpx.ASGITransport(app=create_app(settings))

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/health")
        openapi = await client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "AI Hitung HPP API",
        "version": "0.1.0",
    }
    assert openapi.status_code == 200
    assert "/api/v1/health" in openapi.json()["paths"]
    assert "/api/v1/business" in openapi.json()["paths"]
    assert "/health" not in openapi.json()["paths"]
