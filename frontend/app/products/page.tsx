"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, Plus, Search } from "lucide-react"
import { listProducts } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import { Header } from "@/components/header"
import { ProductModal } from "@/components/products/product-modal"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const query = useQuery({ queryKey: ["products"], queryFn: ({ signal }) => listProducts(signal) })
  const error = query.error instanceof ApiError ? query.error : null
  const products = (query.data?.data ?? []).filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.category?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()))

  return <div className="space-y-6 pb-12"><Header title="Daftar Produk" subtitle="Kelola katalog produk, resep, dan penetapan HPP produk aktif." /><ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} /><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex max-w-md flex-1 items-center gap-3"><Input placeholder="Cari produk atau kategori..." prefixNode={<Search className="h-4 w-4" />} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div><Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#14804A] hover:bg-[#10673C]"><Plus className="h-4 w-4" />Tambah Produk</Button></div>{query.isPending ? <LoadingSpinner label="Memuat produk..." /> : error ? <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => query.refetch()} /> : <Card>{products.length === 0 ? <div className="py-8"><EmptyState title={searchTerm ? "Produk Tidak Ditemukan" : "Belum Ada Produk"} description={searchTerm ? `Tidak ada produk yang cocok dengan pencarian "${searchTerm}".` : "Tambahkan produk pertama untuk mulai mengelola resep dan HPP."} action={searchTerm ? <Button size="sm" variant="outline" onClick={() => setSearchTerm("")}>Reset Pencarian</Button> : undefined} /></div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]"><th className="pb-3 pl-2 font-medium">Produk</th><th className="pb-3 font-medium">Kategori</th><th className="pb-3 text-right font-medium">Varian</th><th className="pb-3 text-right font-medium">Harga Jual</th><th className="pb-3 text-right font-medium">Margin Target</th><th className="pb-3 text-center font-medium">Status</th><th className="pb-3 pr-2 text-right font-medium">Aksi</th></tr></thead><tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">{products.map((product) => { const variant = product.variants[0]; const target = parseDecimalToNumber(variant?.target_margin_override ?? product.category?.target_margin) * 100; return <tr key={product.id} className="hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D]"><td className="py-3.5 pl-2 font-semibold text-[#161A18] dark:text-[#FAFBFA]"><Link href={`/products/${product.id}`} className="flex items-center gap-3 hover:text-[#14804A]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F5F4] text-lg">●</span>{product.name}</Link></td><td className="py-3.5 text-[#737B76]">{product.category?.name ?? "-"}</td><td className="py-3.5 text-right text-[#737B76]">{product.variants.length}</td><td className="py-3.5 text-right font-semibold tabular-nums">{formatIDR(variant?.selling_price)}</td><td className="py-3.5 text-right font-bold tabular-nums text-[#14804A]">{formatPercent(target)}</td><td className="py-3.5 text-center"><Badge variant={product.status === "ACTIVE" ? "success" : "outline"} className="text-[10px]">{product.status === "ACTIVE" ? "Aktif" : "Arsip"}</Badge></td><td className="py-3.5 pr-2 text-right"><Link href={`/products/${product.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#14804A] hover:underline">Detail<ChevronRight className="h-3.5 w-3.5" /></Link></td></tr> })}</tbody></table></div>}</Card>}</div>
}
