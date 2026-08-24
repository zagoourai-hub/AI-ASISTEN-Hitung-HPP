import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixNode?: React.ReactNode
  suffixNode?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefixNode, suffixNode, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {prefixNode && (
          <div className="absolute left-3.5 text-xs font-medium text-[#737B76] pointer-events-none select-none">
            {prefixNode}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-[12px] border border-[#E8ECE9] bg-[#FAFBFA] py-2 text-xs font-medium text-[#161A18] shadow-xs transition-colors placeholder:text-[#98A09B] focus-visible:border-[#14804A] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#14804A] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA]",
            prefixNode ? "pl-10 pr-3.5" : suffixNode ? "pl-3.5 pr-10" : "px-3.5",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffixNode && (
          <div className="absolute right-3.5 text-xs font-medium text-[#737B76] pointer-events-none select-none">
            {suffixNode}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
