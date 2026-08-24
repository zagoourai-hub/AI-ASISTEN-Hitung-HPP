import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[12px] border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#14804A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#14804A] text-white hover:bg-[#10673C] shadow-xs active:bg-[#0D5230]",
        outline:
          "border-[#E8ECE9] bg-white text-[#232826] shadow-xs hover:bg-[#F3F5F4] hover:text-[#161A18] dark:border-[#2B312E] dark:bg-[#161A18] dark:text-[#FAFBFA] dark:hover:bg-[#232826]",
        secondary:
          "bg-[#F3F5F4] text-[#232826] hover:bg-[#E8ECE9] dark:bg-[#232826] dark:text-[#FAFBFA] dark:hover:bg-[#2B312E]",
        ghost:
          "hover:bg-[#F3F5F4] text-[#444B47] hover:text-[#161A18] dark:text-[#98A09B] dark:hover:bg-[#232826] dark:hover:text-[#FAFBFA]",
        destructive:
          "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA] dark:bg-[#7F1D1D33] dark:text-[#F87171]",
        link: "text-[#14804A] underline-offset-4 hover:underline",
        cta: "bg-[#14804A] text-white hover:bg-[#10673C] font-semibold shadow-sm",
      },
      size: {
        default: "h-11 gap-2 px-4 py-2",
        xs: "h-7 gap-1 rounded-[8px] px-2 text-xs",
        sm: "h-9 gap-1.5 rounded-[10px] px-3 text-xs",
        lg: "h-12 gap-2 rounded-[14px] px-6 text-base font-semibold",
        icon: "size-10 rounded-[12px]",
        "icon-sm": "size-8 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
