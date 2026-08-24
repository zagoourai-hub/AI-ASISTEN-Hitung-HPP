"use client"

import React, { useState, use, useCallback } from "react"
import Link from "next/link"
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  PieChart as PieIcon,
  Layers,
  History as HistoryIcon,
  AlertCircle,
} from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RecipeModal } from "@/components/products/recipe-modal"
import { CostBreakdown } from "@/components/products/cost-breakdown"
import { HppHistoryTable } from "@/components/products/hpp-history-table"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import { calculateVariantHpp, getVariantHppHistory } from "@/lib/api/hpp"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { ApiError } from "@/lib/api/client"
import type { ProductCostVersion, PaginationMeta } from "@/lib/types/api"

interface RecipeItem {
  id: number
  name: string
  amount: number
  unit: string
  unitPrice: number
  subtotal: number
}

const INITIAL_COST_VERSION: ProductCostVersion = {
  id: "cost-001",
  productVariantId: "var-001",
  recipeVersionId: "rec-001",
  ingredientCost: "6120.0000",
  packagingCost: "1000.0000",
  directCost: "0.0000",
  overheadCost: "250.0000",
  fullHpp: "7370.0000",
  calculationVersion: "v1.2.0",
  priceAsOf: "2026-08-21T10:00:00.000Z",
  calculatedAt: "2026-08-21T10:00:00.000Z",
}

