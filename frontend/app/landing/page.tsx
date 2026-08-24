"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  CircleHelp,
  Menu,
  Package,
  Tag,
  Target,
  X,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const COST_BREAKDOWN = [
  { label: "Bahan baku", value: "56,4%", width: "56.4%", color: "bg-[#10673C]" },
  { label: "Kemasan", value: "15,7%", width: "15.7%", color: "bg-[#14804A]" },
  { label: "Tenaga kerja", value: "12,1%", width: "12.1%", color: "bg-[#1B9556]" },
  { label: "Overhead", value: "9,8%", width: "9.8%", color: "bg-[#86EFAC]" },
]

const FAQ_ITEMS = [
  {
    question: "Apa itu HPP?",
    answer:
      "HPP (Harga Pokok Produksi) adalah total biaya untuk membuat satu produk. Di usaha kuliner, hitungannya bisa mencakup bahan baku, kemasan, tenaga kerja, dan overhead.",
  },
  {
    question: "HPP Pintar cocok untuk usaha apa?",
    answer:
      "HPP Pintar dibuat untuk pemilik kedai, bakery, katering, dapur rumahan, dan bisnis makanan atau minuman yang menjual produk berdasarkan resep.",
  },
  {
    question: "Apakah HPP Pintar adalah aplikasi kasir?",
    answer:
      "Bukan. HPP Pintar fokus pada biaya dan harga per menu. Kamu bisa memakainya sebelum produk dijual atau saat perlu meninjau harga yang sudah berjalan.",
  },
  {
    question: "Bisa dipakai untuk banyak menu?",
    answer:
      "Bisa. Setiap produk dapat memiliki resep, satuan, harga bahan, dan versi perhitungan sendiri sehingga perubahan biaya lebih mudah ditelusuri.",
  },
]

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 items-end justify-center gap-1 rounded-xl bg-[#DDF5E7] pb-2 text-[#14804A] dark:bg-[#10673C66] dark:text-[#1EA65E]"
    >
      <span className="h-3 w-1 rounded-full bg-current" />
      <span className="h-5 w-1 rounded-full bg-current" />
      <span className="h-4 w-1 rounded-full bg-current" />
    </span>
  )
}

