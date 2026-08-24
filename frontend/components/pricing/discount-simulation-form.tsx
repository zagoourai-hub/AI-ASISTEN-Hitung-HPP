"use client"

import { useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { AlertTriangle, CheckCircle2, Info, Percent, ShieldAlert } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { simulateDiscount } from "@/lib/api/pricing"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import type { DiscountSimulationResponse } from "@/lib/types/api"

interface DiscountFormValues {
  baseSellingPrice: string
  discountPercent: string
}

interface DiscountSimulationFormProps {
  variantId: string
  basePrice: string
  fullHpp: string
}

export function DiscountSimulationForm({ variantId, basePrice, fullHpp }: DiscountSimulationFormProps) {
  const form = useForm<DiscountFormValues>({
    defaultValues: { baseSellingPrice: basePrice, discountPercent: "10" },
  })
  const mutation = useMutation<DiscountSimulationResponse, Error, DiscountFormValues>({
    mutationFn: (values) =>
      simulateDiscount(variantId, {
        baseSellingPrice: values.baseSellingPrice,
        discountPercent: Number(values.discountPercent),
      }),
  })

  const resetMutation = mutation.reset

  useEffect(() => {
    form.reset({ baseSellingPrice: basePrice, discountPercent: "10" })
    resetMutation()
  }, [basePrice, form, resetMutation, variantId])

  const error = mutation.error instanceof ApiError ? mutation.error : null
  const result = mutation.data
  const netProfit = parseDecimalToNumber(result?.netProfit)
  const netMargin = parseDecimalToNumber(result?.netMarginPercent)
  const isLoss = result?.isLoss ?? false

  return (
    <Card className="space-y-6">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]"><Percent className="h-4 w-4" /></div>
            <CardTitle>Simulasi Diskon & Promo</CardTitle>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium text-[#737B76]">Non-mutasi Harga</Badge>
        </div>
        <p className="text-xs text-[#737B76] dark:text-[#98A09B]">Hasil dihitung backend memakai HPP terakhir dan tidak mengubah harga katalog.</p>
      </CardHeader>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="sim-selling-price" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Harga Jual Acuan (per unit)</label>
            <Input id="sim-selling-price" type="number" min="0.01" step="any" prefixNode="Rp" className="tabular-nums" {...form.register("baseSellingPrice", { required: "Harga jual wajib diisi.", validate: (value) => Number(value) > 0 || "Harga harus lebih besar dari 0." })} />
            {form.formState.errors.baseSellingPrice && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.baseSellingPrice.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="sim-discount-percent" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">Persentase Diskon (%)</label>
            <Input id="sim-discount-percent" type="number" min="0" max="99.99" step="0.01" suffixNode="%" className="tabular-nums" {...form.register("discountPercent", { required: "Diskon wajib diisi.", validate: (value) => (Number(value) >= 0 && Number(value) < 100) || "Diskon harus 0-99.99%." })} />
            {form.formState.errors.discountPercent && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.discountPercent.message}</p>}
          </div>
        </div>
        {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => mutation.reset()} />}
        <Button type="submit" disabled={mutation.isPending} className="bg-[#10673C] text-white hover:bg-[#0D5230]">{mutation.isPending ? "Menghitung..." : "Simulasikan Diskon"}</Button>
      </form>

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Potongan Diskon" value={`- ${formatIDR(result.discountAmount)}`} tone="danger" />
            <Metric label="Harga Jual Bersih" value={formatIDR(result.netSellingPrice)} />
            <Metric label="Laba Bersih per Unit" value={formatIDR(result.netProfit)} tone={isLoss ? "danger" : "success"} />
            <Metric label="Margin Bersih" value={formatPercent(result.netMarginPercent, 1)} tone={isLoss ? "danger" : "success"} />
          </div>
          {isLoss ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#991B1B]"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" /><div><p className="font-bold">Peringatan: Jual Rugi.</p><p className="mt-0.5 text-[11px]">Harga bersih {formatIDR(result.netSellingPrice)} di bawah Full HPP {formatIDR(result.fullHpp)}.</p></div></div>
          ) : netMargin < 20 ? (
            <div className="flex items-start gap-3 rounded-xl border border-[#FEF08A] bg-[#FEFCE8] p-3 text-xs text-[#854D0E]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" /><span>Margin simulasi di bawah 20%; tetap rentan terhadap kenaikan biaya.</span></div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C]"><CheckCircle2 className="h-4 w-4 shrink-0" />Margin masih menghasilkan laba {formatIDR(netProfit)} per unit.</div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-[#737B76] dark:text-[#98A09B]"><Info className="h-3.5 w-3.5 shrink-0" />Isi parameter lalu jalankan simulasi untuk melihat hasil dari backend.</div>
      )}
      {!result && parseDecimalToNumber(fullHpp) <= 0 && <p className="text-[11px] text-[#D97706]">HPP belum tersedia; hitung HPP produk terlebih dahulu.</p>}
    </Card>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" | "success" }) {
  const color = tone === "danger" ? "text-[#DC2626]" : tone === "success" ? "text-[#168A4E]" : "text-[#161A18] dark:text-[#FAFBFA]"
  return <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#111315]"><p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">{label}</p><p className={`mt-1 text-sm font-bold tabular-nums ${color}`}>{value}</p></div>
}
