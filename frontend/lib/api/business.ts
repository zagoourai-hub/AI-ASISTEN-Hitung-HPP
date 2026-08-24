import { apiClient } from "@/lib/api/client"
import type { BusinessProfile, RoundingStrategy, SingleResponse } from "@/lib/types/api"

export interface BusinessUpdatePayload {
  name: string
  default_target_margin: string
  rounding_strategy: RoundingStrategy
  custom_rounding: string | null
}

export function getBusiness(signal?: AbortSignal) {
  return apiClient<SingleResponse<BusinessProfile>>("/business", {
    method: "GET",
    signal,
  })
}

export function updateBusiness(payload: BusinessUpdatePayload) {
  return apiClient<SingleResponse<BusinessProfile>>("/business", {
    method: "PATCH",
    body: payload,
  })
}
