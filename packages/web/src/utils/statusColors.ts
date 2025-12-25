/**
 * Unified Status Color System
 * 
 * Provides consistent color-coding across the application for:
 * - Job application statuses
 * - CV/resume scores
 * - Task priorities
 * - Progress states
 * - Validation states
 * 
 * Color Hierarchy:
 * - GREEN: Success, completed, approved, high score (70+)
 * - AMBER/YELLOW: In progress, pending, warning, medium score (40-69)
 * - RED: Error, blocked, rejected, low score (<40)
 * - BLUE: Information, interested, neutral
 * - GRAY: Inactive, withdrawn, disabled
 * - PURPLE: Premium, special, featured
 */

export type StatusType = 
  | "success" | "completed" | "approved" | "offered" | "high"
  | "warning" | "pending" | "in-progress" | "applied" | "medium"
  | "error" | "blocked" | "rejected" | "low"
  | "info" | "interested" | "neutral" | "default"
  | "muted" | "inactive" | "withdrawn" | "disabled"
  | "premium" | "featured" | "special";

export interface StatusColors {
  text: string;
  bg: string;
  border: string;
  icon: string;
}

const STATUS_COLOR_MAP: Record<StatusType, StatusColors> = {
  // Success states (Green)
  success: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  completed: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  approved: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  offered: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  high: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },

  // Warning states (Amber)
  warning: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  pending: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  "in-progress": {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  applied: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  medium: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },

  // Error states (Red)
  error: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },
  blocked: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },
  rejected: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },
  low: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },

  // Info states (Blue)
  info: {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  interested: {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  neutral: {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  default: {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },

  // Muted states (Gray)
  muted: {
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    icon: "text-gray-500 dark:text-gray-400",
  },
  inactive: {
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    icon: "text-gray-500 dark:text-gray-400",
  },
  withdrawn: {
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    icon: "text-gray-500 dark:text-gray-400",
  },
  disabled: {
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    icon: "text-gray-500 dark:text-gray-400",
  },

  // Premium states (Purple)
  premium: {
    text: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
  },
  featured: {
    text: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
  },
  special: {
    text: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
  },
};

/**
 * Get status colors for a given status type
 */
export function getStatusColors(status: StatusType): StatusColors {
  return STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.default;
}

/**
 * Get status colors based on a numeric score (0-100)
 */
export function getScoreStatusColors(score: number): StatusColors {
  if (score >= 70) return STATUS_COLOR_MAP.high;
  if (score >= 40) return STATUS_COLOR_MAP.medium;
  return STATUS_COLOR_MAP.low;
}

/**
 * Get status type from a numeric score (0-100)
 */
export function getScoreStatus(score: number): StatusType {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Map application status strings to status types
 */
export function getApplicationStatusType(status: string): StatusType {
  const statusMap: Record<string, StatusType> = {
    interested: "interested",
    applied: "applied",
    interviewing: "in-progress",
    offered: "offered",
    accepted: "success",
    rejected: "rejected",
    withdrawn: "withdrawn",
  };
  return statusMap[status.toLowerCase()] || "default";
}

/**
 * Get combined class string for styling elements
 */
export function getStatusClasses(status: StatusType, include: ("text" | "bg" | "border" | "icon")[] = ["text", "bg"]): string {
  const colors = getStatusColors(status);
  return include.map(key => colors[key]).join(" ");
}
