"use client"

import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, CheckCircle2, Sliders } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner, EmptyState, LoadingSpinner } from "@/components/feedback/feedback-states"
import { listProducts } from "@/lib/api/catalog"
import { getBusiness } from "@/lib/api/business"
import { applyRecommendedPrice, createPriceRecommendation } from "@/lib/api/pricing"
import { getVariantHppHistory } from "@/lib/api/hpp"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, parseDecimalToNumber } from "@/lib/format"
import { useAppStore } from "@/lib/store/app-store"
import type { RoundingStrategy } from "@/lib/types/api"
import { PriceRecommendationCard } from "@/components/pricing/price-recommendation-card"
import { DiscountSimulationForm } from "@/components/pricing/discount-simulation-form"
import { ScenarioComparisonTable } from "@/components/pricing/scenario-comparison-table"

interface PricingFormValues {
  selectedVariantId: string
  targetMargin: string
  roundingStrategy: RoundingStrategy
  customRounding: string
}

export default function PricingPage() {
  const queryClient = useQueryClient()
  const storedVariantId = useAppStore((state) => state.selectedVariantId)
  const setSelectedVariantId = useAppStore((state) => state.setSelectedVariantId)
  const form = useForm<PricingFormValues>({
    defaultValues: {
      selectedVariantId: storedVariantId ?? "",
      targetMargin: "30",
      roundingStrategy: "NEAREST_100",
      customRounding: "500",
    },
  })
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: ({ signal }) => listProducts(signal) })
  const businessQuery = useQuery({ queryKey: ["business"], queryFn: ({ signal }) => getBusiness(signal) })
  const selectedVariantId = useWatch({ control: form.control, name: "selectedVariantId" })
  const products = productsQuery.data?.data
  const variantEntries = useMemo(
    () => (products ?? []).flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
    [products]
  )
  const selectedEntry = variantEntries.find(({ variant }) => variant.id === selectedVariantId) ?? variantEntries[0]
  const variantId = selectedEntry?.variant.id
  const productId = selectedEntry?.product.id
  const selectedVariant = selectedEntry?.variant
  const hppQuery = useQuery({
    queryKey: ["hpp-history", variantId],
    queryFn: () => getVariantHppHistory(variantId as string, 1, 1),
    enabled: Boolean(variantId),
  })
  const recommendationMutation = useMutation({
    mutationFn: ({ variantId: requestedVariantId, values }: { variantId: string; values: PricingFormValues }) =>
      createPriceRecommendation(requestedVariantId, {
        targetMargin: (Number(values.targetMargin) / 100).toFixed(4),
        roundingStrategy: values.roundingStrategy,
        customRounding: values.roundingStrategy === "CUSTOM" ? Number(values.customRounding) : undefined,
      }),
  })
  const applyMutation = useMutation({
    mutationFn: (price: string) => applyRecommendedPrice(productId as string, variantId as string, price),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["product", productId] }),
      ])
    },
  })

  useEffect(() => {
    if (selectedEntry && selectedEntry.variant.id !== selectedVariantId) {
      form.setValue("selectedVariantId", selectedEntry.variant.id)
    }
    if (selectedEntry) setSelectedVariantId(selectedEntry.variant.id)
  }, [form, selectedEntry, selectedVariantId, setSelectedVariantId])

  useEffect(() => {
    if (!selectedEntry) return
    const business = businessQuery.data?.data
    const targetMargin = selectedEntry.variant.target_margin_override ?? selectedEntry.product.category?.target_margin ?? business?.default_target_margin
    const setting = business?.pricing_setting
    form.reset({
      selectedVariantId: selectedEntry.variant.id,
      targetMargin: String(parseDecimalToNumber(targetMargin) * 100),
      roundingStrategy: setting?.rounding_strategy ?? "NEAREST_100",
      customRounding: setting?.custom_rounding ?? "500",
    })
  }, [businessQuery.data, form, selectedEntry])

  const hpp = hppQuery.data?.data[0]
  const recommendation = recommendationMutation.data
  const recommendationError = recommendationMutation.variables?.variantId === variantId && recommendationMutation.error instanceof ApiError ? recommendationMutation.error : null
  const applyError = applyMutation.error instanceof ApiError ? applyMutation.error : null
  const queryError = productsQuery.error instanceof ApiError ? productsQuery.error : businessQuery.error instanceof ApiError ? businessQuery.error : hppQuery.error instanceof ApiError ? hppQuery.error : null
  const error = recommendationError ?? applyError ?? queryError
  const roundingStrategy = useWatch({ control: form.control, name: "roundingStrategy" })
  const customRounding = useWatch({ control: form.control, name: "customRounding" })
  const roundingLabel = roundingStrategy === "CUSTOM" ? `Kelipatan ${customRounding}` : roundingStrategy === "NEAREST_100" ? "Ratusan terdekat" : "Tanpa pembulatan"

  if (productsQuery.isPending || businessQuery.isPending) return <LoadingSpinner label="Memuat data pricing..." />
  if (error && !selectedEntry) return <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => productsQuery.refetch()} />
  if (!selectedEntry || !variantId || !productId || !selectedVariant) return <EmptyState title="Belum ada varian produk" description="Tambahkan produk dan varian terlebih dahulu sebelum menggunakan Harga Pintar." />

  const submitRecommendation = (values: PricingFormValues) => {
    recommendationMutation.mutate({ variantId: variantId as string, values })
  }

  return (
    <div className="space-y-6 pb-24">
      <Header title="Harga Pintar & Simulasi" showPeriodSelector={false} />

      {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => { recommendationMutation.reset(); applyMutation.reset(); hppQuery.refetch() }} />}
      {applyMutation.isSuccess && <div role="status" className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C]"><CheckCircle2 className="h-4 w-4" />Harga jual berhasil diperbarui di backend.</div>}

      <section aria-label="Parameter Penentuan Harga">
        <Card className="space-y-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]"><Sliders className="h-4 w-4" /></div><CardTitle>Parameter Harga Produk</CardTitle></div>
            <Badge variant="outline" className="text-xs">IDR Only</Badge>
          </CardHeader>
          <form onSubmit={form.handleSubmit(submitRecommendation)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="select-product" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Pilih Varian Produk</label>
                <div className="relative flex items-center">
                  <select id="select-product" className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]" {...form.register("selectedVariantId", { required: "Pilih varian produk." })}>
                    {variantEntries.map(({ product, variant }) => <option key={variant.id} value={variant.id}>{product.name} - {variant.name} ({formatIDR(variant.selling_price)})</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" />
                </div>
              </div>
              <div className="space-y-1.5"><label htmlFor="hpp-input" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">HPP Aktif per Unit</label><Input id="hpp-input" disabled value={hpp ? formatIDR(hpp.fullHpp) : "Belum dihitung"} className="tabular-nums" /></div>
              <div className="space-y-1.5"><label htmlFor="margin-input" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Target Margin (%)</label><Input id="margin-input" type="number" min="0" max="99.9" step="0.1" suffixNode="%" className="tabular-nums" {...form.register("targetMargin", { required: "Target margin wajib diisi.", validate: (value) => (Number(value) >= 0 && Number(value) < 100) || "Margin harus 0-99.9%." })} /></div>
              <div className="space-y-1.5"><label htmlFor="rounding-select" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Strategi Pembulatan</label><div className="relative flex items-center"><select id="rounding-select" className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]" {...form.register("roundingStrategy")}><option value="NEAREST_100">Ratusan Terdekat</option><option value="CUSTOM">Kelipatan Kustom</option><option value="NONE">Tanpa Pembulatan</option></select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" /></div></div>
            </div>
            {roundingStrategy === "CUSTOM" && <div className="max-w-xs space-y-1.5"><label htmlFor="custom-step" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Kelipatan Pembulatan Kustom (Rp)</label><Input id="custom-step" type="number" min="1" step="any" prefixNode="Rp" className="tabular-nums" {...form.register("customRounding", { required: "Kelipatan kustom wajib diisi.", validate: (value) => Number(value) > 0 || "Harus lebih besar dari 0." })} /></div>}
            <Button type="submit" disabled={recommendationMutation.isPending || !hpp} className="bg-[#10673C] text-white hover:bg-[#0D5230]">{recommendationMutation.isPending ? "Menghitung rekomendasi..." : "Buat Rekomendasi dari Backend"}</Button>
          </form>
        </Card>
      </section>

      {recommendation && recommendation.productVariantId === variantId ? <>
        <PriceRecommendationCard recommendation={recommendation} currentSellingPrice={selectedVariant.selling_price} onApplyPrice={async (price) => { await applyMutation.mutateAsync(price) }} isApplying={applyMutation.isPending} />
        <section aria-label="Tabel Perbandingan Skenario"><ScenarioComparisonTable fullHpp={hpp?.fullHpp ?? "0"} scenarios={recommendation.scenarios} roundingStrategyName={roundingLabel} /></section>
      </> : <EmptyState title="Rekomendasi belum dibuat" description={hpp ? "Atur target margin lalu buat rekomendasi harga dari backend." : "Hitung HPP aktif pada detail produk terlebih dahulu."} />}

      <section aria-label="Simulasi Diskon Promosi"><DiscountSimulationForm variantId={variantId} basePrice={selectedVariant.selling_price} fullHpp={hpp?.fullHpp ?? "0"} /></section>
    </div>
  )
}
