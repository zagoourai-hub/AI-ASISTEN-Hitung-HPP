"use client"

import { useState } from "react"
import { Check, CheckCircle2, Crown, Leaf, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatIDR, formatPercent } from "@/lib/format"
import type { PriceRecommendationDraft, PriceRecommendationScenario } from "@/lib/types/api"

interface PriceRecommendationCardProps {
  recommendation: PriceRecommendationDraft
  currentSellingPrice: string
  onApplyPrice: (price: string) => Promise<void>
  isApplying?: boolean
}

const scenarioIcons: Record<PriceRecommendationScenario["name"], LucideIcon> = {
  Hemat: Leaf,
  Ideal: Sparkles,
  Premium: Crown,
}

export function PriceRecommendationCard({
  recommendation,
  currentSellingPrice,
  onApplyPrice,
  isApplying = false,
}: PriceRecommendationCardProps) {
  const [selectedScenario, setSelectedScenario] = useState<PriceRecommendationScenario["name"]>("Ideal")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isApplied, setIsApplied] = useState(recommendation.status === "APPLIED")
  const activeScenario =
    recommendation.scenarios.find((scenario) => scenario.name === selectedScenario) ??
    recommendation.scenarios[0]

  if (!activeScenario) return null

  const handleConfirmApply = async () => {
    await onApplyPrice(activeScenario.proposedPrice)
    setIsApplied(true)
    setShowConfirmModal(false)
  }

  return (
    <section aria-label="Rekomendasi Harga Pintar" className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Rekomendasi Harga Jual Berbasis Margin
          </h2>
          <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
            Rekomendasi dihitung dan dibulatkan oleh backend berdasarkan HPP terakhir.
          </p>
        </div>
        <Badge variant={isApplied ? "success" : "outline"} className="text-xs">
          Status: {isApplied ? "APPLIED" : recommendation.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="radiogroup" aria-label="Skenario harga">
        {recommendation.scenarios.map((scenario) => {
          const isSelected = selectedScenario === scenario.name
          const Icon = scenarioIcons[scenario.name]
          return (
            <button
              type="button"
              key={scenario.name}
              onClick={() => setSelectedScenario(scenario.name)}
              role="radio"
              aria-checked={isSelected}
              className={`relative flex cursor-pointer flex-col justify-between rounded-[18px] border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] ${
                isSelected
                  ? "border-2 border-[#14804A] bg-[#FAFCFB] shadow-sm dark:border-[#1EA65E] dark:bg-[#141A16]"
                  : "border-[#E8ECE9] bg-white hover:border-[#D5DAD7] dark:border-[#2B312E] dark:bg-[#161A18] dark:hover:border-[#444B47]"
              }`}
            >
              {scenario.name === "Ideal" && (
                <span className="absolute right-4 top-4">
                  <Badge variant="default" className="bg-[#10673C] text-[10px] font-bold text-white">
                    Paling Direkomendasikan
                  </Badge>
                </span>
              )}
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-[#161A18] dark:text-[#FAFBFA]">{scenario.name}</span>
              </span>
              <span className="mt-4 block text-2xl font-bold tracking-tight text-[#10673C] tabular-nums dark:text-[#1EA65E]">
                {formatIDR(scenario.proposedPrice)}
              </span>
              <span className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-xs dark:border-[#2B312E]">
                <span>
                  <span className="block text-[11px] text-[#737B76] dark:text-[#98A09B]">Margin Tercapai</span>
                  <span className="font-bold tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                    {formatPercent(scenario.marginPercent, 1)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[11px] text-[#737B76] dark:text-[#98A09B]">Laba per Unit</span>
                  <span className="font-bold tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                    {formatIDR(scenario.profitPerUnit)}
                  </span>
                </span>
              </span>
              {isSelected && (
                <span className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#10673C] dark:text-[#1EA65E]">
                  <Check className="h-3.5 w-3.5" /> Skenario Dipilih
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[18px] border border-[#E8ECE9] bg-[#FAFBFA] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2B312E] dark:bg-[#161A18]">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Skenario Aktif: <span className="text-[#10673C] dark:text-[#1EA65E]">{activeScenario.name}</span>{" "}
            ({formatIDR(activeScenario.proposedPrice)})
          </p>
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
            Harga jual saat ini: <strong className="tabular-nums">{formatIDR(currentSellingPrice)}</strong>.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={isApplying || isApplied}
          className="shrink-0 gap-2 bg-[#10673C] text-white hover:bg-[#0D5230]"
        >
          {isApplied ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {isApplied ? "Harga Diterapkan" : "Terapkan Rekomendasi"}
        </Button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="confirm-price-modal-title">
          <div className="w-full max-w-md rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]">
            <h3 id="confirm-price-modal-title" className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
              Konfirmasi Penerapan Harga Jual
            </h3>
            <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">Perubahan harga akan langsung tersimpan ke backend.</p>
            <div className="my-5 space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
              <div className="flex justify-between"><span className="text-[#737B76]">Skenario</span><b>{activeScenario.name}</b></div>
              <div className="flex justify-between"><span className="text-[#737B76]">Harga baru</span><b className="text-[#10673C] tabular-nums dark:text-[#1EA65E]">{formatIDR(activeScenario.proposedPrice)}</b></div>
              <div className="flex justify-between"><span className="text-[#737B76]">Margin</span><b className="tabular-nums">{formatPercent(activeScenario.marginPercent, 1)}</b></div>
              <div className="flex justify-between"><span className="text-[#737B76]">Laba per unit</span><b className="tabular-nums text-[#168A4E]">{formatIDR(activeScenario.profitPerUnit)}</b></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isApplying}>Batal</Button>
              <Button type="button" onClick={handleConfirmApply} disabled={isApplying} className="bg-[#10673C] text-xs text-white hover:bg-[#0D5230]">
                {isApplying ? "Menerapkan..." : "Ya, Terapkan Harga Ini"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
