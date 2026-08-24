from uuid import UUID

import httpx
import pytest
from pydantic import SecretStr, ValidationError

from app.api.dependencies import (
    PaginationDependency,
    RequestContextDependency,
    TenantScopeDependency,
)
from app.core.config import Settings
from app.main import create_app
from app.schemas.pagination import PageMeta, PageResponse, PaginationParams


def create_pagination_test_app():
    application = create_app(
        Settings(
            database_url="postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
            secret_key=SecretStr("test-only-secret-key-with-32-characters"),
        )
    )

    async def pagination_route(pagination: PaginationDependency) -> PageResponse[str]:
        return PageResponse(
            data=["example"],
            meta=PageMeta(
                page=pagination.page,
                pageSize=pagination.page_size,
                total=1,
            ),
        )

    async def context_route(context: RequestContextDependency) -> dict[str, str]:
        return {"request_id": str(context.request_id)}

    async def tenant_route(
        context: TenantScopeDependency,
    ) -> dict[str, str | None]:
        return {"business_id": str(context.business_id) if context.business_id else None}

    application.add_api_route("/test/pagination", pagination_route, methods=["GET"])
    application.add_api_route("/test/context", context_route, methods=["GET"])
    application.add_api_route("/test/tenant", tenant_route, methods=["GET"])

    return application


def test_pagination_schema_enforces_mvp_bounds() -> None:
    params = PaginationParams(page=3, page_size=100)

    assert params.offset == 200
    assert PageMeta(page=3, pageSize=100, total=250).model_dump(by_alias=True)["pageSize"] == 100

    with pytest.raises(ValidationError):
        PaginationParams(page_size=101)


@pytest.mark.asyncio
async def test_pagination_dependency_and_context_are_shared() -> None:
    transport = httpx.ASGITransport(app=create_pagination_test_app())

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/test/pagination?page=2&page_size=100")
        context_response = await client.get("/test/context")

    assert response.status_code == 200
    assert response.json()["meta"] == {"page": 2, "pageSize": 100, "total": 1}
    request_id = UUID(context_response.json()["request_id"])
    assert context_response.status_code == 200
    assert context_response.headers["X-Request-ID"] == str(request_id)


@pytest.mark.asyncio
async def test_pagination_bounds_and_tenant_scope_are_enforced() -> None:
    transport = httpx.ASGITransport(app=create_pagination_test_app())

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        too_large = await client.get("/test/pagination?page_size=101")
        no_tenant = await client.get("/test/tenant")

    assert too_large.status_code == 422
    assert too_large.json()["error"]["code"] == "VALIDATION_ERROR"
    assert no_tenant.status_code == 401
    assert no_tenant.json()["error"]["code"] == "UNAUTHENTICATED"
