"use client"

import React from "react"
import { Layers, Package, Zap, PieChart as PieIcon, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DonutChart } from "@/components/charts/donut-chart"
import { formatIDR, parseDecimalToNumber } from "@/lib/format"
import type { ProductCostVersion } from "@/lib/types/api"

interface CostBreakdownProps {
  costVersion: ProductCostVersion | null
}

export function CostBreakdown({ costVersion }: CostBreakdownProps) {
  if (!costVersion) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4] text-[#737B76] dark:bg-[#232826]">
          <PieIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#161A18] dark:text-[#FAFBFA]">
          Belum Ada Rincian HPP
        </h3>
        <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
          Klik tombol &quot;Hitung Ulang HPP&quot; untuk mengkalkulasi rincian biaya produk ini.
        </p>
      </Card>
    )
  }

  const ingredientCost = parseDecimalToNumber(costVersion.ingredientCost)
  const packagingCost = parseDecimalToNumber(costVersion.packagingCost)
  const directCost = parseDecimalToNumber(costVersion.directCost)
  const overheadCost = parseDecimalToNumber(costVersion.overheadCost)
  const fullHpp = parseDecimalToNumber(costVersion.fullHpp) || (ingredientCost + packagingCost + directCost + overheadCost)

  const calcPercent = (val: number) => {
    if (fullHpp === 0) return 0
    return Math.round((val / fullHpp) * 1000) / 10
  }

  const costDetailData = [
    {
      name: "Bahan Baku",
      value: calcPercent(ingredientCost),
      amount: formatIDR(ingredientCost),
      color: "#14804A",
    },
    {
      name: "Kemasan (Packaging)",
      value: calcPercent(packagingCost),
      amount: formatIDR(packagingCost),
      color: "#2563EB",
    },
    {
      name: "Biaya Langsung",
      value: calcPercent(directCost),
      amount: formatIDR(directCost),
      color: "#D97706",
    },
    {
      name: "Overhead (Per Unit)",
      value: calcPercent(overheadCost),
      amount: formatIDR(overheadCost),
      color: "#737B76",
    },
  ].filter((item) => parseDecimalToNumber(item.amount.replace(/[^0-9]/g, "")) > 0 || item.value > 0)

  // Format dates
  const formattedCalculatedAt = costVersion.calculatedAt
    ? new Date(costVersion.calculatedAt).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-"

  const formattedPriceAsOf = costVersion.priceAsOf
    ? new Date(costVersion.priceAsOf).toLocaleDateString("id-ID", {
        dateStyle: "medium",
      })
    : "-"

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Visual Donut Chart Card */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader className="p-0 pb-4">
            <CardTitle>Distribusi Biaya HPP</CardTitle>
          </CardHeader>
          <DonutChart
            segments={costDetailData.length > 0 ? costDetailData : [
              { name: "Bahan Baku", value: 100, amount: formatIDR(ingredientCost), color: "#14804A" }
            ]}
            centerLabel="Full HPP"
            centerValue={formatIDR(fullHpp)}
            totalPercentage={formatIDR(fullHpp)}
          />
        </div>

        {/* Audit Meta Footer */}
        <div className="mt-4 flex flex-col gap-1 border-t border-[#E8ECE9] pt-3 text-[11px] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
          <div className="flex items-center justify-between">
            <span>Versi Kalkulasi:</span>
            <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">{costVersion.calculationVersion}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Basis Harga (Price As Of):</span>
            <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">{formattedPriceAsOf}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Waktu Hitung:</span>
            <span className="text-[#161A18] dark:text-[#FAFBFA]">{formattedCalculatedAt}</span>
          </div>
        </div>
      </Card>

      {/* Numerical Table Breakdown Card */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader className="p-0 pb-4">
            <CardTitle>Komponen Pembentuk HPP</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {/* Ingredient Cost */}
            <div className="flex items-center justify-between rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#161A18]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Biaya Bahan Baku</p>
                  <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{calcPercent(ingredientCost)}% dari total HPP</p>
                </div>
              </div>
              <span className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(ingredientCost)}
              </span>
            </div>

            {/* Packaging Cost */}
            <div className="flex items-center justify-between rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#161A18]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A33]">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Biaya Kemasan</p>
                  <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{calcPercent(packagingCost)}% dari total HPP</p>
                </div>
              </div>
              <span className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(packagingCost)}
              </span>
            </div>

            {/* Direct Cost */}
            <div className="flex items-center justify-between rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#161A18]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFBEB] text-[#D97706] dark:bg-[#78350F33]">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Biaya Langsung Lainnya</p>
                  <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{calcPercent(directCost)}% dari total HPP</p>
                </div>
              </div>
              <span className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(directCost)}
              </span>
            </div>

            {/* Overhead Cost */}
            <div className="flex items-center justify-between rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#161A18]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F5F4] text-[#737B76] dark:bg-[#2B312E]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Overhead Tetap per Unit</p>
                  <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{calcPercent(overheadCost)}% dari total HPP</p>
                </div>
              </div>
              <span className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                {formatIDR(overheadCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Full HPP Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-sm font-bold text-[#161A18] dark:border-[#2B312E] dark:text-[#FAFBFA]">
          <span>Full HPP per Unit</span>
          <span className="text-base text-[#10673C] tabular-nums dark:text-[#1EA65E]">{formatIDR(fullHpp)}</span>
        </div>
      </Card>
    </div>
  )
}
