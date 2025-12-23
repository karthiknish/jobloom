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
  primaryAlpha10: "rgba(16, 185, 129, 0.1)",
  primaryAlpha20: "rgba(16, 185, 129, 0.2)",

  // Secondary palette (Teal alternative)
  secondary: "#14b8a6",         // Teal 500
  secondaryDark: "#0d9488",     // Teal 600
  secondaryText: "#ffffff",

  // Accent colors (matches popup.css)
  accentBlue: "#3b82f6",        // Blue 500
  accentBlueAlpha10: "rgba(59, 130, 246, 0.1)",
  accentBlueLight: "#eff6ff",   // Blue 50
  accentPurple: "#8b5cf6",      // Violet 500
  accentPurpleAlpha10: "rgba(139, 92, 246, 0.1)",
  accentPurpleLight: "#f5f3ff", // Violet 50
  accentOrange: "#f97316",      // Orange 500
  accentOrangeAlpha10: "rgba(249, 115, 22, 0.1)",
  accentOrangeLight: "#fff7ed", // Orange 50
  accentRed: "#ef4444",         // Red 500
  accentRedAlpha10: "rgba(239, 68, 68, 0.1)",
  accentRedLight: "#fef2f2",    // Red 50

  // Semantic status colors
  success: "#10b981",           // Emerald 500 (same as primary)
  info: "#3b82f6",              // Blue 500
  warning: "#f59e0b",           // Amber 500
  warningDark: "#d97706",       // Amber 600
  destructive: "#ef4444",       // Red 500
  destructiveDark: "#dc2626",   // Red 600

  // Premium colors
  premiumAmber: "#f59e0b",      // Amber 500
  premiumOrange: "#f97316",     // Orange 500
  premiumAlpha10: "rgba(245, 158, 11, 0.1)",
  premiumAlpha15: "rgba(245, 158, 11, 0.15)",
  premiumAlpha30: "rgba(245, 158, 11, 0.3)",

  // Feedback colors
  errorBg: "#fee2e2",
  errorText: "#b91c1c",
  errorBorder: "#fecaca",
  successBg: "#dcfce7",
  successText: "#15803d",
  successBorder: "#bbf7d0",

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
    rejected: EXT_COLORS.statusRejected,
    saved: EXT_COLORS.statusSaved,
  };
  return statusMap[status] || EXT_COLORS.statusSaved;
}