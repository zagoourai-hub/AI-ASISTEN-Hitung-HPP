"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, FileText, History as HistoryIcon, Layers, PieChart, RefreshCw } from "lucide-react"
import { activateRecipe, getProduct, listIngredients, listRecipes } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { calculateVariantHpp, getVariantHppHistory } from "@/lib/api/hpp"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import type { ProductCostVersion, RecipeVersion } from "@/lib/types/api"
import { Header } from "@/components/header"
import { RecipeModal } from "@/components/products/recipe-modal"
import { ProductImageManager } from "@/components/products/product-image"
import { CostBreakdown } from "@/components/products/cost-breakdown"
import { HppHistoryTable } from "@/components/products/hpp-history-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"

type DetailTab = "resep" | "biaya" | "histori"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<DetailTab>("resep")
  const [historyPage, setHistoryPage] = useState(1)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: ({ signal }) => getProduct(productId, signal),
  })
  const product = productQuery.data
  const variant = product?.variants[0]
  const variantId = variant?.id
  const recipesQuery = useQuery({
    queryKey: ["recipes", variantId],
    queryFn: ({ signal }) => listRecipes(variantId as string, signal),
    enabled: Boolean(variantId),
  })
  const ingredientsQuery = useQuery({
    queryKey: ["ingredients"],
    queryFn: ({ signal }) => listIngredients(signal),
    enabled: Boolean(variantId),
  })
  const historyQuery = useQuery({
    queryKey: ["hpp-history", variantId, historyPage],
    queryFn: ({ signal }) => getVariantHppHistory(variantId as string, historyPage, 20, signal),
    enabled: Boolean(variantId),
  })
  const latestHppQuery = useQuery({
    queryKey: ["hpp-latest", variantId],
    queryFn: ({ signal }) => getVariantHppHistory(variantId as string, 1, 1, signal),
    enabled: Boolean(variantId),
  })
  const calculateMutation = useMutation({
    mutationFn: () => calculateVariantHpp(variantId as string),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hpp-history", variantId] }),
        queryClient.invalidateQueries({ queryKey: ["hpp-latest", variantId] }),
      ])
    },
  })
  const activateMutation = useMutation({
    mutationFn: (recipeVersionId: string) => activateRecipe(recipeVersionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipes", variantId] }),
        queryClient.invalidateQueries({ queryKey: ["hpp-history", variantId] }),
        queryClient.invalidateQueries({ queryKey: ["hpp-latest", variantId] }),
      ])
    },
  })

  const error = productQuery.error instanceof ApiError
    ? productQuery.error
    : recipesQuery.error instanceof ApiError
      ? recipesQuery.error
      : historyQuery.error instanceof ApiError
        ? historyQuery.error
          : latestHppQuery.error instanceof ApiError
            ? latestHppQuery.error
            : activateMutation.error instanceof ApiError
              ? activateMutation.error
            : calculateMutation.error instanceof ApiError
              ? calculateMutation.error
              : null

  if (productQuery.isPending) return <LoadingSpinner label="Memuat detail produk..." />
  if (error && !product) return <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => productQuery.refetch()} />
  if (!product || !variant || !variantId) return <EmptyState title="Varian belum tersedia" description="Produk ini belum memiliki varian yang dapat dihitung HPP." />

  const history = historyQuery.data?.data ?? []
  const currentCost: ProductCostVersion | null = latestHppQuery.data?.data[0] ?? null
  const recipes = recipesQuery.data?.data ?? []
  const activeRecipe: RecipeVersion | undefined = recipes.find((recipe) => recipe.status === "ACTIVE")
  const draftRecipe: RecipeVersion | undefined = recipes.find((recipe) => recipe.status === "DRAFT")
  const displayedRecipe = activeRecipe ?? draftRecipe
  const ingredientMap = new Map((ingredientsQuery.data?.data ?? []).map((ingredient) => [ingredient.id, ingredient]))
  const targetMargin = parseDecimalToNumber(variant.target_margin_override ?? product.category?.target_margin) * 100
  const sellingPrice = parseDecimalToNumber(variant.selling_price)
  const hpp = parseDecimalToNumber(currentCost?.fullHpp)
  const profit = sellingPrice - hpp
  const achievedMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

  return (
    <div className="space-y-6 pb-24">
      <RecipeModal
        isOpen={isRecipeModalOpen}
        variantId={variantId}
        onClose={() => setIsRecipeModalOpen(false)}
        onSuccess={() => recipesQuery.refetch()}
      />
      <Header title={product.name} breadcrumb="Produk" showPeriodSelector={false} />

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <ProductImageManager productId={product.id} productName={product.name} imageUrl={product.image_url} />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">{product.name}</h1>
            <Badge variant={product.status === "ACTIVE" ? "success" : "outline"}>{product.status === "ACTIVE" ? "Aktif" : "Arsip"}</Badge>
          </div>
          <p className="text-xs text-[#737B76] dark:text-[#98A09B]">{product.category?.name ?? "Tanpa kategori"} · Varian: {variant.name}</p>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs sm:grid-cols-4 dark:border-[#2B312E] dark:bg-[#111315]">
            <Summary label="Harga Jual" value={formatIDR(variant.selling_price)} />
            <Summary label="Kemasan" value={formatIDR(variant.packaging_cost)} />
            <Summary label="Biaya Langsung" value={formatIDR(variant.direct_cost)} />
            <Summary label="Target Margin" value={formatPercent(targetMargin)} accent />
          </div>
        </div>
      </Card>

      {calculateMutation.isSuccess && <div role="status" className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C]"><CheckCircle2 className="h-4 w-4" />Perhitungan HPP berhasil diperbarui dari backend.</div>}
      {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => { calculateMutation.reset(); historyQuery.refetch(); latestHppQuery.refetch() }} />}

      <nav aria-label="Tab Informasi Produk" className="flex items-center gap-6 overflow-x-auto border-b border-[#E8ECE9] text-xs font-medium dark:border-[#2B312E]">
        {([["resep", Layers, "Resep & Komposisi"], ["biaya", PieChart, "Rincian Biaya"], ["histori", HistoryIcon, "Histori HPP"]] as const).map(([tab, Icon, label]) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`flex shrink-0 items-center gap-1.5 pb-3 ${activeTab === tab ? "border-b-2 border-[#14804A] font-semibold text-[#14804A]" : "text-[#737B76]"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {activeTab === "resep" && <section aria-label="Resep dan Komposisi Bahan"><Card><CardHeader className="flex flex-row items-center justify-between p-0 pb-4"><div><CardTitle>Komposisi Resep</CardTitle><p className="mt-1 text-xs text-[#737B76]">Data resep aktif yang tersimpan di backend.</p></div><Button variant="outline" size="sm" onClick={() => setIsRecipeModalOpen(true)} className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Versi Resep Baru</Button></CardHeader>{recipesQuery.isPending ? <LoadingSpinner label="Memuat resep..." /> : !displayedRecipe ? <EmptyState title="Belum Ada Resep" description="Buat versi resep sebelum menghitung HPP." /> : <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><Badge variant={displayedRecipe.status === "ACTIVE" ? "success" : "outline"}>{displayedRecipe.status === "ACTIVE" ? "Aktif" : "Draft"}</Badge>{displayedRecipe.status === "DRAFT" && <Button size="sm" onClick={() => activateMutation.mutate(displayedRecipe.id)} disabled={activateMutation.isPending} className="bg-[#14804A] text-xs text-white hover:bg-[#10673C]">{activateMutation.isPending ? "Mengaktifkan..." : "Aktifkan Resep"}</Button>}</div><div className="overflow-x-auto"><table className="min-w-[440px] text-left text-xs"><thead><tr className="border-b border-[#E8ECE9] text-[#737B76]"><th className="pb-2.5">#</th><th className="pb-2.5">Nama Bahan</th><th className="whitespace-nowrap pb-2.5 text-right">Takaran</th><th className="whitespace-nowrap pb-2.5">Satuan</th></tr></thead><tbody className="divide-y divide-[#E8ECE9]">{displayedRecipe.items.map((item, index) => <tr key={item.id}><td className="py-2.5 text-[#737B76]">{index + 1}</td><td className="py-2.5 font-medium">{ingredientMap.get(item.ingredient_id)?.name ?? item.ingredient_id}</td><td className="whitespace-nowrap py-2.5 text-right tabular-nums">{item.quantity}</td><td className="whitespace-nowrap py-2.5">{item.unit}</td></tr>)}</tbody></table></div></div>}</Card></section>}
          {activeTab === "biaya" && <CostBreakdown costVersion={currentCost} />}
          {activeTab === "histori" && <HppHistoryTable history={history} meta={historyQuery.data?.meta} isLoading={historyQuery.isPending} error={historyQuery.error instanceof ApiError ? mapSemanticErrorToMessage(historyQuery.error.code, historyQuery.error.message) : null} onPageChange={setHistoryPage} onRetry={() => historyQuery.refetch()} />}
        </div>

        <aside aria-label="Ringkasan Finansial & Margin" className="lg:col-span-4">
          <Card className="sticky top-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4"><h2 className="text-sm font-bold">Ringkasan Finansial HPP</h2><Badge variant="outline">{currentCost?.calculationVersion ?? "Belum dihitung"}</Badge></div>
            <div><p className="text-xs text-[#737B76]">Full HPP per Unit</p><p className="text-2xl font-bold tabular-nums">{currentCost ? formatIDR(currentCost.fullHpp) : "-"}</p></div>
            <div><div className="flex items-center justify-between"><p className="text-xs text-[#737B76]">Harga Jual Saat Ini</p><Link href={`/pricing?variant=${variantId}`} className="text-[11px] font-semibold text-[#14804A] hover:underline">Atur di Pricing</Link></div><p className="text-lg font-bold tabular-nums">{formatIDR(variant.selling_price)}</p></div>
            <div><p className="text-xs text-[#737B76]">Laba Kotor per Unit</p><p className="text-base font-bold tabular-nums text-[#10673C]">{currentCost ? formatIDR(profit) : "-"}</p></div>
            <div><p className="text-xs text-[#737B76]">Margin yang Dicapai</p><p className="text-xl font-bold tabular-nums text-[#10673C]">{currentCost ? formatPercent(achievedMargin) : "-"}</p>{currentCost && <p className="mt-1 flex items-center gap-1 text-[11px] text-[#737B76]">{achievedMargin >= targetMargin ? <><CheckCircle2 className="h-3.5 w-3.5 text-[#168A4E]" />Target tercapai</> : <><AlertCircle className="h-3.5 w-3.5 text-[#D97706]" />Di bawah target</>}</p>}</div>
          </Card>
        </aside>
      </div>

      <div className="ml-auto mt-6 flex w-fit gap-2 rounded-2xl border border-[#E8ECE9] bg-white/95 p-2 shadow-lg backdrop-blur-xs dark:border-[#2B312E] dark:bg-[#161A18]/95 sm:fixed sm:bottom-6 sm:right-8 sm:z-20"><Button variant="outline" size="sm" onClick={() => setIsRecipeModalOpen(true)} className="gap-2 text-xs"><FileText className="h-4 w-4" />Resep</Button><Button size="sm" onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending} className="gap-2 bg-[#10673C] text-xs text-white hover:bg-[#0D5230]"><RefreshCw className={`h-4 w-4 ${calculateMutation.isPending ? "animate-spin" : ""}`} />{calculateMutation.isPending ? "Menghitung..." : "Hitung HPP"}</Button></div>
    </div>
  )
}

function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div><p className="text-[11px] text-[#737B76]">{label}</p><p className={`font-semibold tabular-nums ${accent ? "text-[#10673C]" : ""}`}>{value}</p></div>
}
