from typing import cast

import httpx
import pytest
from fastapi import FastAPI, Request
from pydantic import SecretStr, ValidationError

from app.core.client_ip import rate_limit_identity, resolve_client_ip
from app.core.config import ClientIpHeader, Settings
from app.core.exceptions import AppError
from app.core.rate_limit import InMemoryRateLimiter

DATABASE_URL = "postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp"


def make_settings(
    *,
    trusted: list[str] | None = None,
    header: ClientIpHeader = "x-forwarded-for",
    model: str = "openrouter/free",
    allow_paid: bool = False,
) -> Settings:
    return Settings(
        database_url=DATABASE_URL,
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        trusted_proxy_cidrs=trusted or [],
        client_ip_header=header,
        openrouter_model=model,
        openrouter_allow_paid_models=allow_paid,
    )


async def seen_ip(settings: Settings, headers: dict[str, str]) -> str:
    application = FastAPI()

    @application.get("/ip")
    async def ip(request: Request) -> dict[str, str]:  # pyright: ignore[reportUnusedFunction]
        return {"ip": resolve_client_ip(request, settings)}

    transport = httpx.ASGITransport(app=application, client=("10.0.0.5", 1234))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/ip", headers=headers)
    return cast(dict[str, str], response.json())["ip"]


@pytest.mark.asyncio
async def test_headers_are_ignored_without_trusted_proxy() -> None:
    assert await seen_ip(make_settings(), {"x-forwarded-for": "203.0.113.9"}) == "10.0.0.5"


@pytest.mark.asyncio
async def test_untrusted_peer_cannot_spoof_header() -> None:
    settings = make_settings(trusted=["192.168.0.0/16"])
    assert await seen_ip(settings, {"x-forwarded-for": "203.0.113.9"}) == "10.0.0.5"


@pytest.mark.asyncio
async def test_trusted_proxy_forwards_real_client_and_ignores_spoofed_left_entries() -> None:
    settings = make_settings(trusted=["10.0.0.0/8"])
    spoofed = "1.1.1.1, 203.0.113.9, 10.1.2.3"
    assert await seen_ip(settings, {"x-forwarded-for": spoofed}) == "203.0.113.9"


@pytest.mark.asyncio
async def test_cloudflare_header_and_invalid_values_fall_back_to_peer() -> None:
    settings = make_settings(trusted=["10.0.0.0/8"], header="cf-connecting-ip")
    assert await seen_ip(settings, {"cf-connecting-ip": "203.0.113.9"}) == "203.0.113.9"
    assert await seen_ip(settings, {"cf-connecting-ip": "not-an-ip"}) == "10.0.0.5"
    assert await seen_ip(settings, {}) == "10.0.0.5"


def test_ipv6_addresses_share_one_bucket_per_64() -> None:
    first = rate_limit_identity("2001:db8:1:2::1")
    second = rate_limit_identity("2001:db8:1:2:ffff::9")
    assert first == second
    assert rate_limit_identity("203.0.113.9") == "203.0.113.9"


def test_limiter_blocks_after_limit_for_same_key_only() -> None:
    limiter = InMemoryRateLimiter()
    limiter.check(key="a", limit=1, window_seconds=60)
    with pytest.raises(AppError):
        limiter.check(key="a", limit=1, window_seconds=60)
    limiter.check(key="b", limit=1, window_seconds=60)


def test_invalid_proxy_cidr_is_rejected() -> None:
    with pytest.raises(ValidationError, match="trusted proxy CIDR"):
        make_settings(trusted=["not-a-cidr"])


def test_paid_model_requires_explicit_opt_in() -> None:
    assert make_settings(model="vendor/model:free").openrouter_model == "vendor/model:free"
    with pytest.raises(ValidationError, match="free model"):
        make_settings(model="vendor/paid-model")
    assert make_settings(model="vendor/paid-model", allow_paid=True).openrouter_allow_paid_models
