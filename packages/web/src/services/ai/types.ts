import type { ResumeData } from '@/types/resume';

/**
 * Types for AI Services
 */

export interface CoverLetterRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'formal';
  length: 'concise' | 'standard' | 'detailed';
  deepResearch?: boolean;
}

export interface CoverLetterResponse {
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  wordCount: number;
  deepResearch: boolean;
  researchInsights: string[];
}

export interface ResumeAnalysisRequest {
  resumeText: string;
  jobDescription?: string;
}

export interface ResumeAnalysisResponse {
  atsScore: number;
  keywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  parsedData?: ResumeData;
}

export interface ResumeGenerationRequest {
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: 'entry' | 'mid' | 'senior' | 'executive' | string;
  style: 'modern' | 'classic' | 'creative' | 'tech' | string;
  includeObjective: boolean;
  atsOptimization: boolean;
  aiEnhancement: boolean;
}

export interface ResumeGenerationResult {
  content: string;
  summary: string;
  experience: string;
  skills: string;
  education: string;
}

export interface EditorContentRequest {
  prompt: string;
  tone?: 'professional' | 'approachable' | 'enthusiastic' | string;
  audience?: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  format?: 'plain' | 'bullet' | 'html' | string;
}

export interface JobSummaryResponse {
  summary: string;
  keyRequirements: string[];
  cultureInsights: string[];
  atsKeywords: string[];
  salaryEstimate?: string;
}
