import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button Hierarchy:
 * - default (Primary): Main actions, solid bg, one per section
 * - secondary: Alternative actions, muted bg
 * - outline: Less emphasis, border only
 * - ghost: Minimal, no visible styling until hover (tertiary)
 * - link: Inline text actions
 * - destructive: Dangerous/irreversible actions
 * - premium: CTAs with gradient and elevation
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background motion-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Main call-to-action, solid background
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow",
        // Secondary: Alternative action, muted styling
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        // Outline: Less emphasis, border only
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent",
        // Ghost/Tertiary: Minimal styling, icon buttons
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Link: Inline text actions
        link: "text-primary underline-offset-4 hover:underline",
        // Destructive: Dangerous actions (delete, remove)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow",
        // Premium: CTAs with gradient and elevation effect
        premium: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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