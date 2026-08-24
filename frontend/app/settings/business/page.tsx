"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, ApiError } from "@/lib/api/client"
import { ErrorBanner, LoadingSpinner } from "@/components/feedback/feedback-states"
import { CheckCircle2, ChevronDown } from "lucide-react"

interface BusinessProfile {
  id: string
  name: string
  currency: string
  pricing_setting?: {
    default_target_margin: string
    rounding_strategy: "NONE" | "NEAREST_100" | "CUSTOM"
    custom_rounding?: string
  }
}

export default function BusinessSettingsPage() {
  const [, setBusiness] = useState<BusinessProfile | null>(null)
  const [name, setName] = useState("")
  const [targetMargin, setTargetMargin] = useState("30")
  const [roundingStrategy, setRoundingStrategy] = useState<"NONE" | "NEAREST_100" | "CUSTOM">("NEAREST_100")
  const [customRounding, setCustomRounding] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<{ code?: string; message: string } | null>(null)

  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await apiClient<{ data: BusinessProfile }>("/business")
        setBusiness(res.data)
        setName(res.data.name)
        if (res.data.pricing_setting) {
          const marginNum = parseFloat(res.data.pricing_setting.default_target_margin) * 100
          setTargetMargin(isNaN(marginNum) ? "30" : marginNum.toString())
          setRoundingStrategy(res.data.pricing_setting.rounding_strategy || "NEAREST_100")
          setCustomRounding(res.data.pricing_setting.custom_rounding || "")
        }
      } catch {
        // Fallback for mock preview if backend is disconnected
        setName("Founder Space")
        setTargetMargin("30")
      } finally {
        setLoading(false)
      }
    }
    loadBusiness()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const marginDecimal = (parseFloat(targetMargin) / 100).toFixed(4)
      await apiClient("/business", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          pricing_setting: {
            default_target_margin: marginDecimal,
            rounding_strategy: roundingStrategy,
            custom_rounding: roundingStrategy === "CUSTOM" ? customRounding : null,
          },
        }),
      })
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message })
      } else {
        setError({ message: "Gagal menyimpan pengaturan bisnis." })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner label="Memuat pengaturan bisnis..." />
  }

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Pengaturan Bisnis"
        subtitle="Kelola profil bisnis, mata uang default, dan strategi penetapan margin."
        showPeriodSelector={false}
      />

      {error && <ErrorBanner code={error.code} message={error.message} />}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#DDF5E7] bg-[#EEF9F2] p-3.5 text-xs font-semibold text-[#14804A] dark:border-[#10673C44] dark:bg-[#10673C22] dark:text-[#1EA65E]"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Pengaturan bisnis berhasil diperbarui!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <section aria-label="Profil Usaha">
          <Card className="space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle>Profil Usaha</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                  Nama Bisnis
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Brand / Usaha"
                />
              </div>
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                  Mata Uang (MVP)
                </label>
                <Input
                  disabled
                  value="IDR (Rupiah Indonesia)"
                  className="bg-[#F3F5F4] dark:bg-[#232826] cursor-not-allowed"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Pricing Strategy Card */}
        <section aria-label="Pengaturan Margin & Pembulatan">
          <Card className="space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle>Strategi Harga & Margin Default</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                  Target Margin Default (%)
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="99.9"
                  step="0.1"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  suffixNode="%"
                />
                <p className="text-[11px] text-[#737B76] dark:text-[#98A09B]">
                  Nilai acuan margin untuk rekomendasi harga produk baru.
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                  Strategi Pembulatan
                </label>
                <div className="relative flex items-center">
                  <select
                    value={roundingStrategy}
                    onChange={(e) =>
                      setRoundingStrategy(
                        e.target.value as "NONE" | "NEAREST_100" | "CUSTOM"
                      )
                    }
                    className="flex h-11 w-full appearance-none rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] px-3.5 pr-9 text-xs font-medium text-[#161A18] shadow-xs focus-visible:border-[#14804A] focus-visible:bg-white focus-visible:outline-none dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]"
                  >
                    <option value="NEAREST_100">Bulatkan ke Ratusan Terdekat (Contoh: 18.500)</option>
                    <option value="NONE">Tanpa Pembulatan (Eksak)</option>
                    <option value="CUSTOM">Kustom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#737B76]" />
                </div>
              </div>

              {roundingStrategy === "CUSTOM" && (
                <div className="space-y-1.5 text-xs sm:col-span-2">
                  <label className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                    Aturan Pembulatan Kustom
                  </label>
                  <Input
                    placeholder="Contoh: 500 atau 1000"
                    value={customRounding}
                    onChange={(e) => setCustomRounding(e.target.value)}
                  />
                </div>
              )}
            </div>
          </Card>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-[12px] bg-[#14804A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#10673C]"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
