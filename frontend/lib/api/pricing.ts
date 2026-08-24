import { apiClient } from "@/lib/api/client"
import type {
  PriceRecommendationDraft,
  PriceRecommendationRequest,
  DiscountSimulationRequest,
  DiscountSimulationResponse,
  ProductVariant,
  SingleResponse,
  DecimalString,
} from "@/lib/types/api"

/**
 * Generates or drafts price recommendations based on target margin & rounding strategy.
 * Endpoint: POST /api/v1/product-variants/{variantId}/pricing/recommendations
 */
export async function createPriceRecommendation(
  variantId: string,
  payload: PriceRecommendationRequest
): Promise<PriceRecommendationDraft> {
  const response = await apiClient<SingleResponse<PriceRecommendationDraft>>(
    `/product-variants/${encodeURIComponent(variantId)}/pricing/recommendations`,
    {
      method: "POST",
      body: payload,
    }
  )
  return response.data
}

/**
 * Simulates discount scenarios without mutating actual selling price.
 * Endpoint: POST /api/v1/product-variants/{variantId}/pricing/discount-simulations
 */
export async function simulateDiscount(
  variantId: string,
  payload: DiscountSimulationRequest
): Promise<DiscountSimulationResponse> {
  const response = await apiClient<SingleResponse<DiscountSimulationResponse>>(
    `/product-variants/${encodeURIComponent(variantId)}/pricing/discount-simulations`,
    {
      method: "POST",
      body: payload,
    }
  )
  return response.data
}

/**
 * Explicit user action to apply proposed price to variant.
 * Endpoint: PATCH /api/v1/products/{productId}/variants/{variantId} or PATCH /api/v1/product-variants/{variantId}
 */
export async function applyRecommendedPrice(
  productId: string,
  variantId: string,
  sellingPrice: DecimalString
): Promise<ProductVariant> {
  return apiClient<ProductVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    {
      method: "PATCH",
      body: { selling_price: sellingPrice },
    }
  )
}
