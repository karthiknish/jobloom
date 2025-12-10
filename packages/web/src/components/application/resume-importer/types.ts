/**
 * ResumeImporter Types
 */

import type { CvAnalysis } from "@/types/api";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface ResumeImporterProps {
  onImport?: (data: import("@/types/resume").ResumeData) => void;
}

export interface ResumeAnalysisItem {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  status: AnalysisStatus;
  overallScore?: number;
  atsScore?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingSkills: string[];
  atsCompatibility?: CvAnalysis["atsCompatibility"];
  keywordAnalysis?: CvAnalysis["keywordAnalysis"];
  industryAlignment?: CvAnalysis["industryAlignment"];
  targetRole?: string | null;
  industry?: string | null;
  createdAt?: number;
  updatedAt?: number;
}
