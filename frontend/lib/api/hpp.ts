import { apiClient } from "@/lib/api/client"
import type {
  ProductCostVersion,
  HppCalculationRequest,
  PaginatedResponse,
  SingleResponse,
} from "@/lib/types/api"

/**
 * Triggers authoritative backend HPP calculation for a specific product variant.
 * Endpoint: POST /api/v1/product-variants/{variantId}/hpp/calculations
 */
export async function calculateVariantHpp(
  variantId: string,
  payload?: HppCalculationRequest
): Promise<ProductCostVersion> {
  const response = await apiClient<SingleResponse<ProductCostVersion>>(
    `/product-variants/${encodeURIComponent(variantId)}/hpp/calculations`,
    {
      method: "POST",
      body: payload ?? {},
    }
  )
  return response.data
}

/**
 * Retrieves paginated HPP calculation history for a specific product variant.
 * Endpoint: GET /api/v1/product-variants/{variantId}/hpp/history
 */
export async function getVariantHppHistory(
  variantId: string,
  page: number = 1,
  pageSize: number = 20,
  signal?: AbortSignal
): Promise<PaginatedResponse<ProductCostVersion>> {
  return apiClient<PaginatedResponse<ProductCostVersion>>(
    `/product-variants/${encodeURIComponent(variantId)}/hpp/history`,
    {
      method: "GET",
      params: {
        page,
        page_size: pageSize,
      },
      signal,
    }
  )
}
