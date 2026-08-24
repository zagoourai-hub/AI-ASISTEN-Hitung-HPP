"use client"

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { Toast as ToastPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ActiveToast extends ToastOptions {
  id: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[#B7E8C8] bg-[#F2FCF5] text-[#10673C] dark:border-[#10673C66] dark:bg-[#10673C33] dark:text-[#8BE0AC]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A]/50 dark:text-[#FCA5A5]",
  info: "border-[#C7DCCF] bg-[#F4FAF6] text-[#185C39] dark:border-[#2B5D40] dark:bg-[#163322] dark:text-[#A7E1BA]",
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : Info
  return <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null)
  const nextId = useRef(0)

  const toast = useCallback((options: ToastOptions) => {
    nextId.current += 1
    setActiveToast({ ...options, id: nextId.current })
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider duration={3000} swipeDirection="right">
        {children}
        {activeToast && (
          <ToastPrimitive.Root
            key={activeToast.id}
            open
            onOpenChange={(open) => {
              if (!open) setActiveToast(null)
            }}
            className={cn(
              "group relative flex w-full items-start gap-3 rounded-[14px] border p-3.5 pr-10 shadow-lg outline-none transition-all data-[state=closed]:opacity-0 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-right-2",
              variantStyles[activeToast.variant ?? "info"]
            )}
          >
            <ToastIcon variant={activeToast.variant ?? "info"} />
            <div className="min-w-0">
              <ToastPrimitive.Title className="text-xs font-bold">
                {activeToast.title}
              </ToastPrimitive.Title>
              {activeToast.description && (
                <ToastPrimitive.Description className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                  {activeToast.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                className="absolute right-1.5 top-1.5 flex size-11 items-center justify-center rounded-md opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#14804A]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )}
        <ToastPrimitive.Viewport
          aria-label="Notifikasi"
          className="fixed left-1/2 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 outline-none"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside ToastProvider")
  return context
}
