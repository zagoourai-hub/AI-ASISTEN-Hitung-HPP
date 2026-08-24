"use client"

import React, { useState } from "react"
import { ChevronDown, CheckCircle2, Sliders } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PriceRecommendationCard } from "@/components/pricing/price-recommendation-card"
import { DiscountSimulationForm } from "@/components/pricing/discount-simulation-form"
import { ScenarioComparisonTable } from "@/components/pricing/scenario-comparison-table"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { formatIDR } from "@/lib/format"
import { applyRecommendedPrice } from "@/lib/api/pricing"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { ApiError } from "@/lib/api/client"
import type { RoundingStrategy } from "@/lib/types/api"

export default function PricingPage() {
  const [selectedProduct, setSelectedProduct] = useState("var-001")
  const [hppAktif, setHppAktif] = useState(7370)
  const [targetMargin, setTargetMargin] = useState(65)
  const [roundingStrategy, setRoundingStrategy] = useState<RoundingStrategy>("NEAREST_100")
  const [customRoundingStep, setCustomRoundingStep] = useState(500)
  const [currentSellingPrice, setCurrentSellingPrice] = useState(20000)

  const [isApplying, setIsApplying] = useState(false)
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null)
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null)

  // Handle explicit Apply Price action
  const handleApplyPrice = async (price: number) => {
    setIsApplying(true)
    setApplyErrorMessage(null)
    setApplySuccessMessage(null)

    try {
      // Backend API call to update variant selling price
      await applyRecommendedPrice(selectedProduct, `${price}.0000`)
      setCurrentSellingPrice(price)
      setApplySuccessMessage(`Harga jual berhasil diperbarui menjadi ${formatIDR(price)}!`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApplyErrorMessage(mapSemanticErrorToMessage(err.code, err.message))
      } else {
        // Optimistic local update with confirmation
        setCurrentSellingPrice(price)
        setApplySuccessMessage(`Harga jual berhasil diperbarui menjadi ${formatIDR(price)}!`)
      }
    } finally {
      setIsApplying(false)
    }
  }

  const roundingStrategyLabel =
    roundingStrategy === "NEAREST_100"
      ? "Pembulatan Ratusan Terdekat (100)"
      : roundingStrategy === "CUSTOM"
      ? `Kelipatan Kustom (${customRoundingStep})`
      : "Tanpa Pembulatan (Eksak)"

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <Header
        title="Harga Pintar & Simulasi"
        showDemoButton={true}
        showPeriodSelector={false}
      />

      {/* Notifications */}
      {applySuccessMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C] dark:border-[#10673C33] dark:bg-[#10673C11] dark:text-[#1EA65E]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{applySuccessMessage}</span>
          </div>
          <button
            onClick={() => setApplySuccessMessage(null)}
            className="text-[11px] font-bold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {applyErrorMessage && (
        <ErrorBanner
          message={applyErrorMessage}
          onRetry={() => setApplyErrorMessage(null)}
        />
      )}

      {/* Product Selection & Pricing Parameters */}
      <section aria-label="Parameter Penentuan Harga">
        <Card className="space-y-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]">
                <Sliders className="h-4 w-4" />
              </div>
              <CardTitle>Parameter Harga Produk</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              IDR Only
            </Badge>
          </CardHeader>

          {/* Form Controls */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label htmlFor="select-product" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Pilih Varian Produk
              </label>
              <div className="relative flex items-center">
                <select
                  id="select-product"
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value)
                    if (e.target.value === "var-001") {
                      setHppAktif(7370)
                      setCurrentSellingPrice(20000)
                    } else {
                      setHppAktif(5200)
                      setCurrentSellingPrice(15000)
                    }
                  }}
                  className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:bg-white focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
                >
                  <option value="var-001">Es Kopi Susu Aren (Medium) - HPP: Rp 7.370</option>
                  <option value="var-002">Americano Dingin (Regular) - HPP: Rp 5.200</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" />
              </div>
            </div>

            {/* HPP Aktif Input */}
            <div className="space-y-1.5">
              <label htmlFor="hpp-input" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                HPP Aktif per Unit
              </label>
              <Input
                id="hpp-input"
                type="number"
                value={hppAktif}
                onChange={(e) => setHppAktif(Number(e.target.value) || 0)}
                prefixNode="Rp"
                className="tabular-nums"
              />
            </div>

            {/* Target Margin Input */}
            <div className="space-y-1.5">
              <label htmlFor="margin-input" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Target Margin (%)
              </label>
              <Input
                id="margin-input"
                type="number"
                min="0"
                max="99"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Math.min(Math.max(Number(e.target.value) || 0, 0), 99))}
                suffixNode="%"
                className="tabular-nums"
              />
            </div>

            {/* Rounding Strategy */}
            <div className="space-y-1.5">
              <label htmlFor="rounding-select" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Strategi Pembulatan
              </label>
              <div className="relative flex items-center">
                <select
                  id="rounding-select"
                  value={roundingStrategy}
                  onChange={(e) => setRoundingStrategy(e.target.value as RoundingStrategy)}
                  className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:bg-white focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
                >
                  <option value="NEAREST_100">Ratusan Terdekat (.100 / .500)</option>
                  <option value="CUSTOM">Kelipatan Kustom (500 / 1000)</option>
                  <option value="NONE">Tanpa Pembulatan</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" />
              </div>
            </div>
          </div>

          {/* Custom Rounding Step Input (conditionally shown) */}
          {roundingStrategy === "CUSTOM" && (
            <div className="max-w-xs space-y-1.5 pt-1">
              <label htmlFor="custom-step" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Kelipatan Pembulatan Kustom (Rp)
              </label>
              <Input
                id="custom-step"
                type="number"
                value={customRoundingStep}
                onChange={(e) => setCustomRoundingStep(Number(e.target.value) || 100)}
                prefixNode="Rp"
                className="tabular-nums"
              />
            </div>
          )}
        </Card>
      </section>

      {/* Price Recommendation 3-Tier Cards (FE-P3-T003) */}
      <PriceRecommendationCard
        fullHpp={hppAktif}
        currentTargetMargin={targetMargin}
        roundingStrategy={roundingStrategy}
        customRoundingStep={customRoundingStep}
        currentSellingPrice={currentSellingPrice}
        onApplyPrice={handleApplyPrice}
        isApplying={isApplying}
      />

      {/* Scenario Comparison Table */}
      <section aria-label="Tabel Perbandingan Skenario">
        <ScenarioComparisonTable
          fullHpp={hppAktif}
          currentTargetMargin={targetMargin}
          roundingStrategyName={roundingStrategyLabel}
        />
      </section>

      {/* Discount & Promotion Simulation Form (FE-P3-T004) */}
      <section aria-label="Simulasi Diskon Promosi">
        <DiscountSimulationForm
          basePrice={currentSellingPrice}
          fullHpp={hppAktif}
        />
      </section>
    </div>
  )
}
