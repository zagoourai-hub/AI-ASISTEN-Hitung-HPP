"use client"

import React from "react"
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState, LoadingSpinner, ErrorBanner } from "@/components/feedback/feedback-states"
import { formatIDR, parseDecimalToNumber } from "@/lib/format"
import type { ProductCostVersion, PaginationMeta } from "@/lib/types/api"

interface HppHistoryTableProps {
  history: ProductCostVersion[]
  meta?: PaginationMeta
  isLoading?: boolean
  error?: string | null
  onPageChange?: (page: number) => void
  onRetry?: () => void
}

export function HppHistoryTable({
  history,
  meta = { page: 1, pageSize: 20, total: 0 },
  isLoading = false,
  error = null,
  onPageChange,
  onRetry,
}: HppHistoryTableProps) {
  if (isLoading) {
    return (
      <Card className="p-8">
        <LoadingSpinner label="Memuat riwayat kalkulasi HPP..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <ErrorBanner message={error} onRetry={onRetry} />
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Riwayat HPP"
        description="Riwayat perhitungan HPP akan tercatat otomatis setiap kali Anda melakukan kalkulasi ulang HPP."
      />
    )
  }

  const totalPages = Math.ceil(meta.total / meta.pageSize) || 1

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
          <div>
            <CardTitle>Histori Perhitungan HPP</CardTitle>
            <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
              Catatan audit versi HPP deterministik berdasarkan harga efektif bahan baku.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {meta.total} Catatan
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8ECE9] text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                <th className="pb-2.5 font-medium">Versi</th>
                <th className="pb-2.5 font-medium">Waktu Hitung</th>
                <th className="pb-2.5 font-medium">Price As Of</th>
                <th className="pb-2.5 text-right font-medium">Bahan Baku</th>
                <th className="pb-2.5 text-right font-medium">Kemasan</th>
                <th className="pb-2.5 text-right font-medium">Biaya Langsung</th>
                <th className="pb-2.5 text-right font-medium">Overhead</th>
                <th className="pb-2.5 text-right font-medium">Full HPP</th>
                <th className="pb-2.5 text-right font-medium">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
              {history.map((item, index) => {
                const fullHpp = parseDecimalToNumber(item.fullHpp)
                const nextItem = history[index + 1]
                const prevHpp = nextItem ? parseDecimalToNumber(nextItem.fullHpp) : null
                const delta = prevHpp !== null ? fullHpp - prevHpp : null

                const formattedCalculatedAt = item.calculatedAt
                  ? new Date(item.calculatedAt).toLocaleString("id-ID", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "-"

                const formattedPriceAsOf = item.priceAsOf
                  ? new Date(item.priceAsOf).toLocaleDateString("id-ID", {
                      dateStyle: "short",
                    })
                  : "-"

                return (
                  <tr key={item.id || index} className="hover:bg-[#FAFBFA] dark:hover:bg-[#161A18]">
                    <td className="py-3 font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                      <span className="rounded-md bg-[#F3F5F4] px-1.5 py-0.5 font-mono text-[11px] text-[#161A18] dark:bg-[#232826] dark:text-[#FAFBFA]">
                        {item.calculationVersion || `v${history.length - index}`}
                      </span>
                    </td>
                    <td className="py-3 text-[#737B76] dark:text-[#98A09B]">{formattedCalculatedAt}</td>
                    <td className="py-3 text-[#737B76] dark:text-[#98A09B]">{formattedPriceAsOf}</td>
                    <td className="py-3 text-right tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                      {formatIDR(item.ingredientCost)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                      {formatIDR(item.packagingCost)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                      {formatIDR(item.directCost)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#161A18] dark:text-[#FAFBFA]">
                      {formatIDR(item.overheadCost)}
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums text-[#10673C] dark:text-[#1EA65E]">
                      {formatIDR(item.fullHpp)}
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums">
                      {delta === null ? (
                        <span className="inline-flex items-center text-[#737B76]">
                          <Minus className="h-3 w-3 mr-0.5" /> Awal
                        </span>
                      ) : delta > 0 ? (
                        <span className="inline-flex items-center text-[#DC2626]">
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +{formatIDR(delta)}
                        </span>
                      ) : delta < 0 ? (
                        <span className="inline-flex items-center text-[#168A4E]">
                          <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" /> {formatIDR(delta)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[#737B76]">
                          <Minus className="h-3 w-3 mr-0.5" /> 0
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-xs dark:border-[#2B312E]">
          <span className="text-[#737B76] dark:text-[#98A09B]">
            Halaman {meta.page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              Selanjutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
