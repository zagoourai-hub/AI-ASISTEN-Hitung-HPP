import React from "react"
import { AlertCircle, Loader2, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingSpinner({
  label = "Memuat data...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center py-12 text-center", className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#14804A]" />
      <span className="mt-2 text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
        {label}
      </span>
    </div>
  )
}

export function EmptyState({
  title = "Belum Ada Data",
  description = "Mulai tambahkan data untuk melihat ringkasan di sini.",
  action,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#D5DAD7] bg-[#FAFBFA] p-8 text-center dark:border-[#2B312E] dark:bg-[#161A18]", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4] text-[#737B76] dark:bg-[#232826]">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#161A18] dark:text-[#FAFBFA]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-[#737B76] dark:text-[#98A09B]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorBanner({
  code,
  message,
  onRetry,
}: {
  code?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A]/40 dark:text-[#FCA5A5]"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
        <div>
          {code && <span className="font-bold mr-1.5">[{code}]</span>}
          <span>{message}</span>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-semibold underline hover:text-[#7F1D1D] shrink-0"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}
