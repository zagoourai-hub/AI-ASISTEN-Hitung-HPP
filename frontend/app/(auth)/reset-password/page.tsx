"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient, ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { CheckCircle2, KeyRound } from "lucide-react"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get("token") || ""

  const [token, setToken] = useState(tokenFromUrl)
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isConfirmMode, setIsConfirmMode] = useState(Boolean(tokenFromUrl))

  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  // 1. Request Reset Flow
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setRequestSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        // Safe generic response without account enumeration
        setRequestSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // 2. Confirm Reset Flow
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError({ message: "Konfirmasi password baru tidak cocok." })
      return
    }

    if (newPassword.length < 8) {
      setError({ message: "Password minimal 8 karakter." })
      return
    }

    setLoading(true)

    try {
      await apiClient("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      })
      setConfirmSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        setConfirmSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
          {isConfirmMode ? "Tetapkan Password Baru" : "Atur Ulang Password"}
        </h1>
        <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
          {isConfirmMode
            ? "Masukkan token verifikasi dan password baru untuk akun tokomu."
            : "Masukkan email terdaftar untuk menerima instruksi pemulihan."}
        </p>
      </div>

      {error && <ErrorBanner code={error.code} message={error.message} />}

      {confirmSuccess ? (
        <div className="space-y-4 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-4 text-center text-xs dark:border-[#10673C44] dark:bg-[#10673C22]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#14804A] text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="font-semibold text-[#14804A] dark:text-[#1EA65E]">
            Password Berhasil Diubah!
          </p>
          <p className="text-[#444B47] dark:text-[#D5DAD7]">
            Kamu sekarang dapat masuk ke akun tokomu menggunakan password baru.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-[#14804A] hover:bg-[#10673C] text-xs text-white"
          >
            Masuk ke Akun
          </Button>
        </div>
      ) : requestSubmitted ? (
        <div className="space-y-4 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-4 text-center text-xs dark:border-[#10673C44] dark:bg-[#10673C22]">
          <p className="font-semibold text-[#14804A] dark:text-[#1EA65E]">
            Permintaan Terkirim
          </p>
          <p className="text-[#444B47] dark:text-[#D5DAD7]">
            Jika email terdaftar, instruksi dan kode token reset telah dikirimkan ke kotak masukmu.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmMode(true)}
              className="gap-2 text-xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#14804A]" />
              Sudah Memiliki Token? Konfirmasi di Sini
            </Button>
            <Link
              href="/login"
              className="font-semibold text-[#14804A] hover:underline dark:text-[#1EA65E]"
            >
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      ) : isConfirmMode ? (
        /* Confirm Reset Password Form */
        <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Token Reset Password
            </label>
            <Input
              required
              type="text"
              placeholder="Masukkan token dari email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Password Baru
            </label>
            <Input
              required
              type="password"
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Ulangi Password Baru
            </label>
            <Input
              required
              type="password"
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] bg-[#14804A] py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]"
          >
            {loading ? "Memperbarui Password..." : "Simpan Password Baru"}
          </Button>

          <div className="flex items-center justify-between text-xs text-[#737B76] dark:text-[#98A09B]">
            <button
              type="button"
              onClick={() => setIsConfirmMode(false)}
              className="text-[#14804A] hover:underline dark:text-[#1EA65E]"
            >
              &larr; Minta token baru
            </button>
            <Link href="/login" className="hover:underline">
              Masuk
            </Link>
          </div>
        </form>
      ) : (
        /* Request Reset Password Form */
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
              Alamat Email
            </label>
            <Input
              required
              type="email"
              placeholder="nama@bisnis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] bg-[#14804A] py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]"
          >
            {loading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
          </Button>

          <div className="flex items-center justify-between text-xs text-[#737B76] dark:text-[#98A09B]">
            <button
              type="button"
              onClick={() => setIsConfirmMode(true)}
              className="text-[#14804A] hover:underline dark:text-[#1EA65E]"
            >
              Sudah punya token?
            </button>
            <Link
              href="/login"
              className="font-semibold text-[#14804A] hover:underline dark:text-[#1EA65E]"
            >
              Masuk
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Memuat form pemulihan..." />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
