import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
}

export const metadata: Metadata = {
  title: "HPP Pintar — Hitung HPP & Harga Jual UMKM",
  description: "Aplikasi kalkulasi HPP deterministik dan simulasi harga berbasis margin untuk UMKM F&B Indonesia.",
}

import { AppShell } from "@/components/app-shell"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("h-full antialiased", inter.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#F8FAF9] text-[#161A18] font-sans dark:bg-[#111315] dark:text-[#FAFBFA]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
