"use client"

import React, { useState } from "react"
import { Sparkles, Leaf, Crown, Check, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatIDR, formatPercent } from "@/lib/format"
import type { RoundingStrategy, RecommendationStatus } from "@/lib/types/api"

export interface ScenarioDetail {
  id: "hemat" | "ideal" | "premium"
  name: string
  icon: typeof Sparkles
  targetMargin: number // e.g. 0.55
  proposedPrice: number
  profitPerUnit: number
  marginPercent: number
  isHighlighted?: boolean
}

interface PriceRecommendationCardProps {
  fullHpp: number
  currentTargetMargin: number // e.g. 60 (for 60%)
  roundingStrategy: RoundingStrategy
  customRoundingStep?: number
  currentSellingPrice?: number
  onApplyPrice?: (price: number) => Promise<void> | void
  isApplying?: boolean
}

export function PriceRecommendationCard({
  fullHpp,
  currentTargetMargin,
  roundingStrategy,
  customRoundingStep = 500,
  currentSellingPrice = 0,
  onApplyPrice,
  isApplying = false,
}: PriceRecommendationCardProps) {
  const [selectedScenario, setSelectedScenario] = useState<"hemat" | "ideal" | "premium">("ideal")
  const [recommendationStatus, setRecommendationStatus] = useState<RecommendationStatus>("DRAFT")
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Helper to round price based on strategy
  const applyRounding = (rawPrice: number, strategy: RoundingStrategy): number => {
    if (strategy === "NONE") return Math.round(rawPrice)
    if (strategy === "NEAREST_100") return Math.ceil(rawPrice / 100) * 100
    if (strategy === "CUSTOM") {
      const step = customRoundingStep > 0 ? customRoundingStep : 500
      return Math.ceil(rawPrice / step) * step
    }
    return Math.round(rawPrice)
  }

  // Calculate scenarios based on PRD formula: selling_price = full_hpp / (1 - target_margin)
  const calculateScenario = (
    id: "hemat" | "ideal" | "premium",
    name: string,
    icon: typeof Sparkles,
    marginPct: number,
    isHighlighted: boolean = false
  ): ScenarioDetail => {
    const marginFraction = Math.min(Math.max(marginPct / 100, 0), 0.99)
    const rawPrice = fullHpp > 0 ? fullHpp / (1 - marginFraction) : 0
    const roundedPrice = applyRounding(rawPrice, roundingStrategy)
    const profit = roundedPrice - fullHpp
    const actualMarginPct = roundedPrice > 0 ? (profit / roundedPrice) * 100 : 0

    return {
      id,
      name,
      icon,
      targetMargin: marginFraction,
      proposedPrice: roundedPrice,
      profitPerUnit: profit,
      marginPercent: actualMarginPct,
      isHighlighted,
    }
  }

  // Scenario tiers
  const idealMargin = Math.max(currentTargetMargin, 10)
  const hematMargin = Math.max(idealMargin - 10, 5)
  const premiumMargin = Math.min(idealMargin + 10, 95)

  const scenarios: ScenarioDetail[] = [
    calculateScenario("hemat", "Hemat (Kompetitif)", Leaf, hematMargin),
    calculateScenario("ideal", "Ideal (Target Margin)", Sparkles, idealMargin, true),
    calculateScenario("premium", "Premium (High Margin)", Crown, premiumMargin),
  ]

  const activeScenarioData = scenarios.find((s) => s.id === selectedScenario) || scenarios[1]

  const handleConfirmApply = async () => {
    if (onApplyPrice && activeScenarioData) {
      await onApplyPrice(activeScenarioData.proposedPrice)
      setRecommendationStatus("APPLIED")
      setShowConfirmModal(false)
    }
  }

  return (
    <section aria-label="Rekomendasi Harga Pintar" className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Rekomendasi Harga Jual Berbasis Margin
          </h2>
          <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
            Dihitung deterministik: <code className="font-mono text-[11px] text-[#10673C] dark:text-[#1EA65E]">Harga = HPP / (1 - Margin)</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={recommendationStatus === "APPLIED" ? "success" : "outline"}
            className="text-xs"
          >
            Status: {recommendationStatus}
          </Badge>
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const isSelected = selectedScenario === scenario.id
          const Icon = scenario.icon

          return (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`relative flex cursor-pointer flex-col justify-between rounded-[18px] border p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] ${
                isSelected
                  ? "border-2 border-[#14804A] bg-[#FAFCFB] shadow-sm dark:border-[#1EA65E] dark:bg-[#141A16]"
                  : "border-[#E8ECE9] bg-white hover:border-[#D5DAD7] dark:border-[#2B312E] dark:bg-[#161A18] dark:hover:border-[#444B47]"
              }`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault()
                  setSelectedScenario(scenario.id)
                }
              }}
            >
              {/* Highlight Badge */}
              {scenario.isHighlighted && (
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="text-[10px] font-bold bg-[#10673C] text-white">
                    Paling Direkomendasikan
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      scenario.id === "ideal"
                        ? "bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]"
                        : scenario.id === "premium"
                        ? "bg-[#FEF3C7] text-[#D97706] dark:bg-[#78350F33]"
                        : "bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#161A18] dark:text-[#FAFBFA]">
                    {scenario.name}
                  </span>
                </div>

                <div className="mt-4">
                  <p
                    className={`text-2xl font-bold tracking-tight tabular-nums ${
                      isSelected
                        ? "text-[#10673C] dark:text-[#1EA65E]"
                        : "text-[#161A18] dark:text-[#FAFBFA]"
                    }`}
                  >
                    {formatIDR(scenario.proposedPrice)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-xs dark:border-[#2B312E]">
                  <div>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Margin Tercapai</p>
                    <p className="font-bold tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                      {formatPercent(scenario.marginPercent, 1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Laba Kotor per Unit</p>
                    <p className="font-bold tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                      {formatIDR(scenario.profitPerUnit)}
                    </p>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#10673C] dark:text-[#1EA65E]">
                  <Check className="h-3.5 w-3.5" />
                  <span>Skenario Dipilih</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Apply Price Action Bar */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#E8ECE9] bg-[#FAFBFA] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2B312E] dark:bg-[#161A18]">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Skenario Aktif: <span className="text-[#10673C] dark:text-[#1EA65E]">{activeScenarioData.name}</span> ({formatIDR(activeScenarioData.proposedPrice)})
          </p>
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
            {currentSellingPrice > 0 ? (
              <>Harga jual saat ini: <strong className="tabular-nums">{formatIDR(currentSellingPrice)}</strong>. Perubahan harga memerlukan konfirmasi eksplisit.</>
            ) : (
              <>Harga jual belum ditetapkan. Terapkan rekomendasi untuk menetapkan harga produk.</>
            )}
          </p>
        </div>

        <Button
          variant="default"
          size="default"
          onClick={() => setShowConfirmModal(true)}
          disabled={isApplying || recommendationStatus === "APPLIED"}
          className="gap-2 bg-[#10673C] hover:bg-[#0D5230] text-white shrink-0"
        >
          {recommendationStatus === "APPLIED" ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Harga Diterapkan
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Terapkan Rekomendasi
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-price-modal-title"
        >
          <div className="w-full max-w-md rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 id="confirm-price-modal-title" className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
                  Konfirmasi Penerapan Harga Jual
                </h3>
                <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
                  Perubahan harga produk akan langsung berlaku.
                </p>
              </div>
            </div>

            <div className="my-5 space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
              <div className="flex justify-between">
                <span className="text-[#737B76]">Skenario:</span>
                <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">{activeScenarioData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Harga Baru yang Diajukan:</span>
                <span className="font-bold text-[#10673C] tabular-nums text-sm dark:text-[#1EA65E]">
                  {formatIDR(activeScenarioData.proposedPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Target Margin:</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                  {formatPercent(activeScenarioData.marginPercent, 1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Laba Kotor per Unit:</span>
                <span className="font-semibold tabular-nums text-[#168A4E]">
                  {formatIDR(activeScenarioData.profitPerUnit)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isApplying}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmApply}
                disabled={isApplying}
                className="bg-[#10673C] hover:bg-[#0D5230] text-xs text-white"
              >
                {isApplying ? "Menerapkan..." : "Ya, Terapkan Harga Ini"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
