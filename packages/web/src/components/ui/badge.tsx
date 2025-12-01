import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { themeColors } from "@/styles/theme-colors"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        orange: cn("border-transparent", themeColors.warning.bg, themeColors.warning.text),
        purple: cn("border-transparent", themeColors.primary.bg, themeColors.primary.text),
        teal: cn("border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400"),
        green: cn("border-transparent", themeColors.success.bg, themeColors.success.text),
        yellow: cn("border-transparent", themeColors.warning.bg, themeColors.warning.text),
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }