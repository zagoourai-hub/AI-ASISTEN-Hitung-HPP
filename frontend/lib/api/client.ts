import axios, { type AxiosRequestConfig } from "axios"
import { ENV } from "@/lib/env"
import type { ApiErrorResponse } from "@/lib/types/api"

export class ApiError extends Error {
  code: string
  details?: Record<string, unknown>
  requestId?: string
  status: number

  constructor(status: number, errorData: ApiErrorResponse["error"]) {
    super(errorData.message || "An unexpected error occurred")
    this.name = "ApiError"
    this.status = status
    this.code = errorData.code
    this.details = errorData.details
    this.requestId = errorData.requestId
  }
}

export interface RequestOptions extends Omit<AxiosRequestConfig, "data" | "url"> {
  body?: unknown
}

export const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
})

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, ...config } = options

  try {
    const response = await axiosClient.request<T>({
      url: endpoint,
      ...config,
      data: body,
    })
    return response.data
  } catch (error: unknown) {
    if (!axios.isAxiosError(error)) throw error

    const errorData = error.response?.data as ApiErrorResponse | undefined
    throw new ApiError(
      error.response?.status ?? 0,
      errorData?.error ?? {
        code: "INTERNAL_ERROR",
        message: error.message || "Request failed.",
      }
    )
  }
}