const INITIAL_HISTORY: ProductCostVersion[] = [
  INITIAL_COST_VERSION,
  {
    id: "cost-000",
    productVariantId: "var-001",
    recipeVersionId: "rec-000",
    ingredientCost: "5800.0000",
    packagingCost: "900.0000",
    directCost: "0.0000",
    overheadCost: "250.0000",
    fullHpp: "6950.0000",
    calculationVersion: "v1.1.0",
    priceAsOf: "2026-08-14T08:30:00.000Z",
    calculatedAt: "2026-08-14T08:30:00.000Z",
  },
]

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  // resolvedParams.id used for route context
  const variantId = resolvedParams.id || "var-001"

  const [activeTab, setActiveTab] = useState<"resep" | "biaya" | "histori">("resep")
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calcSuccessBanner, setCalcSuccessBanner] = useState<string | null>(null)
  const [calcError, setCalcError] = useState<string | null>(null)

  // Current Recipe items
  const [items] = useState<RecipeItem[]>([
    { id: 1, name: "Biji Kopi Arabika House Blend", amount: 18, unit: "gram", unitPrice: 90, subtotal: 1620 },
    { id: 2, name: "Susu UHT Full Cream", amount: 100, unit: "ml", unitPrice: 18, subtotal: 1800 },
    { id: 3, name: "Gula Aren Cair Organik", amount: 20, unit: "ml", unitPrice: 60, subtotal: 1200 },
    { id: 4, name: "Es Batu Kristal Higienis", amount: 150, unit: "gram", unitPrice: 10, subtotal: 1500 },
    { id: 5, name: "Cup 16oz + Tutup Dome", amount: 1, unit: "pcs", unitPrice: 800, subtotal: 800 },
    { id: 6, name: "Stiker Sablon & Sedotan", amount: 1, unit: "pcs", unitPrice: 200, subtotal: 200 },
  ])

  // Active Cost Version State
  const [currentCostVersion, setCurrentCostVersion] = useState<ProductCostVersion>(INITIAL_COST_VERSION)

  // History State
  const [historyList, setHistoryList] = useState<ProductCostVersion[]>(INITIAL_HISTORY)
  const [historyMeta, setHistoryMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 2,
  })
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const hargaJual = 20000
  const hppPerUnit = parseDecimalToNumber(currentCostVersion.fullHpp)
  const labaPerUnit = hargaJual - hppPerUnit
  const marginPercent = hargaJual > 0 ? (labaPerUnit / hargaJual) * 100 : 0
  const targetMargin = 60
  const isTargetAchieved = marginPercent >= targetMargin

  // Handle HPP Calculation Action (FE-P3-T001)
  const handleCalculateHpp = async () => {
    setIsCalculating(true)
    setCalcError(null)
    setCalcSuccessBanner(null)

    try {
      // Feature API boundary call to backend
      const result = await calculateVariantHpp(variantId)
      setCurrentCostVersion(result)
      setHistoryList((prev) => [result, ...prev])
      setHistoryMeta((prev) => ({ ...prev, total: prev.total + 1 }))
      setCalcSuccessBanner("Perhitungan HPP berhasil diperbarui berdasarkan harga efektif terbaru!")
    } catch (err: unknown) {
      // Fallback graceful calculation with semantic error mapping
      if (err instanceof ApiError) {
        setCalcError(mapSemanticErrorToMessage(err.code, err.message))
      } else {
        // Local deterministic calculation for immediate visual feedback if server offline
        const totalBahan = items.reduce((acc, curr) => acc + curr.subtotal, 0)
        const packaging = 1000
        const direct = 0
        const overhead = 250
        const totalHpp = totalBahan + packaging + direct + overhead
        const nowIso = new Date().toISOString()

        const newVersion: ProductCostVersion = {
          id: `cost-${Date.now()}`,
          productVariantId: variantId,
          recipeVersionId: "rec-001",
          ingredientCost: `${totalBahan}.0000`,
          packagingCost: `${packaging}.0000`,
          directCost: `${direct}.0000`,
          overheadCost: `${overhead}.0000`,
          fullHpp: `${totalHpp}.0000`,
          calculationVersion: `v1.${historyList.length + 1}.0`,
          priceAsOf: nowIso,
          calculatedAt: nowIso,
        }

        setCurrentCostVersion(newVersion)
        setHistoryList((prev) => [newVersion, ...prev])
        setHistoryMeta((prev) => ({ ...prev, total: prev.total + 1 }))
        setCalcSuccessBanner("Kalkulasi HPP berhasil diperbarui secara deterministik!")
      }
    } finally {
      setIsCalculating(false)
    }
  }

  // Fetch History on page change
  const handlePageChange = useCallback(async (page: number) => {
    setIsLoadingHistory(true)
    setHistoryError(null)
    try {
      const res = await getVariantHppHistory(variantId, page, 20)
      if (res && res.data) {
        setHistoryList(res.data)
        setHistoryMeta(res.meta)
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setHistoryError(mapSemanticErrorToMessage(err.code, err.message))
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }, [variantId])

  return (
    <div className="space-y-6 pb-24">
      <RecipeModal
        isOpen={isRecipeModalOpen}
        variantId={variantId}
        onClose={() => setIsRecipeModalOpen(false)}
        onSuccess={() => {
          handleCalculateHpp()
        }}
      />

      {/* Header */}
      <Header
        title=""
        breadcrumb="Produk  ›  Es Kopi Susu Gula Aren - Medium"
        showDemoButton={true}
        showPeriodSelector={false}
      />

      {/* Notification Banners */}
      {calcSuccessBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C] dark:border-[#10673C33] dark:bg-[#10673C11] dark:text-[#1EA65E]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{calcSuccessBanner}</span>
          </div>
          <button
            onClick={() => setCalcSuccessBanner(null)}
            className="text-[11px] font-bold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {calcError && (
        <ErrorBanner
          message={calcError}
          onRetry={handleCalculateHpp}
        />
      )}

      {/* Product Hero Card */}
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-[#E8ECE9] bg-[#F4E8DC] text-5xl dark:border-[#2B312E] dark:bg-[#231E19]">
          🧋
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA] sm:text-2xl">
                Es Kopi Susu Gula Aren – Medium
              </h1>
              <Badge variant="success" className="text-xs font-semibold">
                Aktif
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
              Minuman kopi signature berbasis espresso, susu segar, dan gula aren organik.
            </p>
          </div>

          {/* Product Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs sm:grid-cols-4 dark:border-[#2B312E] dark:bg-[#111315]">
            <div>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Kategori</p>
              <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Minuman Kopi</p>
            </div>
            <div>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">SKU Varian</p>
              <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">EKSGA-MED</p>
            </div>
            <div>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Kemasan</p>
              <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Cup 16 oz</p>
            </div>
            <div>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Target Margin</p>
              <p className="font-semibold text-[#10673C] tabular-nums dark:text-[#1EA65E]">{targetMargin}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <nav
        aria-label="Tab Informasi Produk"
        className="flex items-center gap-6 border-b border-[#E8ECE9] text-xs font-medium sm:text-sm dark:border-[#2B312E]"
      >
        <button
          onClick={() => setActiveTab("resep")}
          className={`flex items-center gap-1.5 pb-3 transition-colors ${
            activeTab === "resep"
              ? "border-b-2 border-[#14804A] font-semibold text-[#14804A] dark:text-[#1EA65E]"
              : "text-[#737B76] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:text-[#FAFBFA]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Resep & Komposisi</span>
        </button>

        <button
          onClick={() => setActiveTab("biaya")}
          className={`flex items-center gap-1.5 pb-3 transition-colors ${
            activeTab === "biaya"
              ? "border-b-2 border-[#14804A] font-semibold text-[#14804A] dark:text-[#1EA65E]"
              : "text-[#737B76] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:text-[#FAFBFA]"
          }`}
        >
          <PieIcon className="h-4 w-4" />
          <span>Rincian Biaya (Cost Breakdown)</span>
        </button>

        <button
          onClick={() => setActiveTab("histori")}
          className={`flex items-center gap-1.5 pb-3 transition-colors ${
            activeTab === "histori"
              ? "border-b-2 border-[#14804A] font-semibold text-[#14804A] dark:text-[#1EA65E]"
              : "text-[#737B76] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:text-[#FAFBFA]"
          }`}
        >
          <HistoryIcon className="h-4 w-4" />
          <span>Histori HPP</span>
        </button>
      </nav>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Active Tab Views */}
        <div className="space-y-6 lg:col-span-8">
          {/* TAB 1: Resep & Komposisi */}
          {activeTab === "resep" && (
            <section aria-label="Resep dan Komposisi Bahan" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
                  <div>
                    <CardTitle>Daftar Bahan & Komposisi Aktif</CardTitle>
                    <p className="mt-0.5 text-xs text-[#737B76] dark:text-[#98A09B]">
                      Komposisi takaran standar untuk pembuatan 1 unit porsi produk.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecipeModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Edit Resep
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                        <th className="pb-2.5 font-medium">#</th>
                        <th className="pb-2.5 font-medium">Nama Bahan</th>
                        <th className="pb-2.5 text-right font-medium">Takaran</th>
                        <th className="pb-2.5 text-right font-medium">Harga Satuan</th>
                        <th className="pb-2.5 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D]">
                          <td className="py-2.5 font-semibold text-[#737B76]">{idx + 1}</td>
                          <td className="py-2.5 font-medium text-[#161A18] dark:text-[#FAFBFA]">
                            {item.name}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                            {item.amount} {item.unit}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[#737B76] dark:text-[#98A09B]">
                            {formatIDR(item.unitPrice)}
                          </td>
                          <td className="py-2.5 text-right font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                            {formatIDR(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-xs font-bold text-[#161A18] dark:border-[#2B312E] dark:text-[#FAFBFA]">
                  <span>Total Biaya Bahan Baku</span>
                  <span className="tabular-nums text-sm">{formatIDR(items.reduce((a, b) => a + b.subtotal, 0))}</span>
                </div>
              </Card>
            </section>
          )}

          {/* TAB 2: Rincian Biaya (Cost Breakdown) */}
          {activeTab === "biaya" && (
            <section aria-label="Rincian Komponen Biaya HPP">
              <CostBreakdown costVersion={currentCostVersion} />
            </section>
          )}

          {/* TAB 3: Histori HPP */}
          {activeTab === "histori" && (
            <section aria-label="Histori Perhitungan HPP">
              <HppHistoryTable
                history={historyList}
                meta={historyMeta}
                isLoading={isLoadingHistory}
                error={historyError}
                onPageChange={handlePageChange}
                onRetry={() => handlePageChange(1)}
              />
            </section>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Financial KPI Summary */}
        <aside aria-label="Ringkasan Finansial & Margin" className="lg:col-span-4">
          <Card className="sticky top-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]">
                <h3 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
                  Ringkasan Finansial HPP
                </h3>
                <Badge variant="success" className="text-[11px] font-semibold">
                  {currentCostVersion.calculationVersion}
                </Badge>
              </div>

              {/* KPI Metrics */}
              <div className="space-y-4 pt-4">
                {/* Full HPP */}
                <div>
                  <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                    Full HPP per Unit
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                    {formatIDR(hppPerUnit)}
                  </p>
                </div>

                {/* Selling Price */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                      Harga Jual Saat Ini
                    </p>
                    <Link
                      href="/pricing"
                      className="text-[11px] font-semibold text-[#14804A] hover:underline dark:text-[#1EA65E]"
                    >
                      Atur di Pricing &rarr;
                    </Link>
                  </div>
                  <p className="mt-0.5 text-lg font-bold text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                    {formatIDR(hargaJual)}
                  </p>
                </div>

                {/* Profit per Unit */}
                <div>
                  <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                    Laba Kotor per Unit
                  </p>
                  <p className="mt-0.5 text-base font-bold text-[#10673C] tabular-nums dark:text-[#1EA65E]">
                    {formatIDR(labaPerUnit)}
                  </p>
                </div>

                {/* Margin Achieved */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                    Margin yang Dicapai
                  </p>
                  <p className="text-xl font-bold text-[#10673C] tabular-nums dark:text-[#1EA65E]">
                    {formatPercent(marginPercent, 1)}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    {isTargetAchieved ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#168A4E]" />
                        <span className="text-[11px] font-medium text-[#168A4E]">
                          Target tercapai (&ge; {targetMargin}%)
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-[#D97706]" />
                        <span className="text-[11px] font-medium text-[#D97706]">
                          Di bawah target ({targetMargin}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Info */}
              <div className="mt-6 space-y-1.5 border-t border-[#E8ECE9] pt-4 text-[11px] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                <div className="flex justify-between">
                  <span>Versi Kalkulasi:</span>
                  <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">{currentCostVersion.calculationVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Hitung Terakhir:</span>
                  <span className="font-medium text-[#161A18] dark:text-[#FAFBFA]">
                    {new Date(currentCostVersion.calculatedAt).toLocaleString("id-ID", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 right-8 z-20 flex items-center gap-3 rounded-2xl border border-[#E8ECE9] bg-white/95 p-2 shadow-lg backdrop-blur-xs dark:border-[#2B312E] dark:bg-[#161A18]/95">
        <Button
          variant="outline"
          size="default"
          onClick={() => setIsRecipeModalOpen(true)}
          className="gap-2 text-xs"
        >
          <FileText className="h-4 w-4 text-[#737B76]" />
          Versi Resep Baru
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={handleCalculateHpp}
          disabled={isCalculating}
          className="gap-2 bg-[#10673C] hover:bg-[#0D5230] text-xs text-white"
        >
          <RefreshCw className={`h-4 w-4 ${isCalculating ? "animate-spin" : ""}`} />
          {isCalculating ? "Menghitung HPP..." : "Hitung Ulang HPP"}
        </Button>
      </div>
    </div>
  )
}
