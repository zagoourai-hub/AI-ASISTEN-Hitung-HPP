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
  | "RATE_LIMITED"
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
  product_id: string
  name: string
  selling_price: DecimalString
  packaging_cost: DecimalString
  direct_cost: DecimalString
  target_margin_override?: DecimalString | null
}

export interface ProductCategory {
  id: string
  business_id: string
  name: string
  target_margin: DecimalString
}

export interface Product {
  id: string
  business_id: string
  category_id: string | null
  name: string
  status: ProductStatus
  created_at: string
  category: ProductCategory | null
  variants: ProductVariant[]
}

export interface IngredientPriceHistory {
  id: string
  ingredient_id: string
  purchase_price: DecimalString
  purchase_quantity: DecimalString
  purchase_unit: string
  unit_cost: DecimalString
  effective_at: string
}

export interface IngredientUnitConversion {
  id: string
  ingredient_id: string
  from_unit: string
  to_unit: string
  conversion_factor: DecimalString
}

export interface Ingredient {
  id: string
  business_id: string
  name: string
  category: string | null
  base_unit: string
  current_unit_cost: DecimalString | null
  created_at: string
  updated_at: string
  archived_at: string | null
  price_history?: IngredientPriceHistory[]
  unit_conversions?: IngredientUnitConversion[]
}

export interface RecipeItem {
  id: string
  recipe_version_id: string
  ingredient_id: string
  quantity: DecimalString
  unit: string
}

export interface RecipeVersion {
  id: string
  product_variant_id: string
  version: number
  status: RecipeStatus
  change_reason: string | null
  activated_at: string | null
  created_at: string
  items: RecipeItem[]
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface BusinessPricingSetting {
  id?: string
  business_id?: string
  rounding_strategy: RoundingStrategy
  custom_rounding: DecimalString | null
}

export interface BusinessProfile {
  id: string
  owner_id?: string
  name: string
  business_type: string
  currency: "IDR"
  timezone: string
  default_target_margin: DecimalString
  pricing_setting: BusinessPricingSetting | null
}

export interface AuthSessionResponse {
  user: AuthUser
  business: BusinessProfile
}
