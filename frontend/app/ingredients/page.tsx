"use client"

import React, { useState } from "react"
import { Plus, Search, Filter, History, AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/feedback/feedback-states"
import { formatIDR } from "@/lib/utils"

interface Ingredient {
  id: string
  name: string
  category: string
  baseUnit: string
  purchaseUnit: string
  conversionFactor: number
  pricePerPurchaseUnit: number
  pricePerBaseUnit: number
  lastUpdated: string
  isStale?: boolean
}

const INGREDIENTS: Ingredient[] = [
  {
    id: "1",
    name: "Biji Kopi Arabika Specialty",
    category: "Bahan Pokok",
    baseUnit: "gram",
    purchaseUnit: "kg",
    conversionFactor: 1000,
    pricePerPurchaseUnit: 90000,
    pricePerBaseUnit: 90,
    lastUpdated: "3 hari lalu",
  },
  {
    id: "2",
    name: "Susu UHT Full Cream",
    category: "Bahan Pokok",
    baseUnit: "ml",
    purchaseUnit: "liter",
    conversionFactor: 1000,
    pricePerPurchaseUnit: 18000,
    pricePerBaseUnit: 18,
    lastUpdated: "12 Mei 2025",
  },
  {
    id: "3",
    name: "Gula Aren Cair Organik",
    category: "Pemanis",
    baseUnit: "ml",
    purchaseUnit: "liter",
    conversionFactor: 1000,
    pricePerPurchaseUnit: 60000,
    pricePerBaseUnit: 60,
    lastUpdated: "14 hari lalu",
    isStale: true,
  },
  {
    id: "4",
    name: "Cup Plastik 16oz Sablon + Tutup",
    category: "Kemasan",
    baseUnit: "pcs",
    purchaseUnit: "slop (50 pcs)",
    conversionFactor: 50,
    pricePerPurchaseUnit: 40000,
    pricePerBaseUnit: 800,
    lastUpdated: "1 minggu lalu",
  },
  {
    id: "5",
    name: "Es Batu Kristal Higienis",
    category: "Bahan Penolong",
    baseUnit: "gram",
    purchaseUnit: "karung (10 kg)",
    conversionFactor: 10000,
    pricePerPurchaseUnit: 100000,
    pricePerBaseUnit: 10,
    lastUpdated: "Kemarin",
  },
]

import { IngredientModal } from "@/components/ingredients/ingredient-modal"

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = INGREDIENTS.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Bahan Baku & Konversi"
        subtitle="Kelola harga pembelian, konversi satuan dasar, dan histori perubahan harga."
      />

      <IngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Actions & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Cari bahan baku atau kategori..."
            prefixNode={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4 text-[#737B76]" />
            Filter
          </Button>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-[#14804A] hover:bg-[#10673C]"
          >
            <Plus className="h-4 w-4" />
            Tambah Bahan
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        {filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="Bahan Baku Tidak Ditemukan"
              description={`Tidak ada bahan baku yang cocok dengan kata kunci "${searchTerm}".`}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="text-xs"
                >
                  Reset Pencarian
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                  <th className="pb-3 pl-2 font-medium">Bahan Baku</th>
                  <th className="pb-3 font-medium">Kategori</th>
                  <th className="pb-3 font-medium">Satuan Beli</th>
                  <th className="pb-3 text-right font-medium">Harga Beli</th>
                  <th className="pb-3 text-right font-medium">Satuan Resep</th>
                  <th className="pb-3 text-right font-medium">Biaya per Satuan</th>
                  <th className="pb-3 font-medium text-center">Pembaruan</th>
                  <th className="pb-3 pr-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAFBFA] transition-colors dark:hover:bg-[#1B201D]"
                  >
                    <td className="py-3.5 pl-2 font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                      {item.name}
                    </td>
                    <td className="py-3.5 text-[#737B76] dark:text-[#98A09B]">
                      {item.category}
                    </td>
                    <td className="py-3.5 text-[#161A18] dark:text-[#FAFBFA]">
                      {item.purchaseUnit}
                    </td>
                    <td className="py-3.5 text-right font-medium tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                      {formatIDR(item.pricePerPurchaseUnit)}
                    </td>
                    <td className="py-3.5 text-right text-[#737B76] dark:text-[#98A09B]">
                      {item.baseUnit}
                    </td>
                    <td className="py-3.5 text-right font-bold tabular-nums text-[#14804A] dark:text-[#1EA65E]">
                      {formatIDR(item.pricePerBaseUnit)} / {item.baseUnit}
                    </td>
                    <td className="py-3.5 text-center">
                      {item.isStale ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E] dark:bg-[#78350F33] dark:text-[#FBBF24]">
                          <AlertCircle className="h-3 w-3" />
                          {item.lastUpdated}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                          {item.lastUpdated}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#14804A] hover:underline">
                        <History className="h-3.5 w-3.5" />
                        Histori
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
