"use client"

import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Archive, Pencil, X } from "lucide-react"
import type { Product } from "@/lib/types/api"
import { archiveProduct, updateProduct } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { useToast } from "@/components/feedback/toast-provider"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductActionsModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onUpdated: (product: Product) => void
}

interface ProductEditValues {
  name: string
}

export function ProductActionsModal({ product, isOpen, onClose, onUpdated }: ProductActionsModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const form = useForm<ProductEditValues>({ defaultValues: { name: "" } })
  const productId = product?.id ?? ""

  useEffect(() => {
    if (product) form.reset({ name: product.name })
  }, [form, product])

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["product", productId] }),
    ])
  }

  const updateMutation = useMutation({
    mutationFn: (values: ProductEditValues) => updateProduct(productId, { name: values.name }),
    onSuccess: async (updatedProduct) => {
      await refreshQueries()
      form.reset({ name: updatedProduct.name })
      onUpdated(updatedProduct)
      toast({
        variant: "success",
        title: "Nama produk diperbarui",
        description: "Nama produk berhasil disimpan.",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveProduct(productId),
    onSuccess: async () => {
      await refreshQueries()
      toast({
        variant: "success",
        title: "Produk dihapus",
        description: "Produk diarsipkan dan tidak lagi tampil di daftar aktif.",
      })
      onClose()
    },
  })

  const error = updateMutation.error instanceof ApiError
    ? updateMutation.error
    : archiveMutation.error instanceof ApiError
      ? archiveMutation.error
      : null
  const isPending = updateMutation.isPending || archiveMutation.isPending

  const handleClose = () => {
    if (!isPending) onClose()
  }

  const handleArchive = () => {
    if (!product) return
    if (!window.confirm(`Hapus produk "${product.name}"? Produk akan diarsipkan, sementara resep dan histori HPP tetap tersimpan.`)) return
    archiveMutation.mutate()
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-actions-modal-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"
      >
        <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]">
          <div>
            <p className="text-[11px] font-medium text-[#737B76]">Produk</p>
            <h2 id="product-actions-modal-title" className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">Edit &amp; Hapus Produk</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} />
          </div>
        )}

        <div className="mt-4 space-y-5 text-xs">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 dark:border-[#2B312E] dark:bg-[#111315]">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#161A18] dark:text-[#FAFBFA]">{product.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-[#737B76]">{product.category?.name ?? "Tanpa kategori"}</p>
            </div>
            <Badge variant="success">Aktif</Badge>
          </div>

          <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-2">
            <label htmlFor="product-actions-name" className="font-semibold">Nama Produk</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="product-actions-name"
                {...form.register("name", {
                  required: "Nama produk wajib diisi.",
                  validate: (value) => Boolean(value.trim()) || "Nama produk wajib diisi.",
                })}
                disabled={isPending}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={isPending} className="sm:self-stretch">
                <Pencil className="h-3.5 w-3.5" />
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Nama"}
              </Button>
            </div>
            {form.formState.errors.name && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.name.message}</p>}
          </form>

          <section className="space-y-2 rounded-xl border border-[#FECACA] bg-[#FFF7F7] p-3 text-[#991B1B] dark:border-[#5C2727] dark:bg-[#2A1717] dark:text-[#FCA5A5]" aria-labelledby="product-archive-title">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <h3 id="product-archive-title" className="font-bold">Hapus Produk</h3>
            </div>
            <p className="text-[11px]">Produk akan diarsipkan dari daftar aktif. Resep dan histori HPP tetap aman.</p>
            <Button type="button" variant="destructive" size="sm" onClick={handleArchive} disabled={isPending}>
              <Archive className="h-3.5 w-3.5" />
              {archiveMutation.isPending ? "Menghapus..." : "Hapus Produk"}
            </Button>
          </section>

          <div className="flex justify-end border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Tutup</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
