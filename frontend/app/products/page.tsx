"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { listProducts } from "@/lib/api/catalog"
import type { Product } from "@/lib/types/api"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { formatIDR, formatPercent, parseDecimalToNumber } from "@/lib/format"
import { Header } from "@/components/header"
import { ProductActionsModal } from "@/components/products/product-actions-modal"
import { ProductModal } from "@/components/products/product-modal"
import { ProductImage } from "@/components/products/product-image"
import { EmptyState, ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function getProductMetrics(product: Product) {
  const variant = product.variants[0]
  const target = parseDecimalToNumber(variant?.target_margin_override ?? product.category?.target_margin) * 100

  return { target, variant }
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const query = useQuery({ queryKey: ["products"], queryFn: ({ signal }) => listProducts(signal) })
  const error = query.error instanceof ApiError ? query.error : null
  const products = (query.data?.data ?? []).filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.category?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <Header title="Daftar Produk" subtitle="Kelola katalog produk, resep, dan penetapan HPP produk aktif." />
      {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} />}
      <ProductActionsModal product={selectedProduct} isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} onUpdated={(product) => setSelectedProduct(product)} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-md"><Input placeholder="Cari produk atau kategori..." prefixNode={<Search className="h-4 w-4" />} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="w-full gap-2 bg-[#14804A] hover:bg-[#10673C] md:w-auto"><Plus className="h-4 w-4" />Tambah Produk</Button>
      </div>
      {query.isPending ? <LoadingSpinner label="Memuat produk..." /> : error ? <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} onRetry={() => query.refetch()} /> : <Card className="p-3 sm:p-4 lg:p-6">
        {products.length === 0 ? <div className="py-8"><EmptyState title={searchTerm ? "Produk Tidak Ditemukan" : "Belum Ada Produk"} description={searchTerm ? `Tidak ada produk yang cocok dengan pencarian "${searchTerm}".` : "Tambahkan produk pertama untuk mulai mengelola resep dan HPP."} action={searchTerm ? <Button size="sm" variant="outline" onClick={() => setSearchTerm("")}>Reset Pencarian</Button> : undefined} /></div> : <>
          <div className="space-y-3 xl:hidden">
            {products.map((product) => {
              const { target, variant } = getProductMetrics(product)

              return (
                <article key={product.id} className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 dark:border-[#2B312E] dark:bg-[#111315]">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/products/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-[#14804A]">
                      <ProductImage imageUrl={product.image_url} name={product.name} className="size-10 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#161A18] dark:text-[#FAFBFA]">{product.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#737B76]">{product.category?.name ?? "Tanpa kategori"}</span>
                      </span>
                    </Link>
                    <Badge variant={product.status === "ACTIVE" ? "success" : "outline"} className="shrink-0 text-[10px]">{product.status === "ACTIVE" ? "Aktif" : "Arsip"}</Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-[#E8ECE9] pt-3 dark:border-[#2B312E]">
                    <div>
                      <dt className="text-[11px] text-[#737B76]">Varian</dt>
                      <dd className="mt-1 text-xs font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">{product.variants.length}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-[#737B76]">Harga Jual</dt>
                      <dd className="mt-1 truncate text-xs font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">{formatIDR(variant?.selling_price)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-[#737B76]">Margin Target</dt>
                      <dd className="mt-1 text-xs font-bold tabular-nums text-[#14804A]">{formatPercent(target)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex gap-2 border-t border-[#E8ECE9] pt-3 dark:border-[#2B312E]">
                    <Button asChild type="button" variant="outline" size="sm" className="flex-1">
                      <Link href={`/products/${product.id}`}><ChevronRight className="h-3.5 w-3.5" />Detail</Link>
                    </Button>
                    <Button type="button" size="sm" onClick={() => setSelectedProduct(product)} className="flex-1 gap-1.5 bg-[#14804A] hover:bg-[#10673C]" aria-label={`Edit atau hapus ${product.name}`}>
                      <Pencil className="h-3.5 w-3.5" />Kelola
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                  <th scope="col" className="pb-3 pl-2 font-medium">Produk</th>
                  <th scope="col" className="pb-3 font-medium">Kategori</th>
                  <th scope="col" className="pb-3 text-right font-medium">Varian</th>
                  <th scope="col" className="pb-3 text-right font-medium">Harga Jual</th>
                  <th scope="col" className="pb-3 text-right font-medium">Margin Target</th>
                  <th scope="col" className="pb-3 text-center font-medium">Status</th>
                  <th scope="col" className="pb-3 pr-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
                {products.map((product) => {
                  const { target, variant } = getProductMetrics(product)

                  return (
                    <tr key={product.id} className="hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D]">
                      <td className="max-w-[18rem] py-3.5 pl-2 font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                        <Link href={`/products/${product.id}`} className="flex min-w-0 items-center gap-3 hover:text-[#14804A]">
                          <ProductImage imageUrl={product.image_url} name={product.name} className="size-9 shrink-0" />
                          <span className="truncate">{product.name}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 text-[#737B76]">{product.category?.name ?? "-"}</td>
                      <td className="py-3.5 text-right text-[#737B76]">{product.variants.length}</td>
                      <td className="py-3.5 text-right font-semibold tabular-nums">{formatIDR(variant?.selling_price)}</td>
                      <td className="py-3.5 text-right font-bold tabular-nums text-[#14804A]">{formatPercent(target)}</td>
                      <td className="py-3.5 text-center"><Badge variant={product.status === "ACTIVE" ? "success" : "outline"} className="text-[10px]">{product.status === "ACTIVE" ? "Aktif" : "Arsip"}</Badge></td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/products/${product.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#14804A] hover:underline">Detail<ChevronRight className="h-3.5 w-3.5" /></Link>
                          <Button type="button" variant="ghost" size="xs" onClick={() => setSelectedProduct(product)} className="gap-1 text-[#14804A] hover:text-[#10673C]" aria-label={`Edit atau hapus ${product.name}`}><Pencil className="h-3.5 w-3.5" /><Trash2 className="h-3.5 w-3.5" /><span>Kelola</span></Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>}
      </Card>}
    </div>
  )
}
