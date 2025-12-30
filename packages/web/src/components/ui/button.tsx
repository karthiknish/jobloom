import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] transition-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-primary/20 bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/30 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-premium-xl transition-all duration-fast hover:-translate-y-0.5 active:translate-y-0 font-bold rounded-xl",
        "gradient-premium": "bg-gradient-to-br from-[var(--gradient-premium-from)] to-[var(--gradient-premium-to)] hover:shadow-premium-xl transition-all duration-fast hover:-translate-y-0.5 active:translate-y-0 text-white font-bold shadow-md rounded-xl",
        "gradient-secondary": "bg-gradient-to-br from-[var(--gradient-secondary-from)] to-[var(--gradient-secondary-to)] text-secondary-foreground hover:bg-secondary/80 hover:shadow-premium-lg transition-all duration-fast hover:-translate-y-0.5 active:translate-y-0 font-bold shadow-sm border border-border rounded-xl",
        motion: "transition-all duration-fast ease-out-custom hover:-translate-y-0.5 hover:shadow-lg active:-translate-y-0.25 active:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        xs: "h-8 rounded-md px-3 text-xs min-h-[34px]",
        sm: "h-9 rounded-md px-3 min-h-[36px]",
        lg: "h-11 rounded-md px-8 min-h-[44px]",
        xl: "h-12 rounded-lg px-10 text-base min-h-[48px]",
        "2xl": "h-14 rounded-xl px-12 text-lg min-h-[56px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        touch: "h-11 px-4 min-h-[44px] min-w-[44px]",
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
    const Comp = asChild ? Slot : "button"
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
