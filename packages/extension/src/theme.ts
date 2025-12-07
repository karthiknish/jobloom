// Centralized color definitions for the extension
// These values match the CSS variables in popup.css for consistency
// All extension components should use these tokens instead of hardcoded hex values

export const EXT_COLORS = {
  // Primary palette (Emerald - matches popup.css --primary)
  primary: "#10b981",           // Emerald 500
  primaryDark: "#059669",       // Emerald 600
  primaryDarker: "#047857",     // Emerald 700
  primaryLight: "#d1fae5",      // Emerald 100
  primaryText: "#ffffff",

  // Secondary palette (Teal alternative)
  secondary: "#14b8a6",         // Teal 500
  secondaryDark: "#0d9488",     // Teal 600
  secondaryText: "#ffffff",

  // Accent colors (matches popup.css)
  accentBlue: "#3b82f6",        // Blue 500
  accentPurple: "#8b5cf6",      // Violet 500
  accentOrange: "#f97316",      // Orange 500
  accentRed: "#ef4444",         // Red 500

  // Semantic status colors
  success: "#10b981",           // Emerald 500 (same as primary)
  info: "#3b82f6",              // Blue 500
  warning: "#f59e0b",           // Amber 500
  warningDark: "#d97706",       // Amber 600
  destructive: "#ef4444",       // Red 500
  destructiveDark: "#dc2626",   // Red 600

  // Text colors (Slate palette - matches popup.css)
  textPrimary: "#0f172a",       // Slate 900
  textSecondary: "#64748b",     // Slate 500
  textTertiary: "#94a3b8",      // Slate 400
  textMuted: "#6b7280",         // Gray 500

  // Background colors
  bgApp: "#f8fafc",             // Slate 50
  bgCard: "#ffffff",
  bgHover: "#f1f5f9",           // Slate 100

  // Border colors
  border: "#e2e8f0",            // Slate 200
  borderHover: "#cbd5e1",       // Slate 300

  // Legacy/additional colors (for backward compatibility)
  dark: "#111827",              // Gray 900
  light: "#f9fafb",             // Gray 50
  slate: "#374151",             // Gray 700
  brandBlue: "#2563eb",         // Blue 600 - used by JobTracker
  greenDark: "#059669",         // Emerald 600 - alias for primaryDark, used by JobTracker

  // Status-specific job colors (used in jobStatus.ts)
  statusInterested: { r: 59, g: 130, b: 246 },   // Blue
  statusApplied: { r: 16, g: 185, b: 129 },      // Emerald (updated from #22c55e)
  statusInterviewing: { r: 139, g: 92, b: 246 }, // Violet
  statusRejected: { r: 239, g: 68, b: 68 },      // Red
  statusSaved: { r: 100, g: 116, b: 139 },       // Slate 500
};

// Color utility type for status colors
export type StatusColorRGB = { r: number; g: number; b: number };

// Helper function to get status color
export function getStatusColorFromTheme(status: string): StatusColorRGB {
  const statusMap: Record<string, StatusColorRGB> = {
    interested: EXT_COLORS.statusInterested,
    applied: EXT_COLORS.statusApplied,
    interviewing: EXT_COLORS.statusInterviewing,
    rejected: EXT_COLORS.statusRejected,
    saved: EXT_COLORS.statusSaved,
  };
  return statusMap[status] || EXT_COLORS.statusSaved;
}