import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]",
        secondary: "bg-[#F3F5F4] text-[#444B47] dark:bg-[#232826] dark:text-[#D5DAD7]",
        destructive: "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D33] dark:text-[#F87171]",
        warning: "bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F33] dark:text-[#FBBF24]",
        outline: "border border-[#D5DAD7] text-[#444B47] dark:border-[#2B312E] dark:text-[#D5DAD7]",
        success: "bg-[#DDF5E7] text-[#10673C] dark:bg-[#10673C33] dark:text-[#1EA65E]",
        info: "bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A33] dark:text-[#60A5FA]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
