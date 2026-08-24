"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FileText,
  Tag,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Produk", href: "/products", icon: Package },
  { label: "Bahan", href: "/ingredients", icon: FileText },
  { label: "Harga", href: "/pricing", icon: Tag },
  { label: "AI", href: "/ai-assistant", icon: Sparkles },
  { label: "Akun", href: "/settings/business", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-[#E8ECE9] bg-white/95 px-2 backdrop-blur-md dark:border-[#2B312E] dark:bg-[#161A18]/95 lg:hidden safe-area-bottom shadow-lg"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-all active:scale-95",
              isActive
                ? "text-[#14804A] font-semibold dark:text-[#1EA65E]"
                : "text-[#737B76] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:text-[#FAFBFA]"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                isActive
                  ? "bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]"
                  : "text-current"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
