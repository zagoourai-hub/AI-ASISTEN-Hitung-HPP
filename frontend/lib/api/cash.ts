import { apiClient } from "@/lib/api/client"
import type {
  CashBalance,
  CashSummary,
  CashTransaction,
  CashTransactionType,
  PaginatedResponse,
} from "@/lib/types/api"

export interface CashPeriod {
  dateFrom: string
  dateTo: string
}

export function getCashBalance(signal?: AbortSignal) {
  return apiClient<CashBalance>("/cash-balance", { method: "GET", signal })
}

export function updateCashBalance(openingBalance: string) {
  return apiClient<CashBalance>("/cash-balance", {
    method: "PATCH",
    body: { openingBalance },
  })
}

export function getCashSummary(period: CashPeriod, signal?: AbortSignal) {
  return apiClient<CashSummary>("/cash-transactions/summary", {
    method: "GET",
    params: { date_from: period.dateFrom, date_to: period.dateTo },
    signal,
  })
}

export function listCashTransactions(period: CashPeriod, signal?: AbortSignal) {
  return apiClient<PaginatedResponse<CashTransaction>>("/cash-transactions", {
    method: "GET",
    params: {
      page: 1,
      page_size: 100,
      date_from: period.dateFrom,
      date_to: period.dateTo,
    },
    signal,
  })
}

export interface CashTransactionPayload {
  type: CashTransactionType
  amount: string
  category?: string | null
  note?: string | null
  transactionDate: string
}

export function createCashTransaction(payload: CashTransactionPayload) {
  return apiClient<CashTransaction>("/cash-transactions", { method: "POST", body: payload })
}

export function updateCashTransaction(
  transactionId: string,
  payload: Partial<CashTransactionPayload>
) {
  return apiClient<CashTransaction>(`/cash-transactions/${encodeURIComponent(transactionId)}`, {
    method: "PATCH",
    body: payload,
  })
}

export function deleteCashTransaction(transactionId: string) {
  return apiClient<void>(`/cash-transactions/${encodeURIComponent(transactionId)}`, {
    method: "DELETE",
  })
}
