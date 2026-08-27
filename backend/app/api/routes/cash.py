from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    CurrentAuthDependency,
    CurrentBusinessDependency,
    PaginationDependency,
)
from app.core.database import get_db_session
from app.core.request_context import get_request_id
from app.schemas.cash import (
    CashBalanceResponse,
    CashBalanceUpdateRequest,
    CashSummaryResponse,
    CashTransactionCreateRequest,
    CashTransactionPageResponse,
    CashTransactionResponse,
    CashTransactionUpdateRequest,
)
from app.schemas.pagination import PageMeta
from app.services.cash import CashService
from app.utils.types import CashTransactionType

router = APIRouter(tags=["cash"])


@router.get("/cash-balance", response_model=CashBalanceResponse)
async def get_cash_balance(
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CashBalanceResponse:
    balance = await CashService(session).get_balance(business_id=business.id)
    return CashBalanceResponse.model_validate(balance)


@router.patch("/cash-balance", response_model=CashBalanceResponse)
async def update_cash_balance(
    payload: CashBalanceUpdateRequest,
    request: Request,
    current_auth: CurrentAuthDependency,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CashBalanceResponse:
    balance = await CashService(session).update_balance(
        business_id=business.id,
        payload=payload,
        actor_id=current_auth.user.id,
        request_id=get_request_id(request),
    )
    return CashBalanceResponse.model_validate(balance)


@router.get("/cash-transactions", response_model=CashTransactionPageResponse)
async def list_cash_transactions(
    business: CurrentBusinessDependency,
    pagination: PaginationDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    transaction_type: Annotated[CashTransactionType | None, Query(alias="type")] = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> CashTransactionPageResponse:
    items, total = await CashService(session).list_transactions(
        business_id=business.id,
        page=pagination.page,
        page_size=pagination.page_size,
        transaction_type=transaction_type,
        date_from=date_from,
        date_to=date_to,
    )
    return CashTransactionPageResponse(
        data=[CashTransactionResponse.model_validate(item) for item in items],
        meta=PageMeta(page=pagination.page, pageSize=pagination.page_size, total=total),
    )


@router.post(
    "/cash-transactions",
    response_model=CashTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_cash_transaction(
    payload: CashTransactionCreateRequest,
    request: Request,
    current_auth: CurrentAuthDependency,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CashTransactionResponse:
    transaction = await CashService(session).create_transaction(
        business_id=business.id,
        payload=payload,
        actor_id=current_auth.user.id,
        request_id=get_request_id(request),
    )
    return CashTransactionResponse.model_validate(transaction)


@router.get("/cash-transactions/summary", response_model=CashSummaryResponse)
async def get_cash_summary(
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    date_from: date | None = None,
    date_to: date | None = None,
) -> CashSummaryResponse:
    summary = await CashService(session).summary(
        business_id=business.id,
        date_from=date_from,
        date_to=date_to,
    )
    return CashSummaryResponse.model_validate(summary)


@router.patch("/cash-transactions/{transaction_id}", response_model=CashTransactionResponse)
async def update_cash_transaction(
    transaction_id: UUID,
    payload: CashTransactionUpdateRequest,
    request: Request,
    current_auth: CurrentAuthDependency,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CashTransactionResponse:
    transaction = await CashService(session).update_transaction(
        business_id=business.id,
        transaction_id=transaction_id,
        payload=payload,
        actor_id=current_auth.user.id,
        request_id=get_request_id(request),
    )
    return CashTransactionResponse.model_validate(transaction)


@router.delete("/cash-transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cash_transaction(
    transaction_id: UUID,
    request: Request,
    current_auth: CurrentAuthDependency,
    business: CurrentBusinessDependency,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    await CashService(session).delete_transaction(
        business_id=business.id,
        transaction_id=transaction_id,
        actor_id=current_auth.user.id,
        request_id=get_request_id(request),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
