"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, History, Plus, Search } from "lucide-react"
import { listIngredients } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR } from "@/lib/format"
import { Header } from "@/components/header"
import { IngredientModal } from "@/components/ingredients/ingredient-modal"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const query = useQuery({ queryKey: ["ingredients"], queryFn: ({ signal }) => listIngredients(signal) })
  const error = query.error instanceof ApiError ? query.error : null
  const ingredients = (query.data?.data ?? []).filter((ingredient) => {
    const term = searchTerm.toLowerCase()
    return ingredient.name.toLowerCase().includes(term) || (ingredient.category ?? "").toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6 pb-12">
      <Header title="Bahan Baku & Konversi" subtitle="Kelola harga pembelian, konversi satuan dasar, dan histori perubahan harga." />
      <IngredientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-3"><Input placeholder="Cari bahan baku atau kategori..." prefixNode={<Search className="h-4 w-4" />} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#14804A] hover:bg-[#10673C]"><Plus className="h-4 w-4" />Tambah Bahan</Button>
      </div>

      {query.isPending ? <LoadingSpinner label="Memuat bahan baku..." /> : error ? <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => query.refetch()} /> : (
        <Card>
          {ingredients.length === 0 ? <div className="py-8"><EmptyState title={searchTerm ? "Bahan Baku Tidak Ditemukan" : "Belum Ada Bahan Baku"} description={searchTerm ? `Tidak ada bahan baku yang cocok dengan kata kunci "${searchTerm}".` : "Tambahkan bahan baku pertama untuk mulai menghitung HPP."} action={searchTerm ? <Button size="sm" variant="outline" onClick={() => setSearchTerm("")}>Reset Pencarian</Button> : undefined} /></div> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]"><th className="pb-3 pl-2 font-medium">Bahan Baku</th><th className="pb-3 font-medium">Kategori</th><th className="pb-3 text-right font-medium">Harga Efektif</th><th className="pb-3 text-right font-medium">Satuan Dasar</th><th className="pb-3 text-center font-medium">Pembaruan</th><th className="pb-3 pr-2 text-right font-medium">Aksi</th></tr></thead><tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
              {ingredients.map((item) => {
                const hasPrice = item.current_unit_cost !== null
                return <tr key={item.id} className="hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D]"><td className="py-3.5 pl-2 font-semibold text-[#161A18] dark:text-[#FAFBFA]">{item.name}</td><td className="py-3.5 text-[#737B76] dark:text-[#98A09B]">{item.category ?? "-"}</td><td className="py-3.5 text-right font-bold tabular-nums text-[#14804A] dark:text-[#1EA65E]">{formatIDR(item.current_unit_cost)} / {item.base_unit}</td><td className="py-3.5 text-right text-[#737B76] dark:text-[#98A09B]">{item.base_unit}</td><td className="py-3.5 text-center">{hasPrice ? <span className="text-[11px] text-[#737B76]">Tersedia</span> : <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E]"><AlertCircle className="h-3 w-3" />Belum ada harga</span>}</td><td className="py-3.5 pr-2 text-right"><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#737B76]"><History className="h-3.5 w-3.5" />Detail via API</span></td></tr>
              })}
            </tbody></table></div>
          )}
        </Card>
      )}
    </div>
  )
}
