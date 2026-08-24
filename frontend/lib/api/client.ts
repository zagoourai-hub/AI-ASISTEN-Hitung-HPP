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

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Unified API Client for Next.js App Router (Client & Server Components)
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...customConfig } = options

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${ENV.API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString
    }
  }

  const headers = new Headers(customConfig.headers)
  if (!headers.has("Content-Type") && !(customConfig.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const config: RequestInit = {
    credentials: "include", // Ensure httpOnly cookies are forwarded
    ...customConfig,
    headers,
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    let errorJson: ApiErrorResponse
    try {
      errorJson = await response.json()
    } catch {
      errorJson = {
        error: {
          code: "INTERNAL_ERROR",
          message: `Request failed with status ${response.status}`,
        },
      }
    }
    throw new ApiError(response.status, errorJson.error)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}
