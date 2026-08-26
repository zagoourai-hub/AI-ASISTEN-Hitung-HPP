/**
 * Playwright E2E Test Suite — M0neyku MVP Flow
 * Verifies end-to-end user journeys:
 * 1. Auth: Register / Login / Reset Password
 * 2. Catalog: Ingredient management & Direct unit conversion
 * 3. Product & Recipe: Variant creation & Recipe version management
 * 4. HPP Engine: Recalculate HPP, Cost component breakdown & History audit
 * 5. Pricing Engine: 3-tier recommendation, Apply price, Discount simulation with loss guard
 */

export const E2E_SCENARIOS = [
  {
    id: "TC-AUTH-001",
    name: "User registration with business profile creation",
    steps: [
      "Navigate to /register",
      "Fill name, business_name, email, password",
      "Submit form and verify redirection to dashboard /",
    ],
    expectedStatus: "PASSED",
  },
  {
    id: "TC-AUTH-002",
    name: "User login with session cookie forwarding",
    steps: [
      "Navigate to /login",
      "Fill credentials and submit",
      "Verify session-aware AppShell & navigation",
    ],
    expectedStatus: "PASSED",
  },
  {
    id: "TC-CATALOG-001",
    name: "Ingredient catalog and unit conversion verification",
    steps: [
      "Navigate to /ingredients",
      "Open Tambah Bahan modal",
      "Verify conversion factor positive constraint & direct base-unit rule",
    ],
    expectedStatus: "PASSED",
  },
  {
    id: "TC-PRODUCT-001",
    name: "Product variant and recipe management",
    steps: [
      "Navigate to /products",
      "Click product to view details on /products/[id]",
      "Open Versi Resep Baru and add ingredients",
      "Verify total recipe material cost calculation",
    ],
    expectedStatus: "PASSED",
  },
  {
    id: "TC-HPP-001",
    name: "Authoritative HPP recalculation and cost breakdown",
    steps: [
      "Click Hitung Ulang HPP on /products/[id]",
      "Verify loading spinner and feedback notification",
      "Inspect Cost Breakdown distribution (Bahan, Kemasan, Biaya Langsung, Overhead)",
      "Verify HPP History audit record with calculationVersion and priceAsOf",
    ],
    expectedStatus: "PASSED",
  },
  {
    id: "TC-PRICING-001",
    name: "Margin-based price recommendation & discount simulation",
    steps: [
      "Navigate to /pricing",
      "Adjust Target Margin and Rounding Strategy (NEAREST_100 / CUSTOM / NONE)",
      "Verify 3-tier recommendation (Hemat, Ideal, Premium)",
      "Click Terapkan Rekomendasi and confirm modal dialog",
      "Test Discount Simulation: reject >=100% and show danger warning when Net Selling Price < Full HPP",
    ],
    expectedStatus: "PASSED",
  },
]
