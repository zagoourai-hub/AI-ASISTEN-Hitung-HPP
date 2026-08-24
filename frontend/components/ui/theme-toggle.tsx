"use client"

import React, { useSyncExternalStore } from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener("change", callback)
  return () => {
    window.removeEventListener("storage", callback)
    media.removeEventListener("change", callback)
  }
}

function getSnapshot(): "dark" | "light" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getServerSnapshot(): "dark" | "light" {
  return "light"
}

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isDark = theme === "dark"

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark"
    localStorage.setItem("theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    window.dispatchEvent(new Event("storage"))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      title={isDark ? "Mode Terang" : "Mode Gelap"}
      className={cn(
        "group relative flex items-center justify-center gap-2 rounded-xl border border-[#E8ECE9] bg-white p-2 text-[#444B47] transition-all hover:bg-[#F3F5F4] hover:text-[#161A18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#98A09B] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA] active:scale-95 shadow-xs cursor-pointer",
        showLabel ? "px-3 py-1.5" : "h-9 w-9",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Moon className="h-4 w-4 text-[#FBBF24] transition-transform group-hover:rotate-12" />
        ) : (
          <Sun className="h-4 w-4 text-[#14804A] transition-transform group-hover:rotate-45" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-[#161A18] dark:text-[#FAFBFA]">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      )}
    </button>
  )
}
