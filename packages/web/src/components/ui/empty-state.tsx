"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps["variant"];
  icon?: LucideIcon;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: EmptyStateAction[];
  align?: "center" | "left";
  variant?: "card" | "dashed" | "subtle";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Lightweight, flexible empty state used across the app.
 * Supports consistent icon, title, description, and action rendering.
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  actions = [],
  align = "center",
  variant = "card",
  className,
  children,
}: EmptyStateProps) {
  const isCenter = align === "center";

  const containerClass = cn(
    "rounded-xl border p-8 space-y-4",
    variant === "card" && "bg-card border-border shadow-sm",
    variant === "dashed" && "border-dashed border-muted-foreground/30 bg-background",
    variant === "subtle" && "bg-muted/20 border-muted/30",
    isCenter ? "text-center" : "text-left",
    className
  );

  return (
    <div className={containerClass}>
      {Icon && (
        <div
          className={cn(
            "mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center",
            !isCenter && "mx-0"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}

      <div className={cn("space-y-2", isCenter ? "mx-auto" : undefined)}>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xl">
            {description}
          </p>
        )}
        {children}
      </div>

      {actions.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-3",
            isCenter ? "justify-center" : "justify-start"
          )}
        >
          {actions.map(({ label, onClick, variant: actionVariant = "default", icon: ActionIcon }) => (
            <Button key={label} onClick={onClick} variant={actionVariant} className="motion-button">
              {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
