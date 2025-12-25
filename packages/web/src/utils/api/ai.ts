import { apiClient } from "@/lib/api/client";

export interface ResumeRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: string;
  style: string;
  atsOptimization?: boolean;
  aiEnhancement?: boolean;
}

export interface CoverLetterRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: string;
  length: string;
  atsOptimization?: boolean;
  keywordFocus?: boolean;
  deepResearch?: boolean;
}

export interface EditorRequest {
  prompt: string;
  tone?: string;
  format?: string;
  length?: string;
}

export const aiApi = {
  generateResume: (payload: ResumeRequest) =>
    apiClient.post<any>("/ai/resume", payload),

  generateCoverLetter: (payload: CoverLetterRequest) =>
    apiClient.post<any>("/ai/cover-letter", payload),

  generateEditorContent: (payload: EditorRequest) =>
    apiClient.post<{ content: string }>("/ai/editor", {
      tone: "professional",
      format: "html",
      length: "medium",
      ...payload,
    }),
};
