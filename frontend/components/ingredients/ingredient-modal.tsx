"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, ApiError } from "@/lib/api/client"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { X } from "lucide-react"

interface IngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function IngredientModal({
  isOpen,
  onClose,
  onSuccess,
}: IngredientModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Bahan Pokok")
  const [baseUnit, setBaseUnit] = useState("gram")
  const [purchaseUnit, setPurchaseUnit] = useState("kg")
  const [conversionFactor, setConversionFactor] = useState("1000")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient("/ingredients", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          base_unit: baseUnit,
          purchase_unit: purchaseUnit,
          conversion_factor: parseFloat(conversionFactor) || 1,
          initial_price: purchasePrice,
        }),
      })
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        onSuccess()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E8ECE9] dark:border-[#2B312E]">
          <h2 className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Tambah Bahan Baku Baru
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4] dark:text-[#98A09B]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorBanner code={error.code} message={error.message} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Nama Bahan Baku
            </label>
            <Input
              required
              placeholder="Contoh: Biji Kopi Arabika"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Kategori
              </label>
              <Input
                required
                placeholder="Contoh: Bahan Pokok"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Satuan Dasar Resep
              </label>
              <Input
                required
                placeholder="Contoh: gram atau ml"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 space-y-3 dark:border-[#2B312E] dark:bg-[#111315]">
            <p className="font-bold text-[#14804A] dark:text-[#1EA65E]">
              Konversi & Harga Beli
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Satuan Beli (Vendor)
                </label>
                <Input
                  required
                  placeholder="Contoh: kg atau liter"
                  value={purchaseUnit}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Faktor Konversi (1 Beli = ... Dasar)
                </label>
                <Input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  placeholder="1000"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#737B76]">
                Harga Beli per Satuan Beli (IDR)
              </label>
              <Input
                required
                type="number"
                min="0"
                placeholder="90000"
                prefixNode="Rp"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#14804A] hover:bg-[#10673C] text-white"
            >
              {loading ? "Menyimpan..." : "Simpan Bahan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
