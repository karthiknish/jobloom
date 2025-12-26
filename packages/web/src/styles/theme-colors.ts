/**
 * Centralized theme color mappings
 * Use these instead of hardcoded Tailwind colors to maintain consistency
 */

export const themeColors = {
  // Primary actions and emphasis
  primary: {
    bg: "bg-primary",
    text: "text-primary",
    border: "border-primary",
    hover: "hover:bg-primary/90",
    soft: "bg-accent",
    softText: "text-accent-foreground",
  },

  // Secondary actions
  secondary: {
    bg: "bg-secondary",
    text: "text-secondary-foreground",
    border: "border-secondary",
    hover: "hover:bg-secondary/80",
  },

  // Success states
  success: {
    bg: "bg-success-soft",
    text: "text-success",
    border: "border-success/20",
    icon: "text-success",
    badge: "bg-success-soft text-success border-success/30",
  },

  // Warning states
  warning: {
    bg: "bg-warning-soft",
    text: "text-warning",
    border: "border-warning/20",
    icon: "text-warning",
    badge: "bg-warning-soft text-warning border-warning/30",
  },

  // Error/Destructive states
  error: {
    bg: "bg-destructive-soft",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: "text-destructive",
    badge: "bg-destructive-soft text-destructive border-destructive/30",
  },

  // Info states
  info: {
    bg: "bg-info-soft",
    text: "text-info",
    border: "border-info/20",
    icon: "text-info",
    badge: "bg-info-soft text-info border-info/30",
  },

  // Processing/Loading states
  processing: {
    bg: "bg-accent",
    text: "text-accent-foreground",
    border: "border-accent",
    badge: "bg-accent text-accent-foreground border-primary/30",
  },

  // Purple/Accent states (for interview, in-progress, etc.)
  accent: {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
    icon: "text-purple-600",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },

  // Muted/Subtle elements
  muted: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
  },

  // Cards and surfaces
  surface: {
    bg: "bg-card",
    text: "text-card-foreground",
    border: "border-border",
  },
} as const;

export const themeUtils = {
  // Status badge mapper
  statusBadge: (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return themeColors.success.badge;
      case "processing":
      case "pending":
        return themeColors.processing.badge;
      case "failed":
      case "error":
        return themeColors.error.badge;
      default:
        return themeColors.info.badge;
    }
  },

  // Score color mapper
  scoreColor: (score: number) => {
    if (score >= 80) return themeColors.success.text;
    if (score >= 60) return themeColors.info.text;
    if (score >= 40) return themeColors.warning.text;
    return themeColors.error.text;
  },

  // Icon color mapper
  iconColor: (type: "success" | "warning" | "error" | "info") => {
    return themeColors[type].icon;
  },
} as const;
