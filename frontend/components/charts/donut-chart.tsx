"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface DonutSegment {
  name: string
  value: number
  amount?: string
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  centerLabel?: string
  centerValue?: string
  totalPercentage?: string
  layout?: "auto" | "vertical" | "horizontal"
  size?: number
  className?: string
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  totalPercentage,
  layout = "auto",
  size = 140,
  className,
}: DonutChartProps) {
  const total = segments.reduce((acc, curr) => acc + curr.value, 0) || 1
  const strokeWidth = Math.round(size * 0.15)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const isVertical = layout === "vertical"
  const isHorizontal = layout === "horizontal"

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-5",
        isVertical ? "flex-col" : isHorizontal ? "flex-row" : "flex-col sm:flex-row",
        className
      )}
    >
      {/* SVG Donut */}
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {segments.map((seg, idx) => {
            const priorSum = segments.slice(0, idx).reduce((acc, s) => acc + s.value, 0)
            const strokeDasharray = `${(seg.value / total) * circumference} ${circumference}`
            const strokeDashoffset = -(priorSum / total) * circumference

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>

        {/* Center Text */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            {centerLabel && (
              <span className="text-[10px] font-medium text-[#737B76] leading-tight dark:text-[#98A09B]">
                {centerLabel}
              </span>
            )}
            {centerValue && (
              <span className="text-xs font-bold text-[#161A18] leading-tight dark:text-[#FAFBFA]">
                {centerValue}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend list */}
      <div className="flex flex-1 flex-col justify-center space-y-2 w-full min-w-0">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium text-[#444B47] truncate text-[11px] dark:text-[#D5DAD7]">
                {seg.name}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums shrink-0">
              {seg.amount && (
                <span className="text-[11px] font-medium text-[#737B76] dark:text-[#98A09B]">
                  {seg.amount}
                </span>
              )}
              <span className="text-[11px] font-bold text-[#161A18] dark:text-[#FAFBFA]">
                {seg.value.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}

        {totalPercentage && (
          <div className="mt-2 flex items-center justify-between border-t border-[#E8ECE9] pt-2 text-xs font-semibold text-[#161A18] dark:border-[#2B312E] dark:text-[#FAFBFA]">
            <span>Total</span>
            <span className="tabular-nums">{totalPercentage}</span>
          </div>
        )}
      </div>
    </div>
  )
}
