import asyncio
import json
from collections.abc import AsyncIterator
from typing import cast

import httpx
import pytest
from pydantic import SecretStr, ValidationError

from app.core.config import Settings
from app.core.exceptions import AppError, ErrorCode
from app.main import create_app
from app.schemas.ai import AIStreamRequest
from app.services import ai as ai_service
from app.services.ai import OpenRouterService


class FakeResponse:
    def __init__(self, *, status_code: int, lines: list[str]) -> None:
        self.status_code = status_code
        self.lines = lines

    async def __aenter__(self) -> "FakeResponse":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False

    async def aiter_lines(self) -> AsyncIterator[str]:
        for line in self.lines:
            yield line


def provider_line(content: str) -> str:
    return "data: " + json.dumps({"choices": [{"delta": {"content": content}}]})


VALID_ANSWER_TEXT = (
    "HPP Produk terbaru adalah Rp10.000.\n\n- Harga jual: Rp25.000\n- Gunakan data terbaru."
)
TEST_CONTEXT = {
    "products": [{"product": "Produk terbaru", "sellingPrice": "25000.0000"}],
    "hppHistory": [{"product": "Produk terbaru", "fullHpp": "10000.0000"}],
    "ingredients": [],
    "ingredientPriceHistory": [],
}


class FakeAsyncClient:
    response = FakeResponse(
        status_code=200,
        lines=[
            provider_line(VALID_ANSWER_TEXT[:35]),
            provider_line(VALID_ANSWER_TEXT[35:]),
            "data: [DONE]",
        ],
    )
    last_headers: dict[str, str] | None = None
    last_json: object | None = None

    def __init__(self, **_: object) -> None:
        pass

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        return False

    def stream(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str],
        json: object,
    ) -> FakeResponse:
        assert method == "POST"
        assert url.endswith("/chat/completions")
        self.__class__.last_headers = headers
        self.__class__.last_json = json
        return self.__class__.response


class CancelledResponse(FakeResponse):
    def aiter_lines(self) -> AsyncIterator[str]:
        async def cancelled() -> AsyncIterator[str]:
            raise asyncio.CancelledError
            yield ""

        return cancelled()


class DelayedResponse(FakeResponse):
    async def aiter_lines(self) -> AsyncIterator[str]:
        for line in self.lines:
            await asyncio.sleep(0.02)
            yield line


class SilentResponse(FakeResponse):
    async def aiter_lines(self) -> AsyncIterator[str]:
        await asyncio.sleep(1)
        yield ""


def make_settings(*, api_key: str | None = "sk-test") -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
        secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        openrouter_api_key=SecretStr(api_key) if api_key is not None else None,
        openrouter_model="openrouter/free",
        openrouter_max_tokens=800,
    )


def test_ai_prompt_is_trimmed_and_bounded() -> None:
    assert AIStreamRequest(prompt="  Hitung ulang margin  ").prompt == "Hitung ulang margin"

    with pytest.raises(ValidationError):
        AIStreamRequest(prompt="   ")
    with pytest.raises(ValidationError):
        AIStreamRequest(prompt="x" * 2_001)


def test_missing_openrouter_key_is_sanitized() -> None:
    with pytest.raises(AppError) as error:
        OpenRouterService(make_settings(api_key=None)).ensure_configured()

    assert error.value.code == ErrorCode.AI_NOT_CONFIGURED
    assert error.value.status_code == 503
    assert "sk-" not in error.value.message


@pytest.mark.asyncio
async def test_openrouter_stream_forwards_tokens_without_buffering(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)
    service = OpenRouterService(make_settings())

    async def is_disconnected() -> bool:
        return False

    chunks = [
        chunk
        async for chunk in service.stream(
            prompt="Apa penyebab HPP naik?",
            context=TEST_CONTEXT,
            is_disconnected=is_disconnected,
        )
    ]

    assert chunks[0] == ": hpp-ai-stream-open\n\n"
    assert "event: token" in chunks[1]
    assert "event: token" in chunks[2]
    assert all("event: analysis" not in chunk for chunk in chunks)
    assert chunks[-1] == "event: done\ndata: {}\n\n"
    assert FakeAsyncClient.last_headers is not None
    assert FakeAsyncClient.last_headers["Authorization"] == "Bearer sk-test"
    request_json = cast(dict[str, object], FakeAsyncClient.last_json)
    assert request_json["model"] == "openrouter/free"
    assert request_json["stream"] is True
    assert request_json["provider"] == {"require_parameters": True}
    assert request_json["reasoning"] == {"max_tokens": 400, "exclude": True}
    assert "response_format" not in request_json
    messages = cast(list[dict[str, str]], request_json["messages"])
    assert "Return plain text" in messages[0]["content"]
    assert "Pertanyaan terbaru: Apa penyebab HPP naik?" in messages[-1]["content"]
    assert '"product": "Produk terbaru"' in messages[-1]["content"]


