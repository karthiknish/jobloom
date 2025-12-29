import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Card Variants:
 * - default: Standard card with subtle shadow
 * - elevated: Higher elevation for prominent content
 * - flat: No shadow, just border (for nested cards)
 * - interactive: Hover effects for clickable cards
 */
export const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground motion-surface",
  {
    variants: {
      variant: {
        default: "border-border/50 bg-card/95 shadow-premium hover:shadow-premium-lg transition-all duration-300",
        elevated: "border-border/40 bg-card shadow-premium-lg hover:shadow-premium-xl transition-all duration-300",
        flat: "border-border bg-card shadow-none",
        interactive: "border-border/70 bg-card/95 shadow-sm hover:shadow-premium hover:border-primary/30 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        premium: "rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300",
        "premium-elevated": "rounded-2xl border-outline bg-surface shadow-premium-lg hover:shadow-premium-xl hover:-translate-y-1 transition-all duration-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }