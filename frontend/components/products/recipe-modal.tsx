"use client"

import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, X } from "lucide-react"
import { listIngredients, createRecipe } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"

interface RecipeFormValues { change_reason: string; items: Array<{ ingredient_id: string; quantity: string; unit: string }> }
interface RecipeModalProps { isOpen: boolean; variantId: string; onClose: () => void; onSuccess: () => void }

export function RecipeModal({ isOpen, variantId, onClose, onSuccess }: RecipeModalProps) {
  const queryClient = useQueryClient()
  const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: ({ signal }) => listIngredients(signal), enabled: isOpen })
  const form = useForm<RecipeFormValues>({ defaultValues: { change_reason: "", items: [{ ingredient_id: "", quantity: "", unit: "" }] } })
  const fieldArray = useFieldArray({ control: form.control, name: "items" })
  const mutation = useMutation({
    mutationFn: (values: RecipeFormValues) => createRecipe(variantId, values),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["recipes", variantId] }); form.reset({ change_reason: "", items: [{ ingredient_id: "", quantity: "", unit: "" }] }); onSuccess(); onClose() },
  })
  const error = mutation.error instanceof ApiError ? mutation.error : null
  useEffect(() => { if (isOpen) form.reset({ change_reason: "", items: [{ ingredient_id: ingredientsQuery.data?.data[0]?.id ?? "", quantity: "", unit: ingredientsQuery.data?.data[0]?.base_unit ?? "" }] }) }, [form, ingredientsQuery.data, isOpen])
  if (!isOpen) return null
  const ingredients = ingredientsQuery.data?.data ?? []

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"><div role="dialog" aria-modal="true" aria-labelledby="recipe-modal-title" className="w-full max-w-xl rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"><div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]"><h2 id="recipe-modal-title" className="text-base font-bold">Buat Versi Resep Baru</h2><button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4]"><X className="h-4 w-4" /></button></div>{error && <div className="mt-4"><ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} /></div>}{ingredientsQuery.isPending ? <LoadingSpinner label="Memuat pilihan bahan..." /> : <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-4 space-y-4 text-xs"><div className="space-y-1.5"><label htmlFor="recipe-reason" className="font-semibold">Alasan Perubahan Versi</label><Input id="recipe-reason" placeholder="Contoh: Penyesuaian gramasi kopi" {...form.register("change_reason")} /></div><div className="space-y-2"><div className="flex items-center justify-between"><span className="font-semibold">Komposisi Bahan Resep</span><Button type="button" variant="outline" size="sm" onClick={() => fieldArray.append({ ingredient_id: ingredients[0]?.id ?? "", quantity: "", unit: ingredients[0]?.base_unit ?? "" })} className="h-7 gap-1 text-[11px]"><Plus className="h-3.5 w-3.5" />Tambah Bahan</Button></div><div className="max-h-60 space-y-2 overflow-y-auto pr-1">{fieldArray.fields.map((field, index) => <div key={field.id} className="grid grid-cols-[1fr_90px_80px_32px] items-start gap-2 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]"><div><label htmlFor={`recipe-ingredient-${index}`} className="sr-only">Bahan</label><select id={`recipe-ingredient-${index}`} className="h-8 w-full rounded-lg border border-[#E8ECE9] bg-white px-2 text-[11px] dark:border-[#2B312E] dark:bg-[#161A18]" {...form.register(`items.${index}.ingredient_id`, { required: "Pilih bahan." })}>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select></div><div><label htmlFor={`recipe-quantity-${index}`} className="sr-only">Jumlah</label><Input id={`recipe-quantity-${index}`} type="number" min="0.000001" step="any" className="h-8 text-[11px]" placeholder="Qty" {...form.register(`items.${index}.quantity`, { required: "Wajib.", validate: (value) => Number(value) > 0 || "Harus > 0." })} /></div><div><label htmlFor={`recipe-unit-${index}`} className="sr-only">Satuan</label><Input id={`recipe-unit-${index}`} className="h-8 text-[11px]" placeholder="Satuan" {...form.register(`items.${index}.unit`, { required: "Wajib." })} /></div><button type="button" onClick={() => fieldArray.remove(index)} disabled={fieldArray.fields.length === 1} className="mt-1 rounded-lg p-1.5 text-[#C63C3C] disabled:opacity-40" aria-label="Hapus bahan"><Trash2 className="h-4 w-4" /></button></div>)}</div></div><div className="flex justify-end gap-3 border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]"><Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button><Button type="submit" size="sm" disabled={mutation.isPending || ingredients.length === 0} className="bg-[#14804A] text-white hover:bg-[#10673C]">{mutation.isPending ? "Menyimpan..." : "Simpan Versi Resep"}</Button></div></form>}</div></div>
}
