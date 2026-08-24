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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Produk", href: "/products", icon: Package },
  { label: "Bahan Baku", href: "/ingredients", icon: FileText },
  { label: "Harga Pintar", href: "/pricing", icon: Tag },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { label: "Laporan", href: "/reports", icon: BarChart3 },
  { label: "Pengaturan", href: "/settings/business", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-[#E8ECE9] bg-white px-4 py-6 lg:flex dark:border-[#2B312E] dark:bg-[#161A18]">
      {/* Brand Logo */}
      <div className="space-y-6">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
            {/* 3-bar logo mark */}
            <div className="flex items-end gap-1">
              <span className="h-3 w-1 rounded-full bg-[#14804A]" />
              <span className="h-5 w-1 rounded-full bg-[#14804A]" />
              <span className="h-4 w-1 rounded-full bg-[#14804A]" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
            HPP Pintar
          </span>
        </Link>

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
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#EEF9F2] text-[#14804A] font-semibold dark:bg-[#10673C33] dark:text-[#1EA65E]"
                    : "text-[#5F6762] hover:bg-[#F3F5F4] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA]"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-[#14804A] dark:text-[#1EA65E]"
                      : "text-[#737B76] group-hover:text-[#161A18] dark:text-[#98A09B] dark:group-hover:text-[#FAFBFA]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile / Plan Badge & Theme Toggle */}
      <div className="space-y-3 border-t border-[#E8ECE9] pt-4 dark:border-[#2B312E]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">
            Tema Tampilan
          </span>
          <ThemeToggle className="h-8 w-8 rounded-lg" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3 dark:border-[#2B312E] dark:bg-[#111315]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10673C] font-semibold text-white">
              R
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Founder Space
              </span>
              <span className="text-[11px] font-medium text-[#14804A] dark:text-[#1EA65E]">
                Pro Plan
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[#737B76]" />
        </div>
      </div>
    </aside>
  )
}
