"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useQueries, useQuery } from "@tanstack/react-query"
import { AlertTriangle, Calculator, ChevronRight, Package, Tag, Target } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { getBusiness } from "@/lib/api/business"
import { listProducts } from "@/lib/api/catalog"
import { getVariantHppHistory } from "@/lib/api/hpp"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import type { ProductCostVersion } from "@/lib/types/api"

export default function DashboardPage() {
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: ({ signal }) => listProducts(signal) })
  const businessQuery = useQuery({ queryKey: ["business"], queryFn: ({ signal }) => getBusiness(signal) })
  const products = productsQuery.data?.data
  const variants = useMemo(
    () => (products ?? []).flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
    [products]
  )
  const costQueries = useQueries({
    queries: variants.map(({ variant }) => ({
      queryKey: ["hpp-history", variant.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => getVariantHppHistory(variant.id, 1, 1, signal),
      enabled: Boolean(products),
    })),
  })
  const costEntries = useMemo(
    () => variants.map(({ product, variant }, index) => ({ product, variant, cost: costQueries[index]?.data?.data[0] ?? null })),
    [costQueries, variants]
  )
  const loadedCosts = costEntries.filter((entry): entry is typeof entry & { cost: ProductCostVersion } => entry.cost !== null)
  const targetMargin = parseDecimalToNumber(businessQuery.data?.data.default_target_margin) * 100
  const activeProducts = (products ?? []).filter((product) => product.status === "ACTIVE")
  const metrics = useMemo(() => {
    const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    const hppValues = loadedCosts.map(({ cost }) => parseDecimalToNumber(cost.fullHpp))
    const sellingValues = variants.map(({ variant }) => parseDecimalToNumber(variant.selling_price))
    const margins = loadedCosts.flatMap(({ variant, cost }) => {
      const price = parseDecimalToNumber(variant.selling_price)
      const hpp = parseDecimalToNumber(cost.fullHpp)
      return price > 0 ? [((price - hpp) / price) * 100] : []
    })
    return {
      averageHpp: average(hppValues),
      averageSellingPrice: average(sellingValues),
      averageMargin: average(margins),
    }
  }, [loadedCosts, variants])
  const attentionEntries = loadedCosts.filter(({ product, variant, cost }) => {
    const price = parseDecimalToNumber(variant.selling_price)
    const hpp = parseDecimalToNumber(cost.fullHpp)
    const margin = price > 0 ? ((price - hpp) / price) * 100 : 0
    const productTarget = parseDecimalToNumber(variant.target_margin_override ?? product.category?.target_margin) * 100 || targetMargin
    return margin < productTarget
  })
  const breakdown = useMemo(() => {
    const totals = loadedCosts.reduce(
      (sum, { cost }) => ({
        ingredient: sum.ingredient + parseDecimalToNumber(cost.ingredientCost),
        packaging: sum.packaging + parseDecimalToNumber(cost.packagingCost),
        direct: sum.direct + parseDecimalToNumber(cost.directCost),
        overhead: sum.overhead + parseDecimalToNumber(cost.overheadCost),
      }),
      { ingredient: 0, packaging: 0, direct: 0, overhead: 0 }
    )
    const total = totals.ingredient + totals.packaging + totals.direct + totals.overhead || 1
    const segment = (name: string, value: number, color: string): DonutSegment => ({ name, value: (value / total) * 100, amount: formatIDR(value), color })
    return [
      segment("Bahan Baku", totals.ingredient, "#10673C"),
      segment("Kemasan", totals.packaging, "#14804A"),
      segment("Biaya Langsung", totals.direct, "#D97706"),
      segment("Overhead", totals.overhead, "#737B76"),
    ].filter((item) => item.value > 0)
  }, [loadedCosts])

  const queryError = productsQuery.error instanceof ApiError ? productsQuery.error : businessQuery.error instanceof ApiError ? businessQuery.error : null
  if (productsQuery.isPending || businessQuery.isPending) return <LoadingSpinner label="Memuat dashboard..." />
  if (queryError) return <ErrorBanner code={queryError.code} message={mapSemanticErrorToMessage(queryError.code, queryError.message)} onRetry={() => { productsQuery.refetch(); businessQuery.refetch() }} />

  const isMarginBelowTarget = loadedCosts.length > 0 && metrics.averageMargin < targetMargin

  return (
    <div className="space-y-6 pb-12">
      <Header title="Dashboard" subtitle="Ringkasan performa bisnis dari data produk dan HPP backend." />

      {isMarginBelowTarget && (
        <section aria-label="Peringatan Margin" className="flex items-start gap-4 rounded-[18px] border border-[#FED7AA] bg-[#FFFBEB] p-4 text-[#9A3412] dark:border-[#78350F] dark:bg-[#451A03]/30 dark:text-[#FDBA74]">
          <div className="rounded-full bg-[#FEF3C7] p-2 text-[#D97706]"><AlertTriangle className="h-5 w-5" /></div>
          <div><h2 className="text-sm font-semibold">Margin rata-rata berada di bawah target.</h2><p className="mt-0.5 text-xs">Margin saat ini {formatPercent(metrics.averageMargin)}; target bisnis {formatPercent(targetMargin)}.</p></div>
        </section>
      )}

      <section aria-label="Metrik Utama" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="HPP Rata-rata" value={loadedCosts.length ? formatIDR(metrics.averageHpp) : "-"} caption={loadedCosts.length ? `${loadedCosts.length} varian memiliki HPP` : "Belum ada HPP dihitung"} Icon={Calculator} />
        <MetricCard label="Harga Jual Rata-rata" value={variants.length ? formatIDR(metrics.averageSellingPrice) : "-"} caption={`${variants.length} varian produk`} Icon={Tag} />
        <MetricCard label="Margin Rata-rata" value={loadedCosts.length ? formatPercent(metrics.averageMargin) : "-"} caption={loadedCosts.length ? `Target ${formatPercent(targetMargin)}` : "Hitung HPP untuk melihat margin"} Icon={Target} />
        <MetricCard label="Produk Aktif" value={String(activeProducts.length)} caption={`${variants.length} varian terhubung`} Icon={Package} />
      </section>

      <section aria-label="Analisis Biaya & Produk" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <div><CardHeader className="p-0 pb-4"><CardTitle>Produk Perlu Diperhatikan</CardTitle></CardHeader>
            {attentionEntries.length === 0 ? <EmptyState title="Belum ada peringatan margin" description={loadedCosts.length ? "Semua varian dengan HPP memenuhi target bisnisnya." : "Hitung HPP pada detail produk untuk memeriksa margin."} /> : <div className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">{attentionEntries.slice(0, 5).map(({ product, variant, cost }) => { const price = parseDecimalToNumber(variant.selling_price); const margin = price > 0 ? ((price - parseDecimalToNumber(cost.fullHpp)) / price) * 100 : 0; return <Link key={variant.id} href={`/products/${product.id}`} className="group flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D]"><div><h3 className="text-xs font-semibold group-hover:text-[#14804A]">{product.name} · {variant.name}</h3><p className="text-[11px] text-[#737B76]">Margin {formatPercent(margin)} · HPP {formatIDR(cost.fullHpp)}</p></div><div className="flex items-center gap-2"><Badge variant="destructive" className="text-[10px]">Margin rendah</Badge><ChevronRight className="h-4 w-4 text-[#98A09B]" /></div></Link> })}</div>}</div>
          {attentionEntries.length > 5 && <div className="border-t border-[#E8ECE9] pt-3 text-center dark:border-[#2B312E]"><Link href="/products" className="text-xs font-semibold text-[#14804A] hover:underline">Lihat semua produk</Link></div>}
        </Card>

        <Card className="flex flex-col justify-between"><div><CardHeader className="p-0 pb-4"><CardTitle>Komposisi Biaya (Rata-rata)</CardTitle></CardHeader>{breakdown.length ? <DonutChart segments={breakdown} layout="vertical" size={136} centerLabel="Komponen" centerValue="HPP" totalPercentage="100%" /> : <EmptyState title="Belum ada komposisi biaya" description="Data muncul setelah HPP produk dihitung." />}</div><div className="border-t border-[#E8ECE9] pt-3 text-center text-[11px] text-[#737B76] dark:border-[#2B312E]">{loadedCosts.length} kalkulasi HPP tersedia</div></Card>

        <Card><CardHeader className="p-0 pb-2"><CardTitle>Tren HPP Rata-rata</CardTitle></CardHeader><EmptyState title="Tren periode belum tersedia" description="Backend MVP belum menyediakan agregasi HPP lintas periode." /></Card>
      </section>

      <section aria-label="Status Integrasi" className="rounded-[18px] border border-[#DDF5E7] bg-[#FAFCFB] p-5 text-xs dark:border-[#10673C44] dark:bg-[#141A16]"><h2 className="font-bold text-[#161A18] dark:text-[#FAFBFA]">Data dashboard tersambung</h2><p className="mt-1 text-[#737B76] dark:text-[#98A09B]">Produk, varian, HPP, dan margin dibaca dari API FastAPI dengan session cookie. Laporan periodik menunggu endpoint agregasi backend.</p><Link href="/products" className="mt-3 inline-flex font-semibold text-[#14804A] hover:underline">Kelola Produk & HPP <ChevronRight className="ml-1 h-4 w-4" /></Link></section>
    </div>
  )
}

function MetricCard({ label, value, caption, Icon }: { label: string; value: string; caption: string; Icon: LucideIcon }) {
  return <Card className="flex flex-col justify-between"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">{value}</p><p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{caption}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]"><Icon className="h-5 w-5" /></div></div></Card>
}
