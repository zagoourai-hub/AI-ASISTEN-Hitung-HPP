"use client"

import React, { useState } from "react"
import { Percent, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatIDR, formatPercent } from "@/lib/format"

interface DiscountSimulationFormProps {
  basePrice: number
  fullHpp: number
}

export function DiscountSimulationForm({
  basePrice,
  fullHpp,
}: DiscountSimulationFormProps) {
  const [sellingPrice, setSellingPrice] = useState<number>(basePrice || 18000)
  const [discountPercent, setDiscountPercent] = useState<number>(10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDiscountChange = (val: string) => {
    const num = parseFloat(val)
    if (isNaN(num)) {
      setDiscountPercent(0)
      setErrorMessage(null)
      return
    }

    if (num < 0) {
      setErrorMessage("Diskon tidak boleh bernilai negatif.")
      setDiscountPercent(0)
      return
    }

    if (num >= 100) {
      setErrorMessage("Diskon tidak boleh mencapai atau melebihi 100%.")
      setDiscountPercent(num)
      return
    }

    setErrorMessage(null)
    setDiscountPercent(num)
  }

  // Calculations (Simulations purely for visual analytics, does not mutate underlying product)
  const validDiscount = Math.min(Math.max(discountPercent, 0), 99.99)
  const discountAmount = Math.round((sellingPrice * validDiscount) / 100)
  const netSellingPrice = Math.max(sellingPrice - discountAmount, 0)
  const netProfit = netSellingPrice - fullHpp
  const netMarginPercent = netSellingPrice > 0 ? (netProfit / netSellingPrice) * 100 : 0
  const isLoss = netProfit < 0

  return (
    <Card className="space-y-6">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33]">
              <Percent className="h-4 w-4" />
            </div>
            <CardTitle>Simulasi Diskon & Promo</CardTitle>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium text-[#737B76]">
            Non-mutasi Harga
          </Badge>
        </div>
        <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
          Hitung estimasi margin dan laba bersih saat program promosi diskon berjalan tanpa mengubah harga jual di katalog.
        </p>
      </CardHeader>

      {/* Input Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="sim-selling-price" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
            Harga Jual Acuan (per unit)
          </label>
          <Input
            id="sim-selling-price"
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
            prefixNode="Rp"
            className="tabular-nums"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sim-discount-percent" className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
            Persentase Diskon (%)
          </label>
          <Input
            id="sim-discount-percent"
            type="number"
            step="1"
            min="0"
            max="99"
            value={discountPercent}
            onChange={(e) => handleDiscountChange(e.target.value)}
            suffixNode="%"
            className="tabular-nums"
          />
          {errorMessage && (
            <p className="text-[11px] font-medium text-[#DC2626] dark:text-[#EF4444]" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Simulation Result KPI Matrix */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Nominal Diskon */}
        <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Potongan Diskon</p>
          <p className="mt-1 text-sm font-bold text-[#DC2626] tabular-nums dark:text-[#F87171]">
            - {formatIDR(discountAmount)}
          </p>
        </div>

        {/* Harga Bersih */}
        <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Harga Jual Bersih</p>
          <p className="mt-1 text-sm font-bold text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
            {formatIDR(netSellingPrice)}
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Laba Bersih per Unit</p>
          <p
            className={`mt-1 text-sm font-bold tabular-nums ${
              isLoss
                ? "text-[#DC2626] dark:text-[#F87171]"
                : "text-[#168A4E] dark:text-[#1EA65E]"
            }`}
          >
            {formatIDR(netProfit)}
          </p>
        </div>

        {/* Net Margin */}
        <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 text-xs dark:border-[#2B312E] dark:bg-[#111315]">
          <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Margin Bersih</p>
          <p
            className={`mt-1 text-sm font-bold tabular-nums ${
              isLoss
                ? "text-[#DC2626] dark:text-[#F87171]"
                : "text-[#168A4E] dark:text-[#1EA65E]"
            }`}
          >
            {formatPercent(netMarginPercent, 1)}
          </p>
        </div>
      </div>

      {/* Loss / Safety Warning Banner */}
      {isLoss ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A]/40 dark:text-[#FCA5A5]"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
          <div>
            <p className="font-bold">Peringatan: Jual Rugi (Margin Negatif)!</p>
            <p className="mt-0.5 text-[11px]">
              Harga bersih ({formatIDR(netSellingPrice)}) lebih rendah dari Full HPP produk ({formatIDR(fullHpp)}). Anda akan menanggung kerugian sebesar {formatIDR(Math.abs(netProfit))} per unit yang terjual.
            </p>
          </div>
        </div>
      ) : netMarginPercent < 20 ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FEF08A] bg-[#FEFCE8] p-3 text-xs text-[#854D0E] dark:border-[#713F12] dark:bg-[#422006]/40 dark:text-[#FDE047]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5" />
          <div>
            <p className="font-bold">Perhatian: Margin Sangat Tipis ({formatPercent(netMarginPercent, 1)})</p>
            <p className="mt-0.5 text-[11px]">
              Margin bersih di bawah 20% dapat rentan terhadap kenaikan harga bahan baku atau biaya operasional mendadak.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs text-[#10673C] dark:border-[#10673C33] dark:bg-[#10673C11] dark:text-[#1EA65E]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Margin aman: Diskon {discountPercent}% masih menghasilkan laba {formatIDR(netProfit)} per unit ({formatPercent(netMarginPercent, 1)}).</span>
        </div>
      )}

      {/* PRD Non-mutation Safety Note */}
      <div className="flex items-center gap-2 text-[11px] text-[#737B76] dark:text-[#98A09B]">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Kalkulasi ini adalah simulasi lokal dan tidak mengubah harga jual dasar produk di database.</span>
      </div>
    </Card>
  )
}
