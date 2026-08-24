"use client"

import React, { useState } from "react"
import {
  Sparkles,
  Plus,
  ChevronRight,
  TrendingUp,
  PieChart,
  Lightbulb,
  ShieldCheck,
  Send,
} from "lucide-react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState("")

  const suggestions = [
    "Kenapa HPP naik?",
    "Simulasikan diskon 10%",
    "Produk paling menguntungkan",
    "Bahan baku mana yang paling boros?",
  ]

  return (
    <div className="space-y-6 pb-16">
      <Header
        title=""
        showDemoButton={true}
        showPeriodSelector={false}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Col (3 cols): Conversation List */}
        <aside aria-label="Riwayat Percakapan AI" className="space-y-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
              Percakapan
            </h2>
            <button
              aria-label="Percakapan Baru"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8ECE9] bg-white text-[#737B76] hover:bg-[#F3F5F4] dark:border-[#2B312E] dark:bg-[#161A18]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Active Item */}
            <div className="relative rounded-2xl border border-[#DDF5E7] bg-[#EEF9F2] p-3 text-xs dark:border-[#10673C55] dark:bg-[#10673C22]">
              <div className="flex items-start justify-between">
                <span className="font-semibold text-[#14804A] dark:text-[#1EA65E]">
                  Analisis Kopi Susu Gula Aren untuk margin
                </span>
                <span className="h-2 w-2 rounded-full bg-[#14804A]" />
              </div>
              <p className="mt-2 text-[11px] text-[#14804A]/80 dark:text-[#86EFAC]">
                10:24 WIB
              </p>
            </div>

            {/* Inactive Item 1 */}
            <div className="rounded-2xl border border-[#E8ECE9] bg-white p-3 text-xs hover:bg-[#FAFBFA] transition-colors dark:border-[#2B312E] dark:bg-[#161A18]">
              <span className="font-medium text-[#161A18] dark:text-[#FAFBFA]">
                Kenapa margin turun bulan ini?
              </span>
              <p className="mt-2 text-[11px] text-[#737B76] dark:text-[#98A09B]">
                09:15 WIB
              </p>
            </div>

            {/* Inactive Item 2 */}
            <div className="rounded-2xl border border-[#E8ECE9] bg-white p-3 text-xs hover:bg-[#FAFBFA] transition-colors dark:border-[#2B312E] dark:bg-[#161A18]">
              <span className="font-medium text-[#161A18] dark:text-[#FAFBFA]">
                Simulasikan diskon 10% semua produk
              </span>
              <p className="mt-2 text-[11px] text-[#737B76] dark:text-[#98A09B]">
                Kemarin
              </p>
            </div>

            <button className="flex w-full items-center justify-between rounded-xl p-2 text-xs font-semibold text-[#737B76] hover:text-[#14804A]">
              <span>Lihat semua percakapan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        {/* Center Col (6 cols): AI Analyst Chat & Structured Cards */}
        <section aria-label="Analisis AI" className="space-y-5 xl:col-span-6">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">
                AI Assistant
              </h1>
              <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
                Dapatkan insight cerdas tentang HPP, margin, dan strategi harga.
              </p>
            </div>
          </div>

          {/* User Question Box */}
          <div className="rounded-2xl bg-[#F3F5F4] p-4 text-xs font-medium text-[#161A18] dark:bg-[#232826] dark:text-[#FAFBFA]">
            Analisis produk Es Kopi Susu Gula Aren dan berikan rekomendasi untuk meningkatkan margin.
          </div>

          <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
            Berikut analisis singkat untuk Es Kopi Susu Gula Aren:
          </p>

          {/* Result Block 1: Ringkasan & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#161A18] dark:text-[#FAFBFA]">
                <PieChart className="h-4 w-4 text-[#14804A]" />
                <span>Ringkasan</span>
              </div>
              <p className="mt-2 text-xs text-[#444B47] leading-relaxed dark:text-[#D5DAD7]">
                Produk memiliki margin yang sehat, namun masih ada peluang untuk meningkatkan profit dengan optimasi biaya bahan baku utama.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#161A18] dark:text-[#FAFBFA]">
                  <ShieldCheck className="h-4 w-4 text-[#14804A]" />
                  <span>Status</span>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Sehat
                </Badge>
              </div>
              <p className="mt-2 text-xs text-[#444B47] leading-relaxed dark:text-[#D5DAD7]">
                Margin 65% masih di atas benchmark 60% untuk kategori minuman kopi.
              </p>
            </Card>
          </div>

          {/* Result Block 2: Metrik Utama */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#161A18] dark:text-[#FAFBFA] mb-3">
              <TrendingUp className="h-4 w-4 text-[#14804A]" />
              <span>Metrik Utama</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">HPP per Gelas</p>
                <p className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 6.380</p>
              </div>
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">Harga Jual</p>
                <p className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 18.000</p>
              </div>
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">Margin</p>
                <p className="font-bold tabular-nums text-[#14804A] dark:text-[#1EA65E]">65%</p>
              </div>
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">Laba / Gelas</p>
                <p className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 11.620</p>
              </div>
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">Penjualan / Bulan</p>
                <p className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">1.240 gelas</p>
              </div>
              <div className="rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-2.5 dark:border-[#2B312E] dark:bg-[#111315]">
                <p className="text-[10px] text-[#737B76] dark:text-[#98A09B]">Laba / Bulan</p>
                <p className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 14.428.800</p>
              </div>
            </div>
          </Card>

          {/* Result Block 3: Rekomendasi */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#161A18] dark:text-[#FAFBFA] mb-2">
              <Lightbulb className="h-4 w-4 text-[#14804A]" />
              <span>Rekomendasi</span>
            </div>
            <ul className="space-y-2 text-xs text-[#444B47] dark:text-[#D5DAD7]">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14804A] mt-1.5 shrink-0" />
                <span>Negosiasikan harga biji kopi untuk menurunkan HPP ± Rp 400/gelas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14804A] mt-1.5 shrink-0" />
                <span>Gunakan promo bundling untuk meningkatkan volume penjualan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14804A] mt-1.5 shrink-0" />
                <span>Pertimbangkan ukuran Large dengan harga Rp 22.000.</span>
              </li>
            </ul>
          </Card>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
            className="relative flex items-center pt-2"
          >
            <input
              type="text"
              placeholder="Tanyakan apa saja tentang HPP bisnismu..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#E8ECE9] bg-white pl-4 pr-12 text-xs text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
            />
            <button
              type="submit"
              aria-label="Kirim Pesan"
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#14804A] text-white hover:bg-[#10673C] transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Suggested Prompt Chips */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">
              Coba pertanyaan berikut:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-[#DDF5E7] bg-[#EEF9F2] px-3 py-1.5 text-[11px] font-medium text-[#10673C] hover:bg-[#DDF5E7] transition-colors dark:border-[#10673C44] dark:bg-[#10673C22] dark:text-[#1EA65E]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Col (3 cols): Konteks Analisis */}
        <aside aria-label="Konteks Analisis Produk" className="space-y-4 xl:col-span-3">
          <h2 className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Konteks Analisis
          </h2>

          <Card className="p-4 space-y-4">
            {/* Product card */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#F4E8DC] flex items-center justify-center text-2xl">
                🧋
              </div>
              <div>
                <p className="text-xs font-bold text-[#161A18] dark:text-[#FAFBFA]">
                  Es Kopi Susu Gula Aren
                </p>
                <Badge variant="success" className="mt-1 text-[10px]">
                  Aktif
                </Badge>
              </div>
            </div>

            <div className="space-y-1 text-xs border-t border-[#E8ECE9] pt-3 dark:border-[#2B312E]">
              <div className="flex justify-between">
                <span className="text-[#737B76] dark:text-[#98A09B]">Kategori</span>
                <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Minuman Kopi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76] dark:text-[#98A09B]">SKU</span>
                <span className="font-mono text-[#737B76] dark:text-[#98A09B]">EKSGA-001</span>
              </div>
            </div>

            {/* Periode */}
            <div className="border-t border-[#E8ECE9] pt-3 text-xs dark:border-[#2B312E]">
              <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">Periode Analisis</p>
              <p className="font-bold text-[#161A18] dark:text-[#FAFBFA]">Mei 2025</p>
            </div>

            {/* Data Utama */}
            <div className="border-t border-[#E8ECE9] pt-3 text-xs space-y-2 dark:border-[#2B312E]">
              <p className="text-[11px] font-bold text-[#161A18] dark:text-[#FAFBFA]">Data Utama</p>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Penjualan / Bulan</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">1.240 gelas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">HPP per Gelas</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 6.380</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Harga Jual</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 18.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Margin</span>
                <span className="font-bold tabular-nums text-[#14804A] dark:text-[#1EA65E]">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Laba / Bulan</span>
                <span className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 14.428.800</span>
              </div>
            </div>

            {/* Benchmark */}
            <div className="border-t border-[#E8ECE9] pt-3 text-xs space-y-2 dark:border-[#2B312E]">
              <p className="text-[11px] font-bold text-[#161A18] dark:text-[#FAFBFA]">Benchmark</p>
              <div className="flex justify-between">
                <span className="text-[#737B76]">Margin Rata-rata</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">60%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737B76]">HPP Rata-rata</span>
                <span className="font-semibold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">Rp 6.900</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
