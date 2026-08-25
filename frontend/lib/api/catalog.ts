import { apiClient } from "@/lib/api/client"
import { ENV } from "@/lib/env"
import type {
  Ingredient,
  IngredientPriceHistory,
  IngredientUnitConversion,
  PaginatedResponse,
  Product,
  ProductCategory,
  ProductVariant,
  RecipeVersion,
} from "@/lib/types/api"

export interface IngredientCreatePayload {
  name: string
  category?: string | null
  base_unit: string
  purchase_unit?: string
  conversion_factor?: string
  initial_price?: string
}

export function listIngredients(signal?: AbortSignal) {
  return apiClient<PaginatedResponse<Ingredient>>("/ingredients", {
    method: "GET",
    params: { page: 1, page_size: 100 },
    signal,
  })
}

export function createIngredient(payload: IngredientCreatePayload) {
  return apiClient<Ingredient>("/ingredients", { method: "POST", body: payload })
}

export function getIngredient(ingredientId: string, signal?: AbortSignal) {
  return apiClient<Ingredient>(`/ingredients/${encodeURIComponent(ingredientId)}`, {
    method: "GET",
    signal,
  })
}

export function updateIngredient(
  ingredientId: string,
  payload: { name?: string; category?: string | null; base_unit?: string }
) {
  return apiClient<Ingredient>(
    `/ingredients/${encodeURIComponent(ingredientId)}`,
    { method: "PATCH", body: payload }
  )
}

export function deleteIngredientPrice(ingredientId: string, priceHistoryId: string) {
  return apiClient<void>(
    `/ingredients/${encodeURIComponent(ingredientId)}/prices/${encodeURIComponent(priceHistoryId)}`,
    { method: "DELETE" }
  )
}

export function addIngredientPrice(
  ingredientId: string,
  payload: {
    purchase_price: string
    purchase_quantity: string
    purchase_unit: string
  }
) {
  return apiClient<IngredientPriceHistory>(
    `/ingredients/${encodeURIComponent(ingredientId)}/prices`,
    { method: "POST", body: payload }
  )
}

export function addIngredientConversion(
  ingredientId: string,
  payload: { from_unit: string; to_unit: string; conversion_factor: string }
) {
  return apiClient<IngredientUnitConversion>(
    `/ingredients/${encodeURIComponent(ingredientId)}/conversions`,
    { method: "POST", body: payload }
  )
}

export function listProducts(signal?: AbortSignal) {
  return apiClient<PaginatedResponse<Product>>("/products", {
    method: "GET",
    params: { page: 1, page_size: 100 },
    signal,
  })
}

export function getProduct(productId: string, signal?: AbortSignal) {
  return apiClient<Product>(`/products/${encodeURIComponent(productId)}`, {
    method: "GET",
    signal,
  })
}

export function updateProduct(productId: string, payload: { name?: string }) {
  return apiClient<Product>(
    `/products/${encodeURIComponent(productId)}`,
    { method: "PATCH", body: payload }
  )
}

export function archiveProduct(productId: string) {
  return apiClient<void>(
    `/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  )
}

export function listProductCategories(signal?: AbortSignal) {
  return apiClient<PaginatedResponse<ProductCategory>>("/product-categories", {
    method: "GET",
    params: { page: 1, page_size: 100 },
    signal,
  })
}

export interface ProductCreatePayload {
  name: string
  category?: string
  variant: {
    name: string
    selling_price: string
    packaging_cost: string
    direct_cost: string
    target_margin_override?: string | null
  }
}

export function createProduct(payload: ProductCreatePayload) {
  return apiClient<Product>("/products", { method: "POST", body: payload })
}

export function uploadProductImage(productId: string, file: File) {
  return apiClient<Product>(
    `/products/${encodeURIComponent(productId)}/image`,
    {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    }
  )
}

export function deleteProductImage(productId: string) {
  return apiClient<void>(
    `/products/${encodeURIComponent(productId)}/image`,
    { method: "DELETE" }
  )
}

export function getProductImageUrl(imageUrl: string | null) {
  return imageUrl ? new URL(imageUrl, ENV.API_BASE_URL).toString() : null
}

export function updateProductVariant(
  productId: string,
  variantId: string,
  payload: Partial<ProductCreatePayload["variant"]>
) {
  return apiClient<ProductVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    { method: "PATCH", body: payload }
  )
}

export function listRecipes(variantId: string, signal?: AbortSignal) {
  return apiClient<PaginatedResponse<RecipeVersion>>(
    `/product-variants/${encodeURIComponent(variantId)}/recipes`,
    { method: "GET", params: { page: 1, page_size: 100 }, signal }
  )
}

export function createRecipe(
  variantId: string,
  payload: {
    change_reason?: string
    items: Array<{ ingredient_id: string; quantity: string; unit: string }>
  }
) {
  const body = payload.change_reason?.trim()
    ? payload
    : { items: payload.items }
  return apiClient<RecipeVersion>(
    `/product-variants/${encodeURIComponent(variantId)}/recipes`,
    { method: "POST", body }
  )
}

export function activateRecipe(recipeVersionId: string) {
  return apiClient<RecipeVersion>(
    `/recipe-versions/${encodeURIComponent(recipeVersionId)}/activate`,
    { method: "POST" }
  )
}
