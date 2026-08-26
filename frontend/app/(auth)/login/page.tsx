"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { login } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { useToast } from "@/components/feedback/toast-provider"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react"

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } })
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      queryClient.setQueryData(["auth", "me"], session)
      toast({ variant: "success", title: "Login berhasil", description: "Selamat datang kembali di HPP Pintar." })
      router.replace("/")
    },
    onError: (requestError: unknown) => {
      const apiError = requestError instanceof ApiError ? requestError : null
      toast({
        variant: "error",
        title: "Login gagal",
        description: apiError ? mapSemanticErrorToMessage(apiError.code, apiError.message) : "Periksa koneksi backend lalu coba lagi.",
      })
    },
  })
  const error = mutation.error instanceof ApiError ? mutation.error : null

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">Masuk ke Akun</h2>
        <p className="text-xs text-[#737B76] dark:text-[#98A09B]">Akses dashboard kalkulasi HPP dan strategi harga tokomu.</p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-dashed border-[#D5DAD7] bg-[#F3F5F4]/60 p-2.5 dark:border-[#2B312E] dark:bg-[#161A18]/60">
        <div className="flex items-center gap-2 text-xs"><Sparkles className="h-3.5 w-3.5 shrink-0 text-[#14804A] dark:text-emerald-400" /><span className="text-[11px] text-[#444B47] dark:text-[#98A09B]">Uji coba dengan akun demo?</span></div>
        <button type="button" onClick={() => form.reset({ email: "owner@kopititiktemu.com", password: "Rahasia123!" })} className="text-[11px] font-semibold text-[#14804A] hover:underline dark:text-emerald-400">Isi Otomatis</button>
      </div>

      {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} />}

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block font-medium text-[#161A18] dark:text-[#FAFBFA]">Email Bisnis</label>
          <Input id="login-email" type="email" placeholder="nama@bisnis.com" prefixNode={<Mail className="h-4 w-4 text-[#737B76]" />} className="h-10 rounded-[12px] bg-white dark:bg-[#161A18]" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email", { required: "Email wajib diisi." })} />
          {form.formState.errors.email && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><label htmlFor="login-password" className="block font-medium text-[#161A18] dark:text-[#FAFBFA]">Password</label><Link href="/reset-password" className="text-[11px] font-medium text-[#14804A] hover:underline dark:text-emerald-400">Lupa password?</Link></div>
          <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" prefixNode={<Lock className="h-4 w-4 text-[#737B76]" />} suffixNode={<button type="button" onClick={() => setShowPassword((value) => !value)} className="inline-flex size-8 items-center justify-center rounded-lg text-[#737B76] hover:text-[#161A18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] dark:hover:text-[#FAFBFA]" aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} className="h-10 rounded-[12px] bg-white dark:bg-[#161A18]" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password", { required: "Password wajib diisi." })} />
          {form.formState.errors.password && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="h-10 w-full gap-2 rounded-[12px] bg-[#092B19] text-xs font-semibold text-white hover:bg-[#104227] dark:bg-[#14804A] dark:hover:bg-[#10673C]">{mutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memverifikasi...</> : <>Masuk ke Aplikasi <ArrowRight className="h-3.5 w-3.5" /></>}</Button>
      </form>

      <div className="border-t border-[#E8ECE9] pt-4 text-center text-xs text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">Belum punya akun bisnis? <Link href="/register" className="font-bold text-[#14804A] hover:underline dark:text-emerald-400">Daftar akun</Link></div>
    </div>
  )
}
