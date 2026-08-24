"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, ApiError } from "@/lib/api/client"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { X } from "lucide-react"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ProductModal({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Minuman")
  const [variantName, setVariantName] = useState("Regular")
  const [sellingPrice, setSellingPrice] = useState("")
  const [packagingCost, setPackagingCost] = useState("0")
  const [directCost, setDirectCost] = useState("0")
  const [targetMargin, setTargetMargin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient("/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          variant: {
            name: variantName,
            selling_price: sellingPrice,
            packaging_cost: packagingCost,
            direct_cost: directCost,
            target_margin_override: targetMargin ? (parseFloat(targetMargin) / 100).toFixed(4) : null,
          },
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
            Tambah Produk Baru
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
              Nama Produk
            </label>
            <Input
              required
              placeholder="Contoh: Es Kopi Susu Aren"
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
                placeholder="Contoh: Minuman"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Nama Varian Awal
              </label>
              <Input
                required
                placeholder="Contoh: Regular / 16 oz"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 space-y-3 dark:border-[#2B312E] dark:bg-[#111315]">
            <p className="font-bold text-[#14804A] dark:text-[#1EA65E]">
              Harga & Biaya Langsung Varian
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Harga Jual (IDR)
                </label>
                <Input
                  required
                  type="number"
                  placeholder="18000"
                  prefixNode="Rp"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Target Margin Khusus (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="99.9"
                  placeholder="Default bisnis"
                  suffixNode="%"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Biaya Kemasan (IDR)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="850"
                  prefixNode="Rp"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#737B76]">
                  Biaya Langsung / TK (IDR)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="500"
                  prefixNode="Rp"
                  value={directCost}
                  onChange={(e) => setDirectCost(e.target.value)}
                />
              </div>
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
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
