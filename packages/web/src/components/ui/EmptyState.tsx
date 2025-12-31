"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Icon to display at the top */
  icon: LucideIcon;
  /** Main heading text */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  primaryAction?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional content below the actions */
  children?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Icon color variant */
  iconColor?: "primary" | "muted" | "success" | "warning" | "error";
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning", 
  error: "bg-destructive-soft text-destructive",
};

const sizeClasses = {
  sm: {
    container: "py-8 px-4",
    icon: "icon-lg",
    iconWrapper: "h-14 w-14",
    title: "text-lg",
    description: "text-sm",
  },
  md: {
    container: "py-12 px-6",
    icon: "icon-xl",
    iconWrapper: "h-18 w-18",
    title: "text-xl",
    description: "text-base",
  },
  lg: {
    container: "py-16 px-8",
    icon: "icon-2xl",
    iconWrapper: "h-24 w-24",
    title: "text-2xl",
    description: "text-lg",
  },
};

/**
 * Reusable empty state component with consistent styling
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="No applications yet"
 *   description="Start tracking your job applications by adding your first one."
 *   primaryAction={{ label: "Add Application", onClick: handleAdd }}
 *   secondaryAction={{ label: "Learn More", href: "/help" }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  size = "md",
  className,
  iconColor = "primary",
}: EmptyStateProps) {
  const sizeStyles = sizeClasses[size];

  const renderButton = (action: EmptyStateAction, isPrimary: boolean) => {
    const buttonContent = (
      <>
        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
        {action.label}
      </>
    );

    const variant = action.variant || (isPrimary ? "default" : "outline");
    const buttonSize = size === "sm" ? "sm" : "default";

    if (action.href) {
      return (
        <Button variant={variant} size={buttonSize} onClick={action.onClick} className={isPrimary ? "shadow-md" : ""} asChild>
          <a href={action.href}>{buttonContent}</a>
        </Button>
      );
    }

    return (
      <Button variant={variant} size={buttonSize} onClick={action.onClick} className={isPrimary ? "shadow-md" : ""}>
        {buttonContent}
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-border bg-card",
        sizeStyles.container,
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-4",
          sizeStyles.iconWrapper,
          iconColorClasses[iconColor]
        )}
      >
        <Icon className={sizeStyles.icon} />
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold text-foreground mb-2", sizeStyles.title)}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn("text-muted-foreground max-w-md mb-6", sizeStyles.description)}>
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && renderButton(primaryAction, true)}
          {secondaryAction && renderButton(secondaryAction, false)}
        </div>
      )}

      {/* Additional content */}
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  );
}

/**
 * Compact inline empty state for use in lists or tables
 */
export function EmptyStateInline({
  icon: Icon,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  message: string;
  action?: EmptyStateAction;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-4 px-3 text-muted-foreground",
        className
      )}
    >
      <Icon className="h-5 w-5 opacity-50" />
      <span className="text-sm">{message}</span>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="ml-auto text-primary hover:text-primary/80"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
