"use client"

import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { X } from "lucide-react"
import { createProduct } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"

interface ProductFormValues {
  name: string
  category: string
  variantName: string
  sellingPrice: string
  packagingCost: string
  directCost: string
  targetMargin: string
}
interface ProductModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void }
const DEFAULT_VALUES: ProductFormValues = { name: "", category: "Minuman", variantName: "Regular", sellingPrice: "", packagingCost: "0", directCost: "0", targetMargin: "" }

export function ProductModal({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const queryClient = useQueryClient()
  const form = useForm<ProductFormValues>({ defaultValues: DEFAULT_VALUES })
  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => createProduct({ name: values.name, category: values.category, variant: { name: values.variantName, selling_price: values.sellingPrice, packaging_cost: values.packagingCost || "0", direct_cost: values.directCost || "0", target_margin_override: values.targetMargin ? (Number(values.targetMargin) / 100).toFixed(4) : null } }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["products"] }); form.reset(DEFAULT_VALUES); onSuccess() },
  })
  const error = mutation.error instanceof ApiError ? mutation.error : null
  useEffect(() => { if (isOpen) form.reset(DEFAULT_VALUES) }, [form, isOpen])
  if (!isOpen) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"><div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="w-full max-w-lg rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"><div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]"><h2 id="product-modal-title" className="text-base font-bold">Tambah Produk Baru</h2><button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4]"><X className="h-4 w-4" /></button></div>{error && <div className="mt-4"><ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} /></div>}<form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-4 space-y-4 text-xs"><div className="space-y-1.5"><label htmlFor="product-name" className="font-semibold">Nama Produk</label><Input id="product-name" placeholder="Contoh: Es Kopi Susu Aren" {...form.register("name", { required: "Nama produk wajib diisi." })} />{form.formState.errors.name && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.name.message}</p>}</div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label htmlFor="product-category" className="font-semibold">Kategori</label><Input id="product-category" {...form.register("category", { required: "Kategori wajib diisi." })} /></div><div className="space-y-1.5"><label htmlFor="variant-name" className="font-semibold">Nama Varian Awal</label><Input id="variant-name" {...form.register("variantName", { required: "Nama varian wajib diisi." })} /></div></div><div className="space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 dark:border-[#2B312E] dark:bg-[#111315]"><p className="font-bold text-[#14804A]">Harga & Biaya Varian</p><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label htmlFor="selling-price" className="text-[11px] font-medium">Harga Jual (IDR)</label><Input id="selling-price" type="number" min="0" step="any" prefixNode="Rp" {...form.register("sellingPrice", { required: "Harga jual wajib diisi.", validate: (value) => Number(value) >= 0 || "Harga tidak valid." })} /></div><div className="space-y-1"><label htmlFor="target-margin" className="text-[11px] font-medium">Target Margin (%)</label><Input id="target-margin" type="number" min="0" max="99.9" step="0.1" suffixNode="%" {...form.register("targetMargin", { validate: (value) => !value || (Number(value) >= 0 && Number(value) < 100) || "Margin harus 0-99.9%." })} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label htmlFor="packaging-cost" className="text-[11px] font-medium">Biaya Kemasan</label><Input id="packaging-cost" type="number" min="0" step="any" prefixNode="Rp" {...form.register("packagingCost")} /></div><div className="space-y-1"><label htmlFor="direct-cost" className="text-[11px] font-medium">Biaya Langsung</label><Input id="direct-cost" type="number" min="0" step="any" prefixNode="Rp" {...form.register("directCost")} /></div></div></div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button><Button type="submit" size="sm" disabled={mutation.isPending} className="bg-[#14804A] text-white hover:bg-[#10673C]">{mutation.isPending ? "Menyimpan..." : "Simpan Produk"}</Button></div></form></div></div>
}