@pytest.mark.asyncio
async def test_openrouter_stream_sends_heartbeat_before_slow_provider_chunk(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    FakeAsyncClient.response = DelayedResponse(
        status_code=200,
        lines=[provider_line(VALID_ANSWER_TEXT), "data: [DONE]"],
    )
    monkeypatch.setattr(ai_service, "SSE_HEARTBEAT_SECONDS", 0.005)
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)

    async def is_disconnected() -> bool:
        return False

    chunks = [
        chunk
        async for chunk in OpenRouterService(make_settings()).stream(
            prompt="Tes", context=TEST_CONTEXT, is_disconnected=is_disconnected
        )
    ]

    assert chunks[0] == ": hpp-ai-stream-open\n\n"
    assert ": hpp-ai-stream-keepalive\n\n" in chunks
    assert chunks[-1] == "event: done\ndata: {}\n\n"
    FakeAsyncClient.response = FakeResponse(
        status_code=200,
        lines=[
            provider_line(VALID_ANSWER_TEXT),
            "data: [DONE]",
        ],
    )


@pytest.mark.asyncio
async def test_openrouter_stream_ends_when_provider_stays_idle(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    FakeAsyncClient.response = SilentResponse(status_code=200, lines=[])
    monkeypatch.setattr(ai_service, "SSE_HEARTBEAT_SECONDS", 0.005)
    monkeypatch.setattr(ai_service, "AI_PROVIDER_IDLE_TIMEOUT_SECONDS", 0.012)
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)

    async def is_disconnected() -> bool:
        return False

    chunks = [
        chunk
        async for chunk in OpenRouterService(make_settings()).stream(
            prompt="Tes", context=TEST_CONTEXT, is_disconnected=is_disconnected
        )
    ]

    assert chunks[0] == ": hpp-ai-stream-open\n\n"
    assert '"code": "AI_PROVIDER_ERROR"' in chunks[-1]
    assert "terlalu lama" in chunks[-1]
    FakeAsyncClient.response = FakeResponse(
        status_code=200,
        lines=[
            provider_line(VALID_ANSWER_TEXT),
            "data: [DONE]",
        ],
    )


@pytest.mark.asyncio
async def test_openrouter_rate_limit_is_an_sse_error(monkeypatch: pytest.MonkeyPatch) -> None:
    FakeAsyncClient.response = FakeResponse(status_code=429, lines=[])
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)

    async def is_disconnected() -> bool:
        return False

    chunks = [
        chunk
        async for chunk in OpenRouterService(make_settings()).stream(
            prompt="Tes", context=TEST_CONTEXT, is_disconnected=is_disconnected
        )
    ]

    assert len(chunks) == 2
    assert chunks[0] == ": hpp-ai-stream-open\n\n"
    assert '"code": "RATE_LIMITED"' in chunks[1]
    FakeAsyncClient.response = FakeResponse(
        status_code=200,
        lines=[
            provider_line(VALID_ANSWER_TEXT),
            "data: [DONE]",
        ],
    )


@pytest.mark.asyncio
async def test_openrouter_stream_propagates_cancellation(monkeypatch: pytest.MonkeyPatch) -> None:
    FakeAsyncClient.response = CancelledResponse(status_code=200, lines=[])
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)

    async def is_disconnected() -> bool:
        return False

    with pytest.raises(asyncio.CancelledError):
        _ = [
            chunk
            async for chunk in OpenRouterService(make_settings()).stream(
                prompt="Tes", context=TEST_CONTEXT, is_disconnected=is_disconnected
            )
        ]

    FakeAsyncClient.response = FakeResponse(
        status_code=200,
        lines=[
            provider_line(VALID_ANSWER_TEXT),
            "data: [DONE]",
        ],
    )


@pytest.mark.asyncio
async def test_openrouter_stream_rejects_empty_provider_answer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    FakeAsyncClient.response = FakeResponse(status_code=200, lines=["data: [DONE]"])
    monkeypatch.setattr(ai_service.httpx, "AsyncClient", FakeAsyncClient)

    async def is_disconnected() -> bool:
        return False

    chunks = [
        chunk
        async for chunk in OpenRouterService(make_settings()).stream(
            prompt="Tes", context=TEST_CONTEXT, is_disconnected=is_disconnected
        )
    ]

    assert '"code": "AI_PROVIDER_ERROR"' in chunks[-1]
    assert "tidak mengirim jawaban" in chunks[-1]
    FakeAsyncClient.response = FakeResponse(
        status_code=200,
        lines=[provider_line(VALID_ANSWER_TEXT), "data: [DONE]"],
    )


@pytest.mark.asyncio
async def test_ai_stream_requires_authentication() -> None:
    settings = make_settings(api_key=None)
    transport = httpx.ASGITransport(app=create_app(settings))

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/ai/stream",
            json={"prompt": "Tes"},
        )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
