"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { register as registerAccount, type RegisterPayload } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import { useToast } from "@/components/feedback/toast-provider"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, Store } from "lucide-react"

interface RegisterFormValues extends RegisterPayload {
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<RegisterFormValues>({
    defaultValues: { email: "", password: "", confirmPassword: "", business_name: "", business_type: "Kuliner", timezone: "Asia/Jakarta", default_target_margin: "0.3000" },
  })
  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) => {
      return registerAccount({
        email: values.email,
        password: values.password,
        business_name: values.business_name,
        business_type: values.business_type,
        timezone: values.timezone,
        default_target_margin: values.default_target_margin,
      })
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["auth", "me"], session)
      toast({ variant: "success", title: "Registrasi berhasil", description: "Bisnis kamu siap dikelola di HPP Pintar." })
      router.replace("/")
    },
    onError: (requestError: unknown) => {
      const apiError = requestError instanceof ApiError ? requestError : null
      toast({
        variant: "error",
        title: "Registrasi gagal",
        description: apiError ? mapSemanticErrorToMessage(apiError.code, apiError.message) : "Periksa koneksi backend lalu coba lagi.",
      })
    },
  })
  const error = mutation.error instanceof ApiError ? mutation.error : null

  return (
    <div className="space-y-6">
      <div className="space-y-1.5"><div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF9F2] px-3 py-0.5 text-[11px] font-semibold text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]"><Sparkles className="h-3 w-3" /><span>Akses Penuh Tanpa Biaya di Masa Pilot</span></div><h2 className="text-2xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA] sm:text-3xl">Mulai Bisnis Lebih Terukur</h2><p className="text-xs text-[#737B76] dark:text-[#98A09B]">Daftarkan tokomu dan buat database bahan baku & formula resep pertamamu.</p></div>
      {error && <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} />}

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-3.5 text-xs">
        <div className="space-y-1.5"><label htmlFor="reg-business" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Nama Bisnis / Brand Toko</label><Input id="reg-business" type="text" placeholder="Contoh: Kopi Titik Temu" prefixNode={<Store className="h-4 w-4 text-[#737B76]" />} className="h-11 rounded-[12px] bg-[#FAFBFA] dark:bg-[#161A18]" {...form.register("business_name", { required: "Nama bisnis wajib diisi." })} />{form.formState.errors.business_name && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.business_name.message}</p>}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="reg-business-type" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Jenis Bisnis</label><Input id="reg-business-type" placeholder="Contoh: Kuliner" {...form.register("business_type", { required: "Jenis bisnis wajib diisi." })} />{form.formState.errors.business_type && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.business_type.message}</p>}</div><div className="space-y-1.5"><label htmlFor="reg-email" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Alamat Email</label><Input id="reg-email" type="email" placeholder="owner@tokomu.com" prefixNode={<Mail className="h-4 w-4 text-[#737B76]" />} {...form.register("email", { required: "Email wajib diisi." })} />{form.formState.errors.email && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.email.message}</p>}</div></div>
        <div className="space-y-1.5"><label htmlFor="reg-password" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Password Akun</label><Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter" prefixNode={<Lock className="h-4 w-4 text-[#737B76]" />} suffixNode={<button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#737B76]" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} className="h-11 rounded-[12px] bg-[#FAFBFA] dark:bg-[#161A18]" {...form.register("password", { required: "Password wajib diisi.", minLength: { value: 8, message: "Password minimal 8 karakter." } })} />{form.formState.errors.password && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.password.message}</p>}</div>
        <div className="space-y-1.5"><label htmlFor="reg-confirm-password" className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Konfirmasi Password</label><Input id="reg-confirm-password" type="password" placeholder="Ketik ulang password" className="h-11 rounded-[12px] bg-[#FAFBFA] dark:bg-[#161A18]" {...form.register("confirmPassword", { required: "Konfirmasi password wajib diisi.", validate: (value) => value === form.getValues("password") || "Password tidak sama." })} />{form.formState.errors.confirmPassword && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.confirmPassword.message}</p>}</div>
        <Button type="submit" disabled={mutation.isPending} className="mt-2 h-11 w-full gap-2 rounded-[12px] bg-[#10673C] text-xs font-semibold text-white hover:bg-[#0D5230]">{mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Mendaftarkan Akun...</> : <>Daftarkan Bisnis Saya <ArrowRight className="h-4 w-4" /></>}</Button>
      </form>

      <div className="border-t border-[#E8ECE9] pt-4 text-center text-xs text-[#737B76] dark:border-[#2B312E] dark:text-[#98A09B]">Sudah memiliki akun terdaftar? <Link href="/login" className="font-bold text-[#14804A] hover:underline dark:text-[#1EA65E]">Masuk di sini &rarr;</Link></div>
    </div>
  )
}
