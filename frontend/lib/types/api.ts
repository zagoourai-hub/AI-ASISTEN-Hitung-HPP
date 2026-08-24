/**
 * Shared API & Domain Types (Contract alignment with PRD MVP)
 */

export type UserRole = "OWNER"
export type ProductStatus = "ACTIVE" | "ARCHIVED"
export type RecipeStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"
export type AllocationMethod = "MANUAL_PER_UNIT"
export type RoundingStrategy = "NONE" | "NEAREST_100" | "CUSTOM"
export type RecommendationStatus = "DRAFT" | "APPLIED" | "DISMISSED"

export type SemanticErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "DUPLICATE_RESOURCE"
  | "MISSING_EFFECTIVE_PRICE"
  | "INVALID_UNIT_CONVERSION"
  | "INVALID_RECIPE_STATE"
  | "INVALID_MARGIN"
  | "CALCULATION_CONFLICT"
  | "INTERNAL_ERROR"

export interface ApiErrorResponse {
  error: {
    code: SemanticErrorCode | string
    message: string
    details?: Record<string, unknown>
    requestId?: string
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface SingleResponse<T> {
  data: T
}

/** Money values are represented as string decimals at the API boundary */
export type DecimalString = string

// --- HPP & Cost Models ---

export interface ProductCostVersion {
  id: string
  productVariantId: string
  recipeVersionId: string
  ingredientCost: DecimalString
  packagingCost: DecimalString
  directCost: DecimalString
  overheadCost: DecimalString
  fullHpp: DecimalString
  calculationVersion: string
  priceAsOf: string
  calculatedAt: string
}

export interface HppCalculationRequest {
  priceAsOf?: string
}

// --- Pricing & Simulation Models ---

export interface PriceRecommendationScenario {
  name: "Hemat" | "Ideal" | "Premium"
  targetMargin: DecimalString // e.g. "0.55"
  proposedPrice: DecimalString // e.g. "16000.0000"
  marginPercent: DecimalString // e.g. "56.0"
  profitPerUnit: DecimalString // e.g. "3620.0000"
}

export interface PriceRecommendationDraft {
  id: string
  productVariantId: string
  type: string
  currentValue: DecimalString
  proposedValue: DecimalString
  targetMargin: DecimalString
  roundingStrategy: RoundingStrategy
  customRounding?: number
  scenarios: PriceRecommendationScenario[]
  status: RecommendationStatus
  createdAt: string
}

export interface PriceRecommendationRequest {
  targetMargin: DecimalString
  roundingStrategy: RoundingStrategy
  customRounding?: number
}

export interface DiscountSimulationRequest {
  discountPercent: number
  baseSellingPrice?: DecimalString
}

export interface DiscountSimulationResponse {
  baseSellingPrice: DecimalString
  discountPercent: DecimalString
  discountAmount: DecimalString
  netSellingPrice: DecimalString
  fullHpp: DecimalString
  netProfit: DecimalString
  netMarginPercent: DecimalString
  isLoss: boolean
}

// --- Catalog Entities ---

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sellingPrice: DecimalString
  packagingCost: DecimalString
  directCost: DecimalString
  targetMarginOverride?: DecimalString | null
  activeCostVersion?: ProductCostVersion | null
}

export interface Product {
  id: string
  businessId: string
  categoryId: string | null
  name: string
  status: ProductStatus
  createdAt: string
  variants: ProductVariant[]
}
