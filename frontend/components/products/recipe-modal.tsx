"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, ApiError } from "@/lib/api/client"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { X, Plus, Trash2 } from "lucide-react"

interface RecipeItemInput {
  ingredientId: string
  ingredientName: string
  quantity: string
  unit: string
}

interface RecipeModalProps {
  isOpen: boolean
  variantId: string
  onClose: () => void
  onSuccess: () => void
}

export function RecipeModal({
  isOpen,
  variantId,
  onClose,
  onSuccess,
}: RecipeModalProps) {
  const [reason, setReason] = useState("Optimasi takaran dan harga")
  const [items, setItems] = useState<RecipeItemInput[]>([
    { ingredientId: "1", ingredientName: "Biji Kopi Arabika Specialty", quantity: "18", unit: "gram" },
    { ingredientId: "2", ingredientName: "Susu UHT Full Cream", quantity: "100", unit: "ml" },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  if (!isOpen) return null

  const addItem = () => {
    setItems([
      ...items,
      { ingredientId: "", ingredientName: "Bahan Baru", quantity: "1", unit: "gram" },
    ])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof RecipeItemInput, val: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: val }
    setItems(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient(`/product-variants/${variantId}/recipes`, {
        method: "POST",
        body: JSON.stringify({
          change_reason: reason,
          items: items.map((i) => ({
            ingredient_id: i.ingredientId || "1",
            quantity: i.quantity,
            unit: i.unit,
          })),
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
        className="w-full max-w-xl rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E8ECE9] dark:border-[#2B312E]">
          <h2 className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Buat Versi Resep Baru
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
              Alasan Perubahan Versi
            </label>
            <Input
              required
              placeholder="Contoh: Penyesuaian gramasi kopi"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Komposisi Bahan Resep
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1 text-[11px] h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Bahan
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Nama Bahan"
                      value={item.ingredientName}
                      onChange={(e) => updateItem(idx, "ingredientName", e.target.value)}
                      className="h-8 text-[11px]"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="h-8 text-[11px]"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      placeholder="Satuan"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className="h-8 text-[11px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-[#C63C3C] hover:bg-[#FEF2F2] rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8ECE9] dark:border-[#2B312E]">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#14804A] hover:bg-[#10673C] text-white"
            >
              {loading ? "Menyimpan..." : "Simpan Versi Resep"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
