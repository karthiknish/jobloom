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
  applicationId?: string;
}

export interface EditorRequest {
  prompt: string;
  tone?: string;
  format?: string;
  length?: string;
}

export interface ResumeResponse {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  atsScore: number;
  keywords: string[];
  suggestions: string[];
  wordCount: number;
  source?: 'gemini' | 'fallback' | 'mock';
}

export interface CoverLetterResponse {
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  tone: string;
  wordCount: number;
  source?: 'gemini' | 'fallback' | 'mock';
  deepResearch?: boolean;
  researchInsights?: string[];
}

export const aiApi = {
  generateResume: (payload: ResumeRequest) =>
    apiClient.post<ResumeResponse>("/ai/resume", payload),

  generateCoverLetter: (payload: CoverLetterRequest) =>
    apiClient.post<CoverLetterResponse>("/ai/cover-letter", payload),

  generateEditorContent: (payload: EditorRequest) =>
    apiClient.post<{ content: string }>("/ai/editor", {
      tone: "professional",
      format: "html",
      length: "medium",
      ...payload,
    }),

  getCoverLetterHistory: () =>
    apiClient.get<any[]>("/ai/cover-letter/history"),

  deleteCoverLetterHistory: (id: string) =>
    apiClient.delete(`/ai/cover-letter/history?id=${id}`),
};
