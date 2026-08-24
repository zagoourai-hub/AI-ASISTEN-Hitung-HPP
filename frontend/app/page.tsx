"use client"

import React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Calculator,
  Tag,
  Target,
  Package,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonutChart } from "@/components/charts/donut-chart"
import { TrendChart } from "@/components/charts/trend-chart"

export default function DashboardPage() {
  const costBreakdownData = [
    { name: "Bahan Baku", value: 56.4, color: "#10673C" },
    { name: "Kemasan", value: 15.7, color: "#14804A" },
    { name: "Tenaga Kerja", value: 12.1, color: "#1B9556" },
    { name: "Overhead", value: 9.8, color: "#86EFAC" },
    { name: "Lain-lain", value: 6.0, color: "#DDF5E7" },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <Header
        title="Dashboard"
        subtitle="Ringkasan performa bisnis dan insight HPP kamu hari ini."
      />

      {/* Warning Alert Banner */}
      <section aria-label="Peringatan Margin" className="flex items-start gap-4 rounded-[18px] border border-[#FED7AA] bg-[#FFFBEB] p-4 text-[#9A3412] dark:border-[#78350F] dark:bg-[#451A03]/30 dark:text-[#FDBA74]">
        <div className="rounded-full bg-[#FEF3C7] p-2 text-[#D97706] dark:bg-[#78350F]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-[#9A3412] dark:text-[#FDBA74]">
            Margin rata-rata turun di bawah target!
          </h2>
          <p className="mt-0.5 text-xs text-[#B45309] dark:text-[#FDBA74]/90">
            Margin bulan ini 18.2% (target minimal 25%). Tinjau produk untuk tingkatkan profit.
          </p>
        </div>
      </section>

      {/* 4 Primary Metric Cards */}
      <section aria-label="Metrik Utama" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: HPP Rata-rata */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                HPP Rata-rata
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                Rp 6.380
              </p>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                per unit
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Calculator className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#168A4E]">
            <TrendingDown className="h-4 w-4" />
            <span>2.4%</span>
            <span className="text-[#737B76] dark:text-[#98A09B]">dari Apr 2025</span>
          </div>
        </Card>

        {/* Metric 2: Harga Jual Rata-rata */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Harga Jual Rata-rata
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                Rp 11.870
              </p>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                per unit
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#168A4E]">
            <TrendingUp className="h-4 w-4" />
            <span>3.1%</span>
            <span className="text-[#737B76] dark:text-[#98A09B]">dari Apr 2025</span>
          </div>
        </Card>

        {/* Metric 3: Margin vs Target */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Margin vs Target
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                18.2%
              </p>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                Target: ≥ 25%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8ECE9] dark:bg-[#2B312E]">
              <div className="h-full w-[45%] rounded-full bg-[#DC2626]" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-[#DC2626]">
              <span>-6.8%</span>
              <span className="text-[#737B76] dark:text-[#98A09B]">di bawah target</span>
            </div>
          </div>
        </Card>

        {/* Metric 4: Produk Aktif */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
                Produk Aktif
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
                24
              </p>
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                produk
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#168A4E]">
            <TrendingUp className="h-4 w-4" />
            <span>2</span>
            <span className="text-[#737B76] dark:text-[#98A09B]">dari Apr 2025</span>
          </div>
        </Card>
      </section>

      {/* 3 Middle Columns */}
      <section aria-label="Analisis Biaya & Produk" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Col 1: Produk Perlu Diperhatikan */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 pb-4">
              <CardTitle>Produk Perlu Diperhatikan</CardTitle>
            </CardHeader>
            <div className="divide-y divide-[#E8ECE9] dark:divide-[#2B312E]">
              {/* Product 1 */}
              <Link
                href="/products/1"
                className="group flex items-center justify-between py-3 transition-colors hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D] -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F3F5F4] flex items-center justify-center text-lg">
                    🧋
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#161A18] group-hover:text-[#14804A] dark:text-[#FAFBFA]">
                      Es Kopi Susu Gula Aren
                    </h3>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                      Margin hanya 12.4%.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px] font-semibold">
                    Margin Rendah
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-[#98A09B]" />
                </div>
              </Link>

              {/* Product 2 */}
              <Link
                href="/products/2"
                className="group flex items-center justify-between py-3 transition-colors hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D] -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F3F5F4] flex items-center justify-center text-lg">
                    🍜
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#161A18] group-hover:text-[#14804A] dark:text-[#FAFBFA]">
                      Mie Ayam Spesial
                    </h3>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                      Harga bahan utama naik 8%.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-[10px] font-semibold">
                    Biaya Naik
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-[#98A09B]" />
                </div>
              </Link>

              {/* Product 3 */}
              <Link
                href="/products/3"
                className="group flex items-center justify-between py-3 transition-colors hover:bg-[#FAFBFA] dark:hover:bg-[#1B201D] -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F3F5F4] flex items-center justify-center text-lg">
                    🍓
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#161A18] group-hover:text-[#14804A] dark:text-[#FAFBFA]">
                      Jus Stroberi Segar
                    </h3>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                      Penjualan turun 15%.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-[10px] font-semibold">
                    Volume Turun
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-[#98A09B]" />
                </div>
              </Link>
            </div>
          </div>
          <div className="pt-3 text-center border-t border-[#E8ECE9] dark:border-[#2B312E]">
            <Link
              href="/products"
              className="text-xs font-semibold text-[#14804A] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
        </Card>

        {/* Col 2: Komposisi Biaya (Rata-rata) */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 pb-4">
              <CardTitle>Komposisi Biaya (Rata-rata)</CardTitle>
            </CardHeader>
            <DonutChart
              segments={costBreakdownData}
              layout="vertical"
              size={136}
              centerLabel="Komposisi"
              centerValue="HPP"
              totalPercentage="100%"
            />
          </div>
          <div className="pt-3 text-center border-t border-[#E8ECE9] dark:border-[#2B312E]">
            <span className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
              Berdasarkan 24 resep aktif
            </span>
          </div>
        </Card>

        {/* Col 3: Tren HPP Rata-rata */}
        <Card>
          <CardHeader className="p-0 pb-2">
            <CardTitle>Tren HPP Rata-rata</CardTitle>
          </CardHeader>
          <TrendChart />
        </Card>
      </section>

      {/* Bottom Insight AI Banner */}
      <section aria-label="Rekomendasi AI">
        <Card className="border-[#DDF5E7] bg-[#FAFCFB] dark:border-[#10673C44] dark:bg-[#141A16]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
                Insight AI
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DDF5E7] text-[11px] font-bold text-[#10673C]">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                      Ganti pemasok Gula Aren
                    </p>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                      Bisa hemat Rp 620 / kg (atau 8.7%).
                    </p>
                  </div>
                </div>

                <div className="hidden h-8 w-px bg-[#E8ECE9] sm:block dark:bg-[#2B312E]" />

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DDF5E7] text-[11px] font-bold text-[#10673C]">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                      Sesuaikan harga Es Kopi Susu Gula Aren
                    </p>
                    <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                      Naikkan harga jual Rp 1.000 – Rp 1.500.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right AI callout mini-card */}
          <Link
            href="/ai-assistant"
            className="flex items-center justify-between gap-4 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3.5 transition-all hover:bg-[#DDF5E7] dark:border-[#10673C55] dark:bg-[#10673C22]"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white p-1.5 text-[#14804A] shadow-2xs dark:bg-[#161A18]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#10673C] dark:text-[#1EA65E]">
                  Peluang optimasi terdeteksi
                </p>
                <p className="text-[11px] text-[#14804A] dark:text-[#86EFAC]">
                  AI menemukan 2 peluang untuk meningkatkan margin kamu.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </Card>
      </section>
    </div>
  )
}
