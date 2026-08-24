"use client"

import React from "react"
import { Sparkles, Leaf, Crown } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { formatIDR, formatPercent } from "@/lib/format"

interface ScenarioComparisonTableProps {
  fullHpp: number
  currentTargetMargin: number
  roundingStrategyName?: string
}

export function ScenarioComparisonTable({
  fullHpp,
  currentTargetMargin,
  roundingStrategyName = "Pembulatan Ratusan Terdekat",
}: ScenarioComparisonTableProps) {
  const idealMargin = Math.max(currentTargetMargin, 10)
  const hematMargin = Math.max(idealMargin - 10, 5)
  const premiumMargin = Math.min(idealMargin + 10, 95)

  const calcTier = (marginPct: number) => {
    const marginFraction = marginPct / 100
    const rawPrice = fullHpp > 0 ? fullHpp / (1 - marginFraction) : 0
    const roundedPrice = Math.ceil(rawPrice / 100) * 100
    const profit = roundedPrice - fullHpp
    const actualMargin = roundedPrice > 0 ? (profit / roundedPrice) * 100 : 0
    return {
      price: roundedPrice,
      margin: actualMargin,
      profit,
    }
  }

  const hemat = calcTier(hematMargin)
  const ideal = calcTier(idealMargin)
  const premium = calcTier(premiumMargin)

  return (
    <Card className="space-y-4">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Perbandingan Skenario Penetapan Harga</CardTitle>
          <span className="text-xs text-[#737B76] dark:text-[#98A09B]">
            Strategi: {roundingStrategyName}
          </span>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
              <th className="pb-3 pl-2 font-medium w-1/4">Parameter</th>
              <th className="pb-3 font-medium text-center">
                <div className="inline-flex items-center gap-1.5 text-[#161A18] dark:text-[#FAFBFA]">
                  <Leaf className="h-3.5 w-3.5 text-[#14804A]" />
                  <span>Hemat</span>
                </div>
              </th>
              <th className="pb-3 font-medium text-center bg-[#EEF9F2]/60 dark:bg-[#10673C18] rounded-t-xl">
                <div className="inline-flex items-center gap-1.5 font-bold text-[#14804A] dark:text-[#1EA65E]">
                  <Sparkles className="h-3.5 w-3.5 text-[#14804A]" />
                  <span>Ideal (Target)</span>
                </div>
              </th>
              <th className="pb-3 font-medium text-center">
                <div className="inline-flex items-center gap-1.5 text-[#161A18] dark:text-[#FAFBFA]">
                  <Crown className="h-3.5 w-3.5 text-[#D97706]" />
                  <span>Premium</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Harga Jual yang Disarankan</td>
              <td className="py-3 text-center tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(hemat.price)}
              </td>
              <td className="py-3 text-center font-bold tabular-nums text-[#14804A] bg-[#EEF9F2]/60 dark:bg-[#10673C18] dark:text-[#1EA65E]">
                {formatIDR(ideal.price)}
              </td>
              <td className="py-3 text-center tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(premium.price)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Full HPP Dasar</td>
              <td className="py-3 text-center tabular-nums text-[#737B76] dark:text-[#98A09B]">
                {formatIDR(fullHpp)}
              </td>
              <td className="py-3 text-center tabular-nums text-[#737B76] bg-[#EEF9F2]/60 dark:bg-[#10673C18] dark:text-[#98A09B]">
                {formatIDR(fullHpp)}
              </td>
              <td className="py-3 text-center tabular-nums text-[#737B76] dark:text-[#98A09B]">
                {formatIDR(fullHpp)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Target Margin Tercapai</td>
              <td className="py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                {formatPercent(hemat.margin, 1)}
              </td>
              <td className="py-3 text-center font-bold tabular-nums text-[#14804A] bg-[#EEF9F2]/60 dark:bg-[#10673C18] dark:text-[#1EA65E]">
                {formatPercent(ideal.margin, 1)}
              </td>
              <td className="py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                {formatPercent(premium.margin, 1)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-3 pl-2 text-[#161A18] dark:text-[#FAFBFA]">Laba Kotor per Unit</td>
              <td className="py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                {formatIDR(hemat.profit)}
              </td>
              <td className="py-3 text-center font-bold tabular-nums text-[#14804A] bg-[#EEF9F2]/60 dark:bg-[#10673C18] dark:text-[#1EA65E]">
                {formatIDR(ideal.profit)}
              </td>
              <td className="py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E]">
                {formatIDR(premium.profit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
