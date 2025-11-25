/**
 * Centralized UI component wrapper utilities
 * These utilities ensure consistent styling across the application
 */

import { cn } from "@/lib/utils";
import { themeColors } from "./theme-colors";

/**
 * Status badge class builder with consistent theming
 */
export function getStatusBadgeClasses(
  status: "pending" | "processing" | "completed" | "failed" | "success" | "error" | "warning" | "info"
): string {
  const statusMap = {
    pending: themeColors.warning.badge,
    processing: themeColors.processing.badge,
    completed: themeColors.success.badge,
    success: themeColors.success.badge,
    failed: themeColors.error.badge,
    error: themeColors.error.badge,
    warning: themeColors.warning.badge,
    info: themeColors.info.badge,
  };

  return cn("text-xs border font-medium", statusMap[status]);
}

/**
 * Score-based color class builder
 */
export function getScoreClasses(score: number): string {
  if (score >= 80) return themeColors.success.text;
  if (score >= 60) return themeColors.info.text;
  if (score >= 40) return themeColors.warning.text;
  return themeColors.error.text;
}

/**
 * Icon color class builder by type
 */
export function getIconClasses(type: "success" | "warning" | "error" | "info" | "primary"): string {
  const iconMap = {
    success: themeColors.success.icon,
    warning: themeColors.warning.icon,
    error: themeColors.error.icon,
    info: themeColors.info.icon,
    primary: themeColors.primary.text,
  };

  return iconMap[type];
}

/**
 * Alert box classes by severity
 */
export function getAlertClasses(severity: "success" | "warning" | "error" | "info"): string {
  const alertMap = {
    success: cn(themeColors.success.bg, themeColors.success.border, themeColors.success.text, "border"),
    warning: cn(themeColors.warning.bg, themeColors.warning.border, themeColors.warning.text, "border"),
    error: cn(themeColors.error.bg, themeColors.error.border, themeColors.error.text, "border"),
    info: cn(themeColors.info.bg, themeColors.info.border, themeColors.info.text, "border"),
  };

  return alertMap[severity];
}

/**
 * Interactive card classes with consistent hover effects
 */
export function getInteractiveCardClasses(isSelected = false): string {
  return cn(
    "transition-all duration-200 rounded-lg border",
    isSelected
      ? "border-primary/60 bg-primary/10 shadow-md"
      : "border-border hover:border-border/80 hover:shadow-sm"
  );
}

/**
 * Premium button gradient classes
 */
export function getPremiumGradientClasses(): string {
  return "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground";
}

/**
 * Feature highlight box classes
 */
export function getFeatureBoxClasses(): string {
  return cn(
    "rounded-xl border p-6 transition-all duration-200",
    themeColors.surface.bg,
    themeColors.surface.border,
    "hover:shadow-lg"
  );
}

/**
 * Success/completion indicator classes
 */
export function getCompletionIndicatorClasses(isComplete: boolean): string {
  return isComplete
    ? cn(themeColors.success.bg, themeColors.success.border, "border rounded-lg")
    : cn(themeColors.muted.bg, themeColors.muted.border, "border rounded-lg");
}
