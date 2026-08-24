import Link from "next/link"
import { ShieldCheck, Calculator, CheckCircle2 } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-[#FAFBFA] dark:bg-[#0E1110]">
      {/* Left Column: Brand & Value Narrative (Desktop) */}
      <aside className="relative hidden w-1/2 flex-col justify-between border-r border-[#1B4D31] bg-[#092B19] p-12 text-white lg:flex xl:p-16">
        {/* Subtle architectural hairline border grid */}
        <div 
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" 
        />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-md transition-transform group-hover:scale-105">
              <div className="flex items-end gap-1">
                <span className="h-2.5 w-1 rounded-full bg-emerald-400" />
                <span className="h-5 w-1 rounded-full bg-white" />
                <span className="h-3.5 w-1 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                HPP Pintar
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-emerald-300/80 uppercase">
                Sistem Kalkulasi UMKM
              </span>
            </div>
          </Link>
        </div>

        {/* Narrative & Visual Metric Showcase */}
        <div className="relative z-10 max-w-md my-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-[1.15]">
              Hitung HPP Presisi, <br />
              Kunci Laba Pasti.
            </h1>
            <p className="text-xs text-emerald-100/80 leading-relaxed max-w-[42ch]">
              Otomasi kalkulasi biaya resep, pantau fluktuasi harga bahan baku, dan dapatkan rekomendasi harga jual deterministik untuk bisnis kuliner.
            </p>
          </div>

          {/* Minimalist Formula Metric Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300">
                  <Calculator className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">Kalkulasi Otomatis Varian</span>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Formula Aktif
              </span>
            </div>

            <div className="space-y-2 rounded-xl bg-black/20 p-3 font-mono text-[11px]">
              <div className="flex justify-between text-emerald-200/80">
                <span>Bahan Pokok + Kemasan</span>
                <span className="text-white">Rp 6.370</span>
              </div>
              <div className="flex justify-between text-emerald-200/80">
                <span>Biaya Langsung & Overhead</span>
                <span className="text-white">Rp 1.000</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-xs">
                <span className="text-emerald-300">Total HPP per Unit</span>
                <span className="text-white">Rp 7.370</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-emerald-200/70">Harga Rekomendasi (Margin 63%)</span>
              <span className="font-bold tabular-nums text-emerald-300">Rp 20.000</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Strip */}
        <div className="relative z-10 flex items-center gap-6 border-t border-white/10 pt-6 text-[11px] text-emerald-200/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Satu Pengguna Satu Bisnis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Akurasi Desimal IDR</span>
          </div>
        </div>
      </aside>

      {/* Right Column: Clean Form Container */}
      <main className="relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile Header */}
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF9F2] text-[#092B19] dark:bg-[#1B4D31]/30 dark:text-emerald-400">
              <div className="flex items-end gap-1">
                <span className="h-2.5 w-1 rounded-full bg-[#14804A]" />
                <span className="h-5 w-1 rounded-full bg-[#092B19] dark:bg-white" />
                <span className="h-3.5 w-1 rounded-full bg-[#14804A]" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
              HPP Pintar
            </span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {children}
        </div>
      </main>
    </div>
  )
}
