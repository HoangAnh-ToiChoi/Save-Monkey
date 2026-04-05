import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variants: {
    variant: {
      default: "bg-primary-600 text-white hover:bg-primary-500 shadow-glow",
      surface: "bg-surface-800 text-foreground hover:bg-surface-700 border border-surface-700",
      ghost: "hover:bg-surface-800 hover:text-foreground text-surface-300",
      danger: "bg-danger-600 text-white hover:bg-danger-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
      outline: "border border-surface-600 text-foreground hover:bg-surface-800",
    },
    size: {
      default: "h-11 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-sm",
      lg: "h-14 rounded-xl px-8 text-lg font-medium",
      icon: "h-11 w-11",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  const variantClass = buttonVariants.variants.variant[variant] || buttonVariants.variants.variant.default
  const sizeClass = buttonVariants.variants.size[size] || buttonVariants.variants.size.default
  
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        variantClass,
        sizeClass,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