function ProductPreview() {
  return (
    <figure className="border border-[#D5DAD7] bg-white dark:border-[#2B312E] dark:bg-[#161A18]">
      <figcaption className="flex items-center justify-between gap-4 border-b border-[#E8ECE9] px-4 py-3 text-xs dark:border-[#2B312E] sm:px-5">
        <span className="font-semibold text-[#444B47] dark:text-[#D5DAD7]">HPP Pintar / Produk</span>
        <span className="font-medium text-[#737B76] dark:text-[#98A09B]">Contoh data</span>
      </figcaption>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737B76] dark:text-[#98A09B]">
              Menu aktif
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
              Es Kopi Susu Gula Aren
            </h2>
            <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">1 resep · 1 porsi · 10 bahan</p>
          </div>
          <span className="border border-[#B7E8C8] bg-[#EEF9F2] px-2.5 py-1 text-[11px] font-semibold text-[#10673C] dark:border-[#266D43] dark:bg-[#10673C33] dark:text-[#B7F5CB]">
            Resep aktif
          </span>
        </div>

        <div className="mt-7 grid grid-cols-2 divide-x divide-[#E8ECE9] border-y border-[#E8ECE9] dark:divide-[#2B312E] dark:border-[#2B312E]">
          <div className="py-4 pr-4">
            <p className="text-xs text-[#737B76] dark:text-[#98A09B]">HPP per porsi</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#161A18] tabular-nums dark:text-[#FAFBFA]">
              Rp 6.380
            </p>
          </div>
          <div className="py-4 pl-4">
            <p className="text-xs text-[#737B76] dark:text-[#98A09B]">Harga jual</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#10673C] tabular-nums dark:text-[#B7F5CB]">
              Rp 11.870
            </p>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#161A18] dark:text-[#FAFBFA]">Komposisi biaya</p>
              <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">Dari biaya nyata per porsi</p>
            </div>
            <p className="text-sm font-bold text-[#168A4E] tabular-nums">Margin 46,2%</p>
          </div>

          <div className="mt-4 flex h-2 overflow-hidden bg-[#F3F5F4] dark:bg-[#232826]" aria-hidden="true">
            {COST_BREAKDOWN.map((item) => (
              <span key={item.label} className={item.color} style={{ width: item.width }} />
            ))}
          </div>

          <dl className="mt-4 grid gap-2.5">
            {COST_BREAKDOWN.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                <dt className="flex items-center gap-2 text-[#444B47] dark:text-[#D5DAD7]">
                  <span className={`h-2 w-2 ${item.color}`} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="font-bold tabular-nums text-[#161A18] dark:text-[#FAFBFA]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]">
          <Target className="h-4 w-4 shrink-0 text-[#14804A]" aria-hidden="true" />
          <p className="text-xs leading-5 text-[#444B47] dark:text-[#D5DAD7]">
            Harga jual disusun dari biaya nyata dan target margin.
          </p>
        </div>
      </div>
    </figure>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const transition = {
    duration: shouldReduceMotion ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="overflow-hidden bg-[#F8FAF9] text-[#161A18] dark:bg-[#111315] dark:text-[#FAFBFA]">
      <header className="sticky top-0 z-40 border-b border-[#E8ECE9]/90 bg-[#F8FAF9]/95 backdrop-blur-md dark:border-[#2B312E]/90 dark:bg-[#111315]/95">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link href="/landing" className="flex items-center gap-2.5" onClick={closeMenu}>
            <BrandMark />
            <span className="text-base font-bold tracking-tight">HPP Pintar</span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#untuk-siapa" className="text-sm font-medium text-[#5F6762] transition-colors hover:text-[#10673C] dark:text-[#98A09B] dark:hover:text-[#B7F5CB]">
              Untuk siapa
            </a>
            <a href="#cara-kerja" className="text-sm font-medium text-[#5F6762] transition-colors hover:text-[#10673C] dark:text-[#98A09B] dark:hover:text-[#B7F5CB]">
              Cara kerja
            </a>
            <a href="#produk" className="text-sm font-medium text-[#5F6762] transition-colors hover:text-[#10673C] dark:text-[#98A09B] dark:hover:text-[#B7F5CB]">
              Yang dihitung
            </a>
            <a href="#faq" className="text-sm font-medium text-[#5F6762] transition-colors hover:text-[#10673C] dark:text-[#98A09B] dark:hover:text-[#B7F5CB]">
              FAQ
            </a>
          </div>

          <div className="hidden items-center gap-2.5 lg:flex">
            <ThemeToggle />
            <Link href="/login" className="rounded-[12px] px-3.5 py-2 text-sm font-semibold text-[#444B47] transition-colors hover:bg-[#F3F5F4] hover:text-[#161A18] dark:text-[#D5DAD7] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA]">
              Masuk
            </Link>
            <Link href="/register" className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#14804A] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#10673C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111315]">
              Mulai hitung
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle className="h-9 w-9" />
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-landing-menu"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E8ECE9] bg-white text-[#444B47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#D5DAD7]"
            >
              {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="mobile-landing-menu"
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="border-t border-[#E8ECE9] bg-white px-4 py-4 dark:border-[#2B312E] dark:bg-[#161A18] lg:hidden"
            >
              <div className="mx-auto grid max-w-7xl gap-1">
                {[
                  ["Untuk siapa", "#untuk-siapa"],
                  ["Cara kerja", "#cara-kerja"],
                  ["Yang dihitung", "#produk"],
                  ["FAQ", "#faq"],
                ].map(([label, href]) => (
                  <a key={href} href={href} onClick={closeMenu} className="rounded-[10px] px-3 py-2.5 text-sm font-semibold text-[#444B47] hover:bg-[#F3F5F4] dark:text-[#D5DAD7] dark:hover:bg-[#232826]">
                    {label}
                  </a>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E8ECE9] pt-3 dark:border-[#2B312E]">
                  <Link href="/login" onClick={closeMenu} className="flex h-10 items-center justify-center rounded-[10px] border border-[#E8ECE9] text-sm font-semibold text-[#444B47] dark:border-[#2B312E] dark:text-[#D5DAD7]">
                    Masuk
                  </Link>
                  <Link href="/register" onClick={closeMenu} className="flex h-10 items-center justify-center rounded-[10px] bg-[#14804A] text-sm font-semibold text-white">
                    Mulai hitung
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="border-b border-[#E8ECE9] dark:border-[#2B312E]" aria-labelledby="landing-title">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-24">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
              className="max-w-xl"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14804A] dark:text-[#6EE7A1]">
                Software HPP untuk usaha kuliner
              </p>
              <h1 id="landing-title" className="mt-5 max-w-[14ch] text-5xl font-bold leading-[0.98] tracking-[-0.06em] text-[#111315] dark:text-[#FAFBFA] sm:text-6xl lg:text-[4.6rem]">
                Hitung biaya setiap menu. Tentukan harga jual dengan angka.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#5F6762] dark:text-[#B8C0BB] sm:text-lg">
                HPP Pintar membantu pemilik kedai, bakery, katering, dan bisnis makanan menghitung biaya bahan, resep, kemasan, tenaga kerja, serta overhead dalam satu alur.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#14804A] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#10673C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111315]">
                  Mulai dari satu menu
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#cara-kerja" className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#D5DAD7] bg-white px-6 text-sm font-semibold text-[#232826] transition-colors hover:border-[#14804A] hover:text-[#10673C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA] dark:hover:border-[#1B9556] dark:hover:text-[#B7F5CB] dark:focus-visible:ring-offset-[#111315]">
                  Lihat cara kerjanya
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E8ECE9] pt-4 text-xs text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
                <span>Bukan aplikasi kasir</span>
                <span>Bukan software akuntansi</span>
                <span>Fokus pada biaya per menu</span>
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.08 }}
              className="relative mx-auto w-full max-w-2xl lg:mx-0"
            >
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        <section id="untuk-siapa" className="border-b border-[#E8ECE9] bg-white dark:border-[#2B312E] dark:bg-[#161A18]" aria-labelledby="audience-title">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-20">
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14804A] dark:text-[#6EE7A1]">Masalah yang diselesaikan</p>
              <h2 id="audience-title" className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[#161A18] dark:text-[#FAFBFA] sm:text-4xl">
                Kalau kamu menjual menu, kamu perlu tahu biaya per menunya.
              </h2>
            </div>
            <div className="grid border-t border-[#E8ECE9] sm:grid-cols-3 sm:border-t-0 dark:border-[#2B312E]">
              <article className="border-b border-[#E8ECE9] py-5 sm:border-b-0 sm:border-l sm:px-6 sm:py-2 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">01</span>
                <h3 className="mt-8 text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Harga bahan berubah</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Kamu bisa melihat dampaknya ke biaya satu porsi sebelum harga jual ikut berubah.</p>
              </article>
              <article className="border-b border-[#E8ECE9] py-5 sm:border-b-0 sm:border-l sm:px-6 sm:py-2 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">02</span>
                <h3 className="mt-8 text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Resep makin banyak</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Setiap menu punya catatan bahan dan versi resep yang bisa ditinjau kembali.</p>
              </article>
              <article className="py-5 sm:border-l sm:px-6 sm:py-2 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">03</span>
                <h3 className="mt-8 text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Margin terasa hilang</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Bandingkan HPP, harga jual, dan margin target dari angka yang sama.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="how-title">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14804A] dark:text-[#6EE7A1]">Cara kerja</p>
            <h2 id="how-title" className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[#161A18] dark:text-[#FAFBFA] sm:text-4xl">
              Bahan masuk. HPP terbentuk. Harga jadi masuk akal.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5F6762] dark:text-[#B8C0BB]">
              Kamu tidak perlu menebak biaya dari omzet. HPP Pintar mengikuti alur sederhana dari resep sampai keputusan harga.
            </p>
          </div>

          <div className="mt-12 overflow-hidden border-y border-[#D5DAD7] dark:border-[#2B312E]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#F3F5F4] px-5 py-4 text-sm font-semibold text-[#444B47] dark:bg-[#232826] dark:text-[#D5DAD7] sm:px-7">
              <span>Bahan</span>
              <span className="text-[#14804A]" aria-hidden="true">+</span>
              <span>Resep</span>
              <span className="text-[#14804A]" aria-hidden="true">+</span>
              <span>Biaya lain</span>
              <span className="text-[#14804A]" aria-hidden="true">=</span>
              <span className="text-[#10673C] dark:text-[#B7F5CB]">HPP per porsi</span>
              <span className="text-[#14804A]" aria-hidden="true">→</span>
              <span className="text-[#10673C] dark:text-[#B7F5CB]">Harga jual</span>
            </div>
            <ol className="grid lg:grid-cols-3">
              <li className="border-b border-[#E8ECE9] p-6 dark:border-[#2B312E] lg:border-b-0 lg:border-r sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <Package className="h-5 w-5 text-[#14804A]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">01</span>
                </div>
                <h3 className="mt-12 text-xl font-bold text-[#161A18] dark:text-[#FAFBFA]">Catat bahan baku</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Simpan nama, satuan, dan harga bahan yang benar-benar kamu pakai.</p>
              </li>
              <li className="border-b border-[#E8ECE9] p-6 dark:border-[#2B312E] lg:border-b-0 lg:border-r sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <Calculator className="h-5 w-5 text-[#14804A]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">02</span>
                </div>
                <h3 className="mt-12 text-xl font-bold text-[#161A18] dark:text-[#FAFBFA]">Susun resep</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Masukkan takaran per menu dan lihat biaya setiap komponen secara transparan.</p>
              </li>
              <li className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <Tag className="h-5 w-5 text-[#14804A]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">03</span>
                </div>
                <h3 className="mt-12 text-xl font-bold text-[#161A18] dark:text-[#FAFBFA]">Pilih harga jual</h3>
                <p className="mt-2 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Gunakan target margin untuk membandingkan skenario harga sebelum dipasang.</p>
              </li>
            </ol>
          </div>
        </section>

        <section id="produk" className="border-y border-[#E8ECE9] bg-white dark:border-[#2B312E] dark:bg-[#161A18]" aria-labelledby="product-title">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-24">
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14804A] dark:text-[#6EE7A1]">Di dalam aplikasi</p>
              <h2 id="product-title" className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[#161A18] dark:text-[#FAFBFA] sm:text-4xl">
                Yang dihitung, bukan sekadar ditampilkan.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5F6762] dark:text-[#B8C0BB]">
                Setiap angka punya asal. Kamu bisa membuka kembali komponen biaya sebelum mengambil keputusan untuk menu atau harga jual.
              </p>
              <Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#14804A] hover:text-[#10673C] dark:text-[#6EE7A1] dark:hover:text-[#B7F5CB]">
                Mulai dari data produk
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="border-t border-[#D5DAD7] dark:border-[#2B312E]">
              <article className="grid gap-2 border-b border-[#E8ECE9] py-5 sm:grid-cols-[auto_1fr] sm:gap-8 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">01</span>
                <div>
                  <h3 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Katalog bahan baku</h3>
                  <p className="mt-1 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Satu daftar untuk bahan, satuan, harga, dan riwayat perubahan yang memengaruhi produk.</p>
                </div>
              </article>
              <article className="grid gap-2 border-b border-[#E8ECE9] py-5 sm:grid-cols-[auto_1fr] sm:gap-8 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">02</span>
                <div>
                  <h3 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Resep dan versi perhitungan</h3>
                  <p className="mt-1 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Ubah takaran tanpa kehilangan jejak mengapa biaya menu berubah.</p>
                </div>
              </article>
              <article className="grid gap-2 border-b border-[#E8ECE9] py-5 sm:grid-cols-[auto_1fr] sm:gap-8 dark:border-[#2B312E]">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">03</span>
                <div>
                  <h3 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">HPP, harga jual, dan margin</h3>
                  <p className="mt-1 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Lihat tiga angka keputusan dalam satu tampilan dan bandingkan dengan targetmu.</p>
                </div>
              </article>
              <article className="grid gap-2 py-5 sm:grid-cols-[auto_1fr] sm:gap-8">
                <span className="text-xs font-bold text-[#14804A] dark:text-[#6EE7A1]">04</span>
                <div>
                  <h3 className="text-lg font-bold text-[#161A18] dark:text-[#FAFBFA]">Riwayat dan simulasi</h3>
                  <p className="mt-1 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Tinjau perhitungan sebelumnya dan uji harga sebelum mengubah menu yang berjalan.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="mulai" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="start-title">
          <div className="grid gap-8 border-y border-[#D5DAD7] py-10 sm:grid-cols-[1fr_auto] sm:items-center sm:py-12 dark:border-[#2B312E]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14804A] dark:text-[#6EE7A1]">Mulai dari menu terlaris</p>
              <h2 id="start-title" className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[#161A18] dark:text-[#FAFBFA] sm:text-4xl">
                Sebelum ubah harga, tahu dulu biaya sebenarnya.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5F6762] dark:text-[#B8C0BB]">Masukkan satu produk yang paling sering kamu jual. Dari sana, kamu bisa melihat alur HPP Pintar dengan data usahamu sendiri.</p>
            </div>
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#14804A] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#10673C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111315]">
              Buat akun
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section id="faq" className="border-t border-[#E8ECE9] bg-white dark:border-[#2B312E] dark:bg-[#161A18]" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-24">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#B7F5CB]">
                <CircleHelp className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 id="faq-title" className="mt-6 text-3xl font-bold tracking-[-0.04em] text-[#161A18] dark:text-[#FAFBFA]">Pertanyaan dasar tentang HPP Pintar.</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">Kalau baru pertama kali menghitung biaya produk, mulai dari jawaban di sini.</p>
            </div>
            <div className="divide-y divide-[#E8ECE9] border-y border-[#E8ECE9] dark:divide-[#2B312E] dark:border-[#2B312E]">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold text-[#161A18] outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[#14804A] dark:text-[#FAFBFA]">
                    {item.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#737B76] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="max-w-2xl pr-8 pt-3 text-sm leading-6 text-[#737B76] dark:text-[#98A09B]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8ECE9] bg-[#F8FAF9] dark:border-[#2B312E] dark:bg-[#111315]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div>
              <p className="text-sm font-bold text-[#161A18] dark:text-[#FAFBFA]">HPP Pintar</p>
              <p className="text-xs text-[#737B76] dark:text-[#98A09B]">Hitung biaya produksi dan harga jual per menu.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
            <Link href="/login" className="hover:text-[#14804A]">Masuk</Link>
            <Link href="/register" className="hover:text-[#14804A]">Buat akun</Link>
            <span>© 2025 HPP Pintar</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
