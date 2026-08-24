"use client"

import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface HeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: string
  showDemoButton?: boolean
  showPeriodSelector?: boolean
}

export function Header({
  title,
  subtitle,
  breadcrumb,
  showDemoButton = false,
  showPeriodSelector = true,
}: HeaderProps) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs font-medium text-[#737B76] dark:text-[#98A09B]">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[#161A18] dark:text-[#FAFBFA]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-[#737B76] dark:text-[#98A09B]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {showPeriodSelector && (
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#E8ECE9] bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-medium text-[#232826] shadow-xs dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#737B76]" />
            <span className="text-[#737B76] hidden xs:inline">Periode:</span>
            <span className="font-semibold text-[#161A18] dark:text-[#FAFBFA]">Mei 2025</span>
            <ChevronDown className="ml-0.5 sm:ml-1 h-3.5 w-3.5 text-[#737B76]" />
          </div>
        )}

        {showDemoButton ? (
          <Button variant="default" size="sm" className="rounded-xl px-3 sm:px-4 text-xs font-semibold">
            Coba Demo Gratis
          </Button>
        ) : (
          <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-[#E8ECE9] bg-white px-3 py-1.5 shadow-xs dark:border-[#2B312E] dark:bg-[#161A18]">
            <div className="h-7 w-7 overflow-hidden rounded-full bg-[#DDF5E7] flex items-center justify-center font-bold text-xs text-[#10673C] dark:bg-[#10673C44] dark:text-[#1EA65E]">
              SW
            </div>
            <div className="hidden flex-col text-left md:flex">
              <span className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
                Workspace Bisnis
              </span>
              <span className="text-[10px] text-[#737B76] dark:text-[#98A09B]">
                Pemilik Bisnis
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#737B76]" />
          </div>
        )}

        {/* Theme Toggle Button (Desktop header) */}
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
