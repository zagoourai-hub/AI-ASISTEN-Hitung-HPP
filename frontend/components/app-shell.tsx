"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password")

  if (isAuthPage) {
    return <main className="min-h-[100dvh]">{children}</main>
  }

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row bg-[#F8FAF9] dark:bg-[#111315]">
      {/* Desktop Sidebar (1024px+) */}
      <Sidebar />

      {/* Mobile Top App Bar (<1024px for Android / Samsung) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E8ECE9] bg-white/95 px-4 backdrop-blur-md dark:border-[#2B312E] dark:bg-[#161A18]/95 lg:hidden shadow-2xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF9F2] text-[#14804A] dark:bg-[#10673C33] dark:text-[#1EA65E]">
            <div className="flex items-end gap-0.5">
              <span className="h-2.5 w-1 rounded-full bg-[#14804A]" />
              <span className="h-4.5 w-1 rounded-full bg-[#14804A]" />
              <span className="h-3 w-1 rounded-full bg-[#14804A]" />
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
            HPP Pintar
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle className="h-8 w-8 rounded-lg" />
          <Link
            href="/settings/business"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDF5E7] font-bold text-xs text-[#10673C] dark:bg-[#10673C44] dark:text-[#1EA65E]"
            aria-label="Profil Pengaturan"
          >
            SW
          </Link>
        </div>
      </header>

      {/* Main Content Area with Responsive Padding & Safe Area */}
      <main className="flex-1 pl-0 lg:pl-64 transition-all duration-200 min-w-0">
        <div className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (<1024px) */}
      <MobileNav />
    </div>
  )
}
