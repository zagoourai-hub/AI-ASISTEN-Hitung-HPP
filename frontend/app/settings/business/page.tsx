"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { CheckCircle2, ChevronDown } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { getBusiness, updateBusiness, type BusinessUpdatePayload } from "@/lib/api/business"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { parseDecimalToNumber } from "@/lib/format"
import type { RoundingStrategy } from "@/lib/types/api"

interface BusinessFormValues {
  name: string
  targetMargin: string
  roundingStrategy: RoundingStrategy
  customRounding: string
}

const DEFAULT_VALUES: BusinessFormValues = {
  name: "",
  targetMargin: "30",
  roundingStrategy: "NEAREST_100",
  customRounding: "",
}

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient()
  const form = useForm<BusinessFormValues>({ defaultValues: DEFAULT_VALUES })
  const businessQuery = useQuery({
    queryKey: ["business"],
    queryFn: ({ signal }) => getBusiness(signal),
  })
  const roundingStrategy = useWatch({ control: form.control, name: "roundingStrategy" })
  const mutation = useMutation({
    mutationFn: (values: BusinessFormValues): Promise<unknown> => {
      const payload: BusinessUpdatePayload = {
        name: values.name.trim(),
        default_target_margin: (Number(values.targetMargin) / 100).toFixed(4),
        rounding_strategy: values.roundingStrategy,
        custom_rounding: values.roundingStrategy === "CUSTOM" ? values.customRounding : null,
      }
      return updateBusiness(payload)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["business"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ])
    },
  })

  useEffect(() => {
    const business = businessQuery.data?.data
    if (!business) return
    const setting = business.pricing_setting
    form.reset({
      name: business.name,
      targetMargin: String(parseDecimalToNumber(business.default_target_margin) * 100),
      roundingStrategy: setting?.rounding_strategy ?? "NEAREST_100",
      customRounding: setting?.custom_rounding ?? "",
    })
  }, [businessQuery.data, form])

  if (businessQuery.isPending) return <LoadingSpinner label="Memuat pengaturan bisnis..." />

  const queryError = businessQuery.error instanceof ApiError ? businessQuery.error : null
  const mutationError = mutation.error instanceof ApiError ? mutation.error : null
  const error = queryError ?? mutationError

  if (queryError) {
    return (
      <ErrorBanner
        code={queryError.code}
        message={mapSemanticErrorToMessage(queryError.code, queryError.message)}
        onRetry={() => businessQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Pengaturan Bisnis"
        subtitle="Kelola profil bisnis, mata uang default, dan strategi penetapan margin."
        showPeriodSelector={false}
      />

      {error && (
        <ErrorBanner
          code={error.code}
          message={mapSemanticErrorToMessage(error.code, error.message)}
          onRetry={() => mutation.reset()}
        />
      )}

      {mutation.isSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3.5 text-xs font-semibold text-[#148A4E]"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Pengaturan bisnis berhasil diperbarui.</span>
        </div>
      )}

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-6"
      >
        <section aria-label="Profil Usaha">
          <Card className="space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle>Profil Usaha</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs">
                <label htmlFor="business-name" className="font-semibold">
                  Nama Bisnis
                </label>
                <Input
                  id="business-name"
                  placeholder="Nama Brand / Usaha"
                  {...form.register("name", { required: "Nama bisnis wajib diisi." })}
                />
                {form.formState.errors.name && (
                  <p role="alert" className="text-[11px] text-[#DC2626]">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                <label htmlFor="business-currency" className="font-semibold">
                  Mata Uang (MVP)
                </label>
                <Input
                  id="business-currency"
                  disabled
                  value="IDR (Rupiah Indonesia)"
                  className="cursor-not-allowed bg-[#F3F5F4] dark:bg-[#232826]"
                />
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Pengaturan Margin & Pembulatan">
          <Card className="space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle>Strategi Harga & Margin Default</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs">
                <label htmlFor="business-target-margin" className="font-semibold">
                  Target Margin Default (%)
                </label>
                <Input
                  id="business-target-margin"
                  type="number"
                  min="0"
                  max="99.9"
                  step="0.1"
                  suffixNode="%"
                  {...form.register("targetMargin", {
                    required: "Target margin wajib diisi.",
                    validate: (value) =>
                      (Number(value) >= 0 && Number(value) < 100) ||
                      "Margin harus 0-99.9%.",
                  })}
                />
                {form.formState.errors.targetMargin && (
                  <p role="alert" className="text-[11px] text-[#DC2626]">
                    {form.formState.errors.targetMargin.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <label htmlFor="business-rounding" className="font-semibold">
                  Strategi Pembulatan
                </label>
                <div className="relative flex items-center">
                  <select
                    id="business-rounding"
                    className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:bg-white focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
                    {...form.register("roundingStrategy")}
                  >
                    <option value="NEAREST_100">Bulatkan ke Ratusan Terdekat</option>
                    <option value="NONE">Tanpa Pembulatan (Eksak)</option>
                    <option value="CUSTOM">Kustom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" />
                </div>
              </div>

              {roundingStrategy === "CUSTOM" && (
                <div className="space-y-1.5 text-xs sm:col-span-2">
                  <label htmlFor="business-custom-rounding" className="font-semibold">
                    Kelipatan Pembulatan Kustom (Rp)
                  </label>
                  <Input
                    id="business-custom-rounding"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Contoh: 500 atau 1000"
                    prefixNode="Rp"
                    {...form.register("customRounding", {
                      required: "Kelipatan kustom wajib diisi.",
                      validate: (value) => Number(value) > 0 || "Harus lebih besar dari 0.",
                    })}
                  />
                  {form.formState.errors.customRounding && (
                    <p role="alert" className="text-[11px] text-[#DC2626]">
                      {form.formState.errors.customRounding.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-[12px] bg-[#14804A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]"
          >
            {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
