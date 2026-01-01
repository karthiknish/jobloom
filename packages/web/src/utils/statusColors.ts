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
    text: "text-green-700 ",
    bg: "bg-green-100 ",
    border: "border-green-200 ",
    icon: "text-green-600 ",
  },
  completed: {
    text: "text-green-700 ",
    bg: "bg-green-100 ",
    border: "border-green-200 ",
    icon: "text-green-600 ",
  },
  approved: {
    text: "text-green-700 ",
    bg: "bg-green-100 ",
    border: "border-green-200 ",
    icon: "text-green-600 ",
  },
  offered: {
    text: "text-green-700 ",
    bg: "bg-green-100 ",
    border: "border-green-200 ",
    icon: "text-green-600 ",
  },
  high: {
    text: "text-green-700 ",
    bg: "bg-green-100 ",
    border: "border-green-200 ",
    icon: "text-green-600 ",
  },

  // Warning states (Amber)
  warning: {
    text: "text-amber-700 ",
    bg: "bg-amber-100 ",
    border: "border-amber-200 ",
    icon: "text-amber-600 ",
  },
  pending: {
    text: "text-amber-700 ",
    bg: "bg-amber-100 ",
    border: "border-amber-200 ",
    icon: "text-amber-600 ",
  },
  "in-progress": {
    text: "text-amber-700 ",
    bg: "bg-amber-100 ",
    border: "border-amber-200 ",
    icon: "text-amber-600 ",
  },
  applied: {
    text: "text-amber-700 ",
    bg: "bg-amber-100 ",
    border: "border-amber-200 ",
    icon: "text-amber-600 ",
  },
  medium: {
    text: "text-amber-700 ",
    bg: "bg-amber-100 ",
    border: "border-amber-200 ",
    icon: "text-amber-600 ",
  },

  // Error states (Red)
  error: {
    text: "text-red-700 ",
    bg: "bg-red-100 ",
    border: "border-red-200 ",
    icon: "text-red-600 ",
  },
  blocked: {
    text: "text-red-700 ",
    bg: "bg-red-100 ",
    border: "border-red-200 ",
    icon: "text-red-600 ",
  },
  rejected: {
    text: "text-red-700 ",
    bg: "bg-red-100 ",
    border: "border-red-200 ",
    icon: "text-red-600 ",
  },
  low: {
    text: "text-red-700 ",
    bg: "bg-red-100 ",
    border: "border-red-200 ",
    icon: "text-red-600 ",
  },

  // Info states (Blue)
  info: {
    text: "text-blue-700 ",
    bg: "bg-blue-100 ",
    border: "border-blue-200 ",
    icon: "text-blue-600 ",
  },
  interested: {
    text: "text-blue-700 ",
    bg: "bg-blue-100 ",
    border: "border-blue-200 ",
    icon: "text-blue-600 ",
  },
  neutral: {
    text: "text-blue-700 ",
    bg: "bg-blue-100 ",
    border: "border-blue-200 ",
    icon: "text-blue-600 ",
  },
  default: {
    text: "text-blue-700 ",
    bg: "bg-blue-100 ",
    border: "border-blue-200 ",
    icon: "text-blue-600 ",
  },

  // Muted states (Gray)
  muted: {
    text: "text-gray-600 ",
    bg: "bg-gray-100 ",
    border: "border-gray-200 ",
    icon: "text-gray-500 ",
  },
  inactive: {
    text: "text-gray-600 ",
    bg: "bg-gray-100 ",
    border: "border-gray-200 ",
    icon: "text-gray-500 ",
  },
  withdrawn: {
    text: "text-gray-600 ",
    bg: "bg-gray-100 ",
    border: "border-gray-200 ",
    icon: "text-gray-500 ",
  },
  disabled: {
    text: "text-gray-600 ",
    bg: "bg-gray-100 ",
    border: "border-gray-200 ",
    icon: "text-gray-500 ",
  },

  // Premium states (Purple)
  premium: {
    text: "text-purple-700 ",
    bg: "bg-purple-100 ",
    border: "border-purple-200 ",
    icon: "text-purple-600 ",
  },
  featured: {
    text: "text-purple-700 ",
    bg: "bg-purple-100 ",
    border: "border-purple-200 ",
    icon: "text-purple-600 ",
  },
  special: {
    text: "text-purple-700 ",
    bg: "bg-purple-100 ",
    border: "border-purple-200 ",
    icon: "text-purple-600 ",
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
