"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface TrendPoint {
  month: string
  value: number
  label?: string
}

interface TrendChartProps {
  data?: TrendPoint[]
  className?: string
}

const DEFAULT_DATA: TrendPoint[] = [
  { month: "Des '24", value: 5200 },
  { month: "Jan '25", value: 6100 },
  { month: "Feb '25", value: 5400 },
  { month: "Mar '25", value: 6800 },
  { month: "Apr '25", value: 6200 },
  { month: "Mei '25", value: 6380, label: "Mei 2025\nRp 6.380" },
]

export function TrendChart({ data = DEFAULT_DATA, className }: TrendChartProps) {
  const minVal = 4000
  const maxVal = 8000
  const chartHeight = 140
  const chartWidth = 320
  const paddingX = 20

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (data.length - 1)) * (chartWidth - paddingX * 2)
    const y = chartHeight - ((val - minVal) / (maxVal - minVal)) * (chartHeight - 30) - 15
    return { x, y }
  }

  const points = data.map((d, i) => getCoordinates(i, d.value))
  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")

  return (
    <div className={cn("relative flex flex-col justify-between", className)}>
      {/* Active tooltip badge on top right / active point */}
      <div className="absolute top-0 right-2 z-10 flex flex-col items-center rounded-lg bg-[#10673C] px-2.5 py-1 text-right text-white shadow-xs">
        <span className="text-[10px] text-[#DDF5E7]">Mei 2025</span>
        <span className="text-xs font-bold tabular-nums">Rp 6.380</span>
      </div>

      <div className="relative h-[150px] w-full pt-4">
        {/* Y-axis guide grid lines */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between text-[10px] text-[#98A09B] pointer-events-none pb-5">
          <div className="flex items-center justify-between border-b border-[#F3F5F4] dark:border-[#2B312E] pb-0.5">
            <span>8.000</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F3F5F4] dark:border-[#2B312E] pb-0.5">
            <span>7.000</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F3F5F4] dark:border-[#2B312E] pb-0.5">
            <span>6.000</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F3F5F4] dark:border-[#2B312E] pb-0.5">
            <span>5.000</span>
          </div>
          <div className="flex items-center justify-between pb-0.5">
            <span>4.000</span>
          </div>
        </div>

        {/* SVG Curve */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {/* Main Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#14804A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-white stroke-[#14804A] stroke-[2.5]"
              />
              {idx === points.length - 1 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  className="fill-[#10673C] animate-pulse"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis Month Labels */}
      <div className="mt-2 flex justify-between px-1 text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}
