"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Plus, Search, Filter, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/feedback/feedback-states"
import { formatIDR } from "@/lib/utils"

interface ProductItem {
  id: string
  name: string
  category: string
  sku: string
  hpp: number
  price: number
  margin: number
  status: "Aktif" | "Draft" | "Arsip"
  icon: string
}

const PRODUCTS: ProductItem[] = [
  {
    id: "1",
    name: "Es Kopi Susu Gula Aren - Medium",
    category: "Minuman",
    sku: "EKSGA-MED",
    hpp: 6380,
    price: 18000,
    margin: 64.6,
    status: "Aktif",
    icon: "🧋",
  },
  {
    id: "2",
    name: "Mie Ayam Spesial",
    category: "Makanan",
    sku: "MIE-SPS",
    hpp: 11200,
    price: 22000,
    margin: 49.1,
    status: "Aktif",
    icon: "🍜",
  },
  {
    id: "3",
    name: "Jus Stroberi Segar",
    category: "Minuman",
    sku: "JUS-STR",
    hpp: 7500,
    price: 15000,
    margin: 50.0,
    status: "Aktif",
    icon: "🍓",
  },
  {
    id: "4",
    name: "Croissant Butter",
    category: "Pastry",
    sku: "CRS-BTR",
    hpp: 9800,
    price: 24000,
    margin: 59.2,
    status: "Aktif",
    icon: "🥐",
  },
]

import { ProductModal } from "@/components/products/product-modal"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Daftar Produk"
        subtitle="Kelola katalog produk, resep, dan penetapan HPP produk aktif."
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Actions & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Cari produk atau SKU..."
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
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Products Table Card */}
      <Card>
        {filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="Produk Tidak Ditemukan"
              description={`Tidak ada produk yang cocok dengan pencarian "${searchTerm}".`}
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
                <th className="pb-3 pl-2 font-medium">Produk</th>
                <th className="pb-3 font-medium">Kategori</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 text-right font-medium">HPP</th>
                <th className="pb-3 text-right font-medium">Harga Jual</th>
                <th className="pb-3 text-right font-medium">Margin</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 pr-2 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
              {filtered.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-[#FAFBFA] transition-colors dark:hover:bg-[#1B201D]"
                >
                  <td className="py-3.5 pl-2 font-medium text-[#161A18] dark:text-[#FAFBFA]">
                    <Link
                      href={`/products/${prod.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F5F4] text-lg">
                        {prod.icon}
                      </span>
                      <span className="font-semibold group-hover:text-[#14804A] transition-colors">
                        {prod.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3.5 text-[#737B76] dark:text-[#98A09B]">
                    {prod.category}
                  </td>
                  <td className="py-3.5 font-mono text-[11px] text-[#737B76] dark:text-[#98A09B]">
                    {prod.sku}
                  </td>
                  <td className="py-3.5 text-right font-medium tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                    {formatIDR(prod.hpp)}
                  </td>
                  <td className="py-3.5 text-right font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                    {formatIDR(prod.price)}
                  </td>
                  <td className="py-3.5 text-right font-bold tabular-nums text-[#14804A] dark:text-[#1EA65E]">
                    {prod.margin}%
                  </td>
                  <td className="py-3.5 text-center">
                    <Badge variant="success" className="text-[10px]">
                      {prod.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <Link
                      href={`/products/${prod.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#14804A] hover:underline"
                    >
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
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
