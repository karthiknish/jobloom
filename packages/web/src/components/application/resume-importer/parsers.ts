/**
 * ResumeImporter Parser Utilities
 */

import type { CvAnalysis } from "@/types/api";
import type { AnalysisStatus, ResumeAnalysisItem } from "./types";

/**
 * Merge multiple string arrays into a unique set
 */
export function mergeUniqueStrings(
  ...collections: Array<ReadonlyArray<string> | null | undefined>
): string[] {
  const set = new Set<string>();
  for (const collection of collections) {
    if (!collection) continue;
    for (const raw of collection) {
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (value) {
        set.add(value);
      }
    }
  }
  return Array.from(set);
}

/**
 * Normalize analysis status to valid AnalysisStatus
 */
export function normalizeStatus(status?: string | null): AnalysisStatus {
  switch (status) {
    case "pending":
    case "processing":
    case "completed":
    case "failed":
      return status;
    case "error":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Clamp value to 0-100 range
 */
export function clampToPercentage(value?: number | null): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Map CvAnalysis record to ResumeAnalysisItem
 */
export function mapAnalysis(record: CvAnalysis): ResumeAnalysisItem {
  const recordAny = record as unknown as Record<string, unknown>;

  const status = normalizeStatus(record.analysisStatus ?? (recordAny.status as string | undefined));
  const atsCandidates = [
    record.atsCompatibility?.score,
    record.overallScore,
    recordAny.score as number | undefined,
  ];
  const primaryScore = atsCandidates.find(
    (value): value is number => typeof value === "number" && !Number.isNaN(value)
  );

  const fallbackFileName = recordAny.filename;
  const resolvedFileName =
    record.fileName || (typeof fallbackFileName === "string" ? fallbackFileName : undefined) || "Imported Resume";

  return {
    id: record._id,
    fileName: resolvedFileName,
    fileSize: record.fileSize,
    fileType: record.fileType,
    status,
    overallScore: clampToPercentage(record.overallScore),
    atsScore: clampToPercentage(primaryScore),
    strengths: mergeUniqueStrings(record.strengths),
    weaknesses: mergeUniqueStrings(record.weaknesses),
    recommendations: mergeUniqueStrings(
      record.recommendations,
      recordAny.suggestions as string[] | undefined
    ),
    missingSkills: mergeUniqueStrings(
      record.missingSkills,
      record.keywordAnalysis?.missingKeywords
    ),
    atsCompatibility: record.atsCompatibility,
    keywordAnalysis: record.keywordAnalysis,
    industryAlignment: record.industryAlignment,
    targetRole: record.targetRole ?? null,
    industry: record.industry ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) {
    return "Unknown size";
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp to localized string
 */
export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleString();
}
