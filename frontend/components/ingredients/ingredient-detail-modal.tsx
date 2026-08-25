"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { History, Pencil, Trash2, X } from "lucide-react"
import { deleteIngredientPrice, getIngredient, updateIngredient } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { formatIDR, parseDecimalToNumber } from "@/lib/format"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { useToast } from "@/components/feedback/toast-provider"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface IngredientDetailModalProps {
  ingredientId: string | null
  isOpen: boolean
  onClose: () => void
}

interface IngredientEditValues {
  name: string
}

function formatQuantity(value: string): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 }).format(
    parseDecimalToNumber(value)
  )
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function IngredientDetailModal({
  ingredientId,
  isOpen,
  onClose,
}: IngredientDetailModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const form = useForm<IngredientEditValues>({ defaultValues: { name: "" } })
  const ingredientQuery = useQuery({
    queryKey: ["ingredient", ingredientId],
    queryFn: ({ signal }) => getIngredient(ingredientId as string, signal),
    enabled: isOpen && Boolean(ingredientId),
  })

  useEffect(() => {
    if (ingredientQuery.data) form.reset({ name: ingredientQuery.data.name })
  }, [form, ingredientQuery.data])

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
      queryClient.invalidateQueries({ queryKey: ["ingredient", ingredientId] }),
    ])
  }

  const updateMutation = useMutation({
    mutationFn: (values: IngredientEditValues) =>
      updateIngredient(ingredientId as string, { name: values.name }),
    onSuccess: async () => {
      await refreshQueries()
      toast({
        variant: "success",
        title: "Nama bahan diperbarui",
        description: "Nama bahan baku berhasil disimpan.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (priceHistoryId: string) =>
      deleteIngredientPrice(ingredientId as string, priceHistoryId),
    onSuccess: async () => {
      await refreshQueries()
      toast({
        variant: "success",
        title: "Histori harga dihapus",
        description: "Harga efektif akan mengikuti histori tersisa.",
      })
    },
  })

  const apiError = ingredientQuery.error instanceof ApiError
    ? ingredientQuery.error
    : updateMutation.error instanceof ApiError
      ? updateMutation.error
      : deleteMutation.error instanceof ApiError
        ? deleteMutation.error
        : null
  const isPending = updateMutation.isPending || deleteMutation.isPending
  const ingredient = ingredientQuery.data

  const handleDelete = (priceHistoryId: string) => {
    if (!window.confirm("Hapus histori harga ini? Jika ini harga terakhir, bahan baku tidak memiliki harga efektif.")) return
    deleteMutation.mutate(priceHistoryId)
  }

  if (!isOpen || !ingredientId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-detail-modal-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"
      >
        <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]">
          <div>
            <p className="text-[11px] font-medium text-[#737B76]">Bahan Baku</p>
            <h2 id="ingredient-detail-modal-title" className="text-base font-bold text-[#161A18] dark:text-[#FAFBFA]">
              Detail & Histori Harga
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4]" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        {apiError && (
          <div className="mt-4">
            <ErrorBanner code={apiError.code} message={mapSemanticErrorToMessage(apiError.code, apiError.message)} />
          </div>
        )}

        {ingredientQuery.isPending ? (
          <LoadingSpinner label="Memuat detail bahan baku..." />
        ) : !ingredient ? (
          <div className="mt-4">
            <EmptyState title="Bahan baku tidak ditemukan" description="Data mungkin sudah diarsipkan atau tidak lagi tersedia." />
          </div>
        ) : (
          <div className="mt-4 space-y-5 text-xs">
            <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-2">
              <label htmlFor="ingredient-detail-name" className="font-semibold">Nama Bahan Baku</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="ingredient-detail-name"
                  {...form.register("name", { required: "Nama bahan wajib diisi." })}
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

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 dark:border-[#2B312E] dark:bg-[#111315] sm:grid-cols-3">
              <Summary label="Kategori" value={ingredient.category ?? "-"} />
              <Summary label="Satuan Dasar" value={ingredient.base_unit} />
              <Summary label="Harga Efektif" value={ingredient.current_unit_cost === null ? "-" : formatIDR(ingredient.current_unit_cost)} />
            </div>

            <section aria-labelledby="ingredient-price-history-title" className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E8ECE9] pb-2 dark:border-[#2B312E]">
                <History className="h-4 w-4 text-[#14804A]" />
                <h3 id="ingredient-price-history-title" className="font-bold">Histori Harga</h3>
              </div>
              {ingredient.price_history?.length ? (
                <div className="space-y-2">
                  {ingredient.price_history.map((history) => (
                    <article key={history.id} className="flex flex-col gap-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 dark:border-[#2B312E] dark:bg-[#111315] sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{formatIDR(history.unit_cost)} / {ingredient.base_unit}</p>
                        <p className="text-[11px] text-[#737B76]">
                          Beli {formatIDR(history.purchase_price)} · {formatQuantity(history.purchase_quantity)} {history.purchase_unit} · Efektif {formatDateTime(history.effective_at)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        onClick={() => handleDelete(history.id)}
                        disabled={isPending}
                        aria-label={`Hapus histori harga ${formatDateTime(history.effective_at)}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Belum ada histori harga" description="Tambahkan harga beli melalui endpoint katalog sebelum menghapus atau mengganti histori." className="p-5" />
              )}
            </section>

            <div className="flex justify-end border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Tutup</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#737B76]">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  )
}
