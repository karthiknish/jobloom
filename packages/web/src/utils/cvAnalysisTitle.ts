import type { CvAnalysis } from "@/types/api";

export function getCvAnalysisTitle(analysis: Partial<CvAnalysis> & Record<string, any>): string {
  const raw =
    analysis?.fileName ??
    analysis?.filename ??
    analysis?.originalFileName ??
    analysis?.name;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed) return trimmed;
  }

  return "CV Analysis";
}
