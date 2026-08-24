"use client"

import React from "react"
import Link from "next/link"
import { BarChart3, ArrowRight, ShieldCheck } from "lucide-react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Laporan & Analitik"
        subtitle="Modul analisis performa laba produk dan tren pergerakan HPP."
      />

      <Card className="p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
          <BarChart3 className="h-7 w-7" />
        </div>
        <div className="mt-4">
          <Badge variant="outline" className="text-xs">
            Roadmap Post-MVP
          </Badge>
          <h2 className="mt-2 text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">
            Laporan Finansial & Margin Otomatis
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#737B76] dark:text-[#98A09B]">
            Modul laporan agregat, tren laba kotor berkala, dan performa margin antar kategori akan hadir setelah validasi pilot Core HPP & Pricing v2.0 selesai.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-4 text-left text-xs dark:border-[#2B312E] dark:bg-[#111315]">
          <p className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Fitur yang Sedang Aktif:</p>
          <ul className="mt-2 space-y-1.5 text-[#737B76] dark:text-[#98A09B]">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#14804A]" />
              <span>Kalkulasi HPP deterministik per varian produk</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#14804A]" />
              <span>Rekomendasi harga jual 3-tier (Hemat, Ideal, Premium)</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#14804A]" />
              <span>Simulasi promo diskon dengan deteksi jual rugi</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/products">
            <Button size="sm" className="gap-2 bg-[#14804A] hover:bg-[#10673C] text-xs text-white">
              Kelola Produk & HPP
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
