"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient, ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      router.push("/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        // Fallback redirect for live mock environment if backend server is offline
        router.push("/")
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("owner@kopititiktemu.com")
    setPassword("Rahasia123!")
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
          Masuk ke Akun
        </h2>
        <p className="text-xs text-[#737B76] dark:text-[#98A09B]">
          Akses dashboard kalkulasi HPP dan strategi harga tokomu.
        </p>
      </div>

      {/* Discrete Demo Autofill Pill */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-[#D5DAD7] bg-[#F3F5F4]/60 p-2.5 dark:border-[#2B312E] dark:bg-[#161A18]/60">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#14804A] dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] text-[#444B47] dark:text-[#98A09B]">Uji coba dengan akun demo?</span>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-[11px] font-semibold text-[#14804A] hover:underline dark:text-emerald-400"
        >
          Isi Otomatis
        </button>
      </div>

      {error && <ErrorBanner code={error.code} message={error.message} />}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block font-medium text-[#161A18] dark:text-[#FAFBFA]">
            Email Bisnis
          </label>
          <Input
            id="login-email"
            required
            type="email"
            placeholder="nama@bisnis.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixNode={<Mail className="h-4 w-4 text-[#737B76]" />}
            className="h-10 rounded-[12px] bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block font-medium text-[#161A18] dark:text-[#FAFBFA]">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[11px] font-medium text-[#14804A] hover:underline dark:text-emerald-400"
            >
              Lupa password?
            </Link>
          </div>
          <Input
            id="login-password"
            required
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixNode={<Lock className="h-4 w-4 text-[#737B76]" />}
            suffixNode={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#737B76] hover:text-[#161A18] dark:hover:text-[#FAFBFA]"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            className="h-10 rounded-[12px] bg-white dark:bg-[#161A18]"
          />
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          disabled={loading}
          className="h-10 w-full gap-2 rounded-[12px] bg-[#092B19] text-xs font-semibold text-white hover:bg-[#104227] dark:bg-[#14804A] dark:hover:bg-[#10673C] transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            <>
              Masuk ke Aplikasi
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Footer link */}
      <div className="border-t border-[#E8ECE9] pt-4 text-center text-xs text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">
        Belum punya akun bisnis?{" "}
        <Link
          href="/register"
          className="font-bold text-[#14804A] hover:underline dark:text-emerald-400"
        >
          Daftar akun
        </Link>
      </div>
    </div>
  )
}
