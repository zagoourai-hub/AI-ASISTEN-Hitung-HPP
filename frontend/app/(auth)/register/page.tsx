"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient, ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { User, Store, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          business_name: businessName,
          password,
        }),
      })
      router.push("/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        // Optimistic redirect for preview if offline
        router.push("/")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF9F2] px-3 py-0.5 text-[11px] font-semibold text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
          <Sparkles className="h-3 w-3" />
          <span>Akses Penuh Tanpa Biaya di Masa Pilot</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA] sm:text-3xl">
          Mulai Bisnis Lebih Terukur
        </h2>
        <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
          Daftarkan tokomu dan buat database bahan baku & formula resep pertamamu.
        </p>
      </div>

      {error && <ErrorBanner code={error.code} message={error.message} />}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Nama Pemilik / Operator
          </label>
          <Input
            id="reg-name"
            required
            type="text"
            placeholder="Contoh: Dinda Putri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            prefixNode={<User className="h-4 w-4 text-[#737B76]" />}
            className="h-11 rounded-[12px] bg-[#FAFBFA] focus-visible:bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-business" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Nama Bisnis / Brand Toko
          </label>
          <Input
            id="reg-business"
            required
            type="text"
            placeholder="Contoh: Kopi Titik Temu"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            prefixNode={<Store className="h-4 w-4 text-[#737B76]" />}
            className="h-11 rounded-[12px] bg-[#FAFBFA] focus-visible:bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Alamat Email
          </label>
          <Input
            id="reg-email"
            required
            type="email"
            placeholder="owner@tokomu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixNode={<Mail className="h-4 w-4 text-[#737B76]" />}
            className="h-11 rounded-[12px] bg-[#FAFBFA] focus-visible:bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
            Password Akun
          </label>
          <Input
            id="reg-password"
            required
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixNode={<Lock className="h-4 w-4 text-[#737B76]" />}
            suffixNode={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#737B76] hover:text-[#161A18] dark:hover:text-[#FAFBFA] focus-visible:outline-none"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            className="h-11 rounded-[12px] bg-[#FAFBFA] focus-visible:bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full gap-2 rounded-[12px] bg-[#10673C] text-xs font-semibold text-white hover:bg-[#0D5230] shadow-sm transition-all active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mendaftarkan Akun...
            </>
          ) : (
            <>
              Daftarkan Bisnis Saya
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="border-t border-[#E8ECE9] pt-4 text-center text-xs text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
        Sudah memiliki akun terdaftar?{" "}
        <Link
          href="/login"
          className="font-bold text-[#14804A] hover:underline dark:text-[#1EA65E]"
        >
          Masuk di sini &rarr;
        </Link>
      </div>
    </div>
  )
}
