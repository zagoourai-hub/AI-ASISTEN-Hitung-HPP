"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { confirmPasswordReset, requestPasswordReset } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { CheckCircle2, KeyRound } from "lucide-react"

interface RequestFormValues { email: string }
interface ConfirmFormValues { token: string; new_password: string; confirm_password: string }

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get("token") || ""
  const [isConfirmMode, setIsConfirmMode] = useState(Boolean(tokenFromUrl))
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const requestForm = useForm<RequestFormValues>({ defaultValues: { email: "" } })
  const confirmForm = useForm<ConfirmFormValues>({ defaultValues: { token: tokenFromUrl, new_password: "", confirm_password: "" } })
  const requestMutation = useMutation({ mutationFn: requestPasswordReset, onSuccess: () => setRequestSubmitted(true) })
  const confirmMutation = useMutation({ mutationFn: confirmPasswordReset, onSuccess: () => setConfirmSuccess(true) })
  const activeError = requestMutation.error ?? confirmMutation.error
  const error = activeError instanceof ApiError ? activeError : null

  return (
    <div className="space-y-6">
      <div className="text-center"><h1 className="text-xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">{isConfirmMode ? "Tetapkan Password Baru" : "Atur Ulang Password"}</h1><p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">{isConfirmMode ? "Masukkan token verifikasi dan password baru untuk akun tokomu." : "Masukkan email terdaftar untuk menerima instruksi pemulihan."}</p></div>
      {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} />}
      {confirmSuccess ? (
        <div className="space-y-4 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-4 text-center text-xs"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#14804A] text-white"><CheckCircle2 className="h-5 w-5" /></div><p className="font-semibold text-[#14804A]">Password Berhasil Diubah!</p><p>Kamu sekarang dapat masuk menggunakan password baru.</p><Button onClick={() => router.push("/login")} className="w-full bg-[#14804A] text-xs text-white">Masuk ke Akun</Button></div>
      ) : requestSubmitted ? (
        <div className="space-y-4 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-4 text-center text-xs"><p className="font-semibold text-[#14804A]">Permintaan Terkirim</p><p>Jika email terdaftar, instruksi pemulihan telah dikirimkan ke kotak masukmu.</p><div className="flex flex-col gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setIsConfirmMode(true)} className="gap-2 text-xs"><KeyRound className="h-3.5 w-3.5 text-[#14804A]" />Sudah Memiliki Token? Konfirmasi di Sini</Button><Link href="/login" className="font-semibold text-[#14804A] hover:underline">Kembali ke Halaman Masuk</Link></div></div>
      ) : isConfirmMode ? (
        <form onSubmit={confirmForm.handleSubmit((values) => confirmMutation.mutate({ token: values.token, new_password: values.new_password }))} className="space-y-4 text-xs">
          <div className="space-y-1.5"><label htmlFor="reset-token" className="font-semibold">Token Reset Password</label><Input id="reset-token" placeholder="Masukkan token dari email" {...confirmForm.register("token", { required: "Token wajib diisi.", minLength: { value: 16, message: "Token tidak valid." } })} />{confirmForm.formState.errors.token && <p role="alert" className="text-[11px] text-[#DC2626]">{confirmForm.formState.errors.token.message}</p>}</div>
          <div className="space-y-1.5"><label htmlFor="new-password" className="font-semibold">Password Baru</label><Input id="new-password" type="password" placeholder="Minimal 8 karakter" {...confirmForm.register("new_password", { required: "Password wajib diisi.", minLength: { value: 8, message: "Password minimal 8 karakter." } })} />{confirmForm.formState.errors.new_password && <p role="alert" className="text-[11px] text-[#DC2626]">{confirmForm.formState.errors.new_password.message}</p>}</div>
          <div className="space-y-1.5"><label htmlFor="confirm-password" className="font-semibold">Ulangi Password Baru</label><Input id="confirm-password" type="password" placeholder="Ketik ulang password baru" {...confirmForm.register("confirm_password", { required: "Konfirmasi password wajib diisi.", validate: (value) => value === confirmForm.getValues("new_password") || "Password tidak sama." })} />{confirmForm.formState.errors.confirm_password && <p role="alert" className="text-[11px] text-[#DC2626]">{confirmForm.formState.errors.confirm_password.message}</p>}</div>
          <Button type="submit" disabled={confirmMutation.isPending} className="w-full rounded-[12px] bg-[#14804A] py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]">{confirmMutation.isPending ? "Memperbarui Password..." : "Simpan Password Baru"}</Button>
          <div className="flex items-center justify-between text-xs text-[#737B76]"><button type="button" onClick={() => setIsConfirmMode(false)} className="text-[#14804A] hover:underline">&larr; Minta token baru</button><Link href="/login" className="hover:underline">Masuk</Link></div>
        </form>
      ) : (
        <form onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))} className="space-y-4 text-xs">
          <div className="space-y-1.5"><label htmlFor="reset-email" className="font-semibold">Alamat Email</label><Input id="reset-email" type="email" placeholder="nama@bisnis.com" {...requestForm.register("email", { required: "Email wajib diisi." })} />{requestForm.formState.errors.email && <p role="alert" className="text-[11px] text-[#DC2626]">{requestForm.formState.errors.email.message}</p>}</div>
          <Button type="submit" disabled={requestMutation.isPending} className="w-full rounded-[12px] bg-[#14804A] py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]">{requestMutation.isPending ? "Mengirim Tautan..." : "Kirim Tautan Reset"}</Button>
          <div className="flex items-center justify-between text-xs text-[#737B76]"><button type="button" onClick={() => setIsConfirmMode(true)} className="text-[#14804A] hover:underline">Sudah punya token?</button><Link href="/login" className="font-semibold text-[#14804A] hover:underline">Masuk</Link></div>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<LoadingSpinner label="Memuat form pemulihan..." />}><ResetPasswordContent /></Suspense>
}
