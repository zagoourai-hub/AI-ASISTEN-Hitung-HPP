"use client"

import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { X } from "lucide-react"
import { createIngredient, type IngredientCreatePayload } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"

interface IngredientFormValues extends IngredientCreatePayload {
  category: string
  base_unit: string
  purchase_unit: string
  conversion_factor: string
  initial_price: string
}

interface IngredientModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void }

const DEFAULT_VALUES: IngredientFormValues = { name: "", category: "Bahan Pokok", base_unit: "gram", purchase_unit: "kg", conversion_factor: "1000", initial_price: "" }

export function IngredientModal({ isOpen, onClose, onSuccess }: IngredientModalProps) {
  const queryClient = useQueryClient()
  const form = useForm<IngredientFormValues>({ defaultValues: DEFAULT_VALUES })
  const mutation = useMutation({
    mutationFn: (values: IngredientFormValues) => createIngredient({ ...values, initial_price: values.initial_price || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      form.reset(DEFAULT_VALUES)
      onSuccess()
    },
  })
  const error = mutation.error instanceof ApiError ? mutation.error : null

  useEffect(() => { if (isOpen) form.reset(DEFAULT_VALUES) }, [form, isOpen])
  if (!isOpen) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"><div role="dialog" aria-modal="true" aria-labelledby="ingredient-modal-title" className="w-full max-w-lg rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"><div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]"><h2 id="ingredient-modal-title" className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">Tambah Bahan Baku Baru</h2><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4]" aria-label="Tutup"><X className="h-4 w-4" /></button></div>
    {error && <div className="mt-4"><ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} /></div>}
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-4 space-y-4 text-xs"><div className="space-y-1.5"><label htmlFor="ingredient-name" className="font-semibold">Nama Bahan Baku</label><Input id="ingredient-name" placeholder="Contoh: Biji Kopi Arabika" {...form.register("name", { required: "Nama bahan wajib diisi." })} />{form.formState.errors.name && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.name.message}</p>}</div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label htmlFor="ingredient-category" className="font-semibold">Kategori</label><Input id="ingredient-category" {...form.register("category")} /></div><div className="space-y-1.5"><label htmlFor="ingredient-base-unit" className="font-semibold">Satuan Dasar Resep</label><Input id="ingredient-base-unit" {...form.register("base_unit", { required: "Satuan dasar wajib diisi." })} />{form.formState.errors.base_unit && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.base_unit.message}</p>}</div></div><div className="space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 dark:border-[#2B312E] dark:bg-[#111315]"><p className="font-bold text-[#14804A]">Konversi & Harga Beli</p><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label htmlFor="ingredient-purchase-unit" className="text-[11px] font-medium">Satuan Beli</label><Input id="ingredient-purchase-unit" {...form.register("purchase_unit", { required: "Satuan beli wajib diisi." })} /></div><div className="space-y-1"><label htmlFor="ingredient-factor" className="text-[11px] font-medium">Faktor Konversi</label><Input id="ingredient-factor" type="number" min="0.000001" step="any" {...form.register("conversion_factor", { required: "Faktor konversi wajib diisi.", validate: (value) => Number(value) > 0 || "Faktor harus lebih besar dari 0." })} /></div></div><div className="space-y-1"><label htmlFor="ingredient-price" className="text-[11px] font-medium">Harga Beli per Satuan (IDR)</label><Input id="ingredient-price" type="number" min="0.01" step="any" prefixNode="Rp" {...form.register("initial_price", { required: "Harga beli wajib diisi.", validate: (value) => Number(value) > 0 || "Harga harus lebih besar dari 0." })} />{form.formState.errors.initial_price && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.initial_price.message}</p>}</div></div><div className="flex items-center justify-end gap-3 pt-2"><Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button><Button type="submit" size="sm" disabled={mutation.isPending} className="bg-[#14804A] text-white hover:bg-[#10673C]">{mutation.isPending ? "Menyimpan..." : "Simpan Bahan"}</Button></div></form>
  </div></div>
}
