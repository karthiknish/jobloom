/**
 * ResumeImporter Status Configuration
 */

import { themeColors } from "@/styles/theme-colors";
import type { AnalysisStatus } from "./types";

export const statusLabels: Record<AnalysisStatus, string> = {
  pending: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const statusClasses: Record<AnalysisStatus, string> = {
  pending: themeColors.warning.badge,
  processing: themeColors.processing.badge,
  completed: themeColors.success.badge,
  failed: themeColors.error.badge,
};

export const supportedFormats = [
  { extension: ".pdf", description: "PDF Document" },
  { extension: ".docx", description: "Word Document" },
  { extension: ".doc", description: "Legacy Word Document" },
  { extension: ".txt", description: "Plain Text" },
];
