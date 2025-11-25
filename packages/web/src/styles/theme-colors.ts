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
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: "text-green-600",
    badge: "bg-green-100 text-green-700 border-green-300",
  },

  // Warning states
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },

  // Error/Destructive states
  error: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: "text-destructive",
    badge: "bg-red-100 text-red-700 border-red-300",
  },

  // Info states
  info: {
    bg: "bg-accent",
    text: "text-accent-foreground",
    border: "border-accent",
    icon: "text-primary",
    badge: "bg-accent text-accent-foreground border-primary/20",
  },

  // Processing/Loading states
  processing: {
    bg: "bg-accent",
    text: "text-accent-foreground",
    border: "border-accent",
    badge: "bg-accent text-accent-foreground border-primary/30",
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
