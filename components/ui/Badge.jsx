import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  variants: {
    variant: {
      default: "border-transparent bg-primary-500 text-white hover:bg-primary-600",
      secondary: "border-transparent bg-surface-800 text-surface-100 hover:bg-surface-700",
      destructive: "border-transparent bg-danger-500 text-white hover:bg-danger-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
      outline: "text-foreground border-surface-600 text-surface-300",
      success: "border-transparent bg-success-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]",
      warning: "border-transparent bg-warning-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]"
    },
  },
  defaultVariants: {
    variant: "default",
  },
}

function Badge({ className, variant = "default", ...props }) {
  const variantClass = badgeVariants.variants.variant[variant] || badgeVariants.variants.variant.default

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background",
        variantClass,
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
