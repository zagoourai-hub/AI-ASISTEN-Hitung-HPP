"use client"

import { Crown, Leaf, Sparkles } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { formatIDR, formatPercent } from "@/lib/format"
import type { PriceRecommendationScenario } from "@/lib/types/api"

interface ScenarioComparisonTableProps {
  fullHpp: string | number
  scenarios: PriceRecommendationScenario[]
  roundingStrategyName: string
}

const iconByName = {
  Hemat: Leaf,
  Ideal: Sparkles,
  Premium: Crown,
} as const

export function ScenarioComparisonTable({
  fullHpp,
  scenarios,
  roundingStrategyName,
}: ScenarioComparisonTableProps) {
  const byName = new Map(scenarios.map((scenario) => [scenario.name, scenario]))
  const rows = ["Hemat", "Ideal", "Premium"] as const

  return (
    <Card className="space-y-4">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Perbandingan Skenario Penetapan Harga</CardTitle>
          <span className="text-xs text-[#737B76] dark:text-[#98A09B]">Strategi: {roundingStrategyName}</span>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
              <th className="w-1/4 pb-3 pl-2 font-medium">Parameter</th>
              {rows.map((name) => {
                const Icon = iconByName[name]
                return (
                  <th key={name} className={`pb-3 text-center font-medium ${name === "Ideal" ? "rounded-t-xl bg-[#EEF9F2]/60 dark:bg-[#10673C18]" : ""}`}>
                    <span className={`inline-flex items-center gap-1.5 ${name === "Ideal" ? "font-bold text-[#14804A] dark:text-[#1EA65E]" : "text-[#161A18] dark:text-[#FAFBFA]"}`}>
                      <Icon className={`h-3.5 w-3.5 ${name === "Premium" ? "text-[#D97706]" : "text-[#14804A]"}`} />{name}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Harga Jual yang Disarankan</td>
              {rows.map((name) => <td key={name} className={`py-3 text-center tabular-nums ${name === "Ideal" ? "bg-[#EEF9F2]/60 font-bold text-[#148A4E] dark:bg-[#10673C18] dark:text-[#1EA65E]" : "text-[#161A18] dark:text-[#FAFBFA]"}`}>{byName.get(name) ? formatIDR(byName.get(name)?.proposedPrice) : "-"}</td>)}
            </tr>
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Full HPP Dasar</td>
              {rows.map((name) => <td key={name} className={`py-3 text-center tabular-nums text-[#737B76] dark:text-[#98A09B] ${name === "Ideal" ? "bg-[#EEF9F2]/60 dark:bg-[#10673C18]" : ""}`}>{formatIDR(fullHpp)}</td>)}
            </tr>
            <tr>
              <td className="py-3 pl-2 text-[#737B76] dark:text-[#98A09B]">Margin Tercapai</td>
              {rows.map((name) => <td key={name} className={`py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E] ${name === "Ideal" ? "bg-[#EEF9F2]/60 font-bold dark:bg-[#10673C18]" : ""}`}>{byName.get(name) ? formatPercent(byName.get(name)?.marginPercent, 1) : "-"}</td>)}
            </tr>
            <tr className="font-semibold">
              <td className="py-3 pl-2 text-[#161A18] dark:text-[#FAFBFA]">Laba Kotor per Unit</td>
              {rows.map((name) => <td key={name} className={`py-3 text-center tabular-nums text-[#168A4E] dark:text-[#1EA65E] ${name === "Ideal" ? "bg-[#EEF9F2]/60 font-bold dark:bg-[#10673C18]" : ""}`}>{byName.get(name) ? formatIDR(byName.get(name)?.profitPerUnit) : "-"}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
