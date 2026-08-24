"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FileText,
  Tag,
  Sparkles,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Produk", href: "/products", icon: Package },
  { label: "Bahan Baku", href: "/ingredients", icon: FileText },
  { label: "Harga Pintar", href: "/pricing", icon: Tag },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { label: "Laporan", href: "/reports", icon: BarChart3 },
  { label: "Pengaturan", href: "/settings/business", icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  businessName?: string
  email?: string
  onLogout: () => void
  isLoggingOut?: boolean
}

export function Sidebar({
  isOpen,
  onToggle,
  businessName = "Bisnis",
  email = "",
  onLogout,
  isLoggingOut = false,
}: SidebarProps) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  const labelTransition = { duration: shouldReduceMotion ? 0 : 0.18 }

  return (
    <motion.aside
      id="desktop-sidebar"
      layout
      initial={false}
      transition={{
        layout: {
          duration: shouldReduceMotion ? 0 : 0.3,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col justify-between overflow-hidden border-r border-[#E8ECE9] bg-white py-6 lg:flex dark:border-[#2B312E] dark:bg-[#161A18]",
        isOpen ? "w-64 px-4" : "w-20 px-3"
      )}
    >
      {/* Brand Logo */}
      <div className="space-y-6">
        <div
          className={cn(
            "flex",
            isOpen ? "items-center justify-between" : "flex-col items-center gap-3"
          )}
        >
          <Link
            href="/"
            aria-label="HPP Pintar"
            className={cn(
              "flex min-w-0 items-center",
              isOpen ? "gap-3 px-2" : "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
              {/* 3-bar logo mark */}
              <div className="flex items-end gap-1">
                <span className="h-3 w-1 rounded-full bg-[#14804A]" />
                <span className="h-5 w-1 rounded-full bg-[#14804A]" />
                <span className="h-4 w-1 rounded-full bg-[#14804A]" />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  key="brand-label"
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={labelTransition}
                  className="whitespace-nowrap text-lg font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]"
                >
                  HPP Pintar
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <motion.button
            type="button"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
            onClick={onToggle}
            aria-controls="desktop-sidebar"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
            title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#737B76] outline-none transition-colors hover:bg-[#F3F5F4] hover:text-[#161A18] focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 dark:text-[#98A09B] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA] dark:focus-visible:ring-offset-[#161A18]"
          >
            {isOpen ? (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            )}
          </motion.button>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href)

            const Icon = item.icon

            return (
              <Link
                key={item.href}
                aria-label={isOpen ? undefined : item.label}
                title={isOpen ? undefined : item.label}
                href={item.href}
                className={cn(
                  "group flex items-center overflow-hidden rounded-xl py-2.5 text-sm font-medium transition-all duration-150",
                  isOpen ? "gap-3 px-3" : "justify-center px-2",
                  isActive
                    ? "bg-[#EEF9F2] text-[#14804A] font-semibold dark:bg-[#10673C33] dark:text-[#1EA65E]"
                    : "text-[#5F6762] hover:bg-[#F3F5F4] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA]"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-[#14804A] dark:text-[#1EA65E]"
                      : "text-[#737B76] group-hover:text-[#161A18] dark:text-[#98A09B] dark:group-hover:text-[#FAFBFA]"
                  )}
                />
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      key={`${item.href}-label`}
                      initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={labelTransition}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile / Plan Badge & Theme Toggle */}
      <div className="space-y-3 border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]">
        <div
          className={cn(
            "flex items-center px-1",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.span
                key="theme-label"
                initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={labelTransition}
                className="whitespace-nowrap text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]"
              >
                Tema Tampilan
              </motion.span>
            )}
          </AnimatePresence>
          <ThemeToggle className="h-8 w-8 rounded-lg" />
        </div>

        <div
          className={cn(
            "flex items-center rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] dark:border-[#2B312E] dark:bg-[#111315]",
            isOpen ? "justify-between p-3" : "justify-center p-2"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10673C] font-semibold text-white">
              {businessName.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                {businessName}
              </span>
              <span className="text-[11px] font-medium text-[#14804A] dark:text-[#1EA65E]">
                {email || "Akun pemilik"}
              </span>
            </div>
          </div>
          {isOpen && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={labelTransition}
            >
              <ChevronDown className="h-4 w-4 text-[#737B76]" aria-hidden="true" />
            </motion.div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#737B76] hover:bg-[#F3F5F4] hover:text-[#C63C3C] disabled:opacity-50 dark:hover:bg-[#232826]"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </motion.aside>
  )
}
