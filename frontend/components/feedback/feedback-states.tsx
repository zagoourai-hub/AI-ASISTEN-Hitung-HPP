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

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-[#E8ECE9] motion-reduce:animate-none dark:bg-[#2B312E]", className)}
      {...props}
    />
  )
}

export function PageSkeleton({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label={label}
      className="min-h-[100dvh] space-y-6 p-4 sm:p-6 lg:p-8"
    >
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-[18px] border border-[#E8ECE9] bg-white p-5 dark:border-[#2B312E] dark:bg-[#161A18]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[18px] lg:col-span-2" />
        <Skeleton className="h-64 rounded-[18px]" />
      </div>
      <span className="sr-only">{label}</span>
    </main>
  )
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Memuat dashboard..." className="space-y-6 pb-12">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-[18px] border border-[#E8ECE9] bg-white p-5 dark:border-[#2B312E] dark:bg-[#161A18]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-3 h-8 w-32" />
                <Skeleton className="mt-2 h-3 w-36" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-[18px] lg:col-span-1" />
        <Skeleton className="h-72 rounded-[18px]" />
        <Skeleton className="h-72 rounded-[18px]" />
      </div>
      <span className="sr-only">Memuat dashboard...</span>
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
          type="button"
          onClick={onRetry}
          className="min-h-11 shrink-0 rounded-md px-2 py-1 font-semibold underline outline-none hover:text-[#7F1D1D] focus-visible:ring-2 focus-visible:ring-[#14804A]"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}
