/**
 * CV Analysis types
 */

export interface CvAnalysis {
  _id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  analysisType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score?: number;
  overallScore?: number;
  keywords?: number;
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  missingSkills?: string[];
  atsCompatibility?: {
    score: number;
    issues?: string[];
    suggestions?: string[];
    breakdown?: {
      structure: number;
      contact: number;
      keywords: number;
      formatting: number;
      readability: number;
      extras: number;
      impact?: number;
    };
  };
  industryAlignment?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendations: string[];
    feedback?: string;
  };
  keywordAnalysis?: {
    totalKeywords: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    presentKeywords?: string[];
    keywordDensity: number;
    averageDensity?: number;
    optimalDensity?: number;
  };
  sectionAnalysis?: {
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasContact: boolean;
    missingsections: string[];
    summary: {
      score: number;
      hasSummary: boolean;
      length: number;
      issues: string[];
    };
    contactInfo: {
      score: number;
      hasEmail: boolean;
      hasPhone: boolean;
      hasLinkedIn: boolean;
      issues: string[];
    };
    experience: {
      score: number;
      totalYears: number;
      relevantYears: number;
      hasDescriptions: boolean;
      hasExperience: boolean;
      issues: string[];
    };
    education: {
      score: number;
      hasDegree: boolean;
      hasInstitution: boolean;
      hasDates: boolean;
      hasEducation: boolean;
      issues: string[];
    };
    skills: {
      score: number;
      skillsCount: number;
      relevantSkills: string[];
      missingSkills: string[];
      hasSkills: boolean;
      issues: string[];
    };
  };
  targetRole?: string;
  industry?: string;
  analysisStatus?: "pending" | "processing" | "completed" | "failed" | "error";
  errorMessage?: string;
  createdAt: number;
  updatedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface CvStats {
  total: number;
  averageScore: number;
  averageKeywords: number;
  successRate: number;
  totalAnalyses?: number;
  completedAnalyses?: number;
  recentAnalysis?: CvAnalysis;
}

export interface CvAnalysisExtended {
  _id: string;
  userId: string;
  filename?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  analysisStatus: "pending" | "processing" | "completed" | "failed" | "error";
  score?: number;
  overallScore?: number;
  errorMessage?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  missingSkills?: string[];
  atsCompatibility?: {
    score: number;
    issues?: string[];
    suggestions?: string[];
    breakdown?: {
      structure: number;
      contact: number;
      keywords: number;
      formatting: number;
      readability: number;
      extras: number;
      impact?: number;
    };
  };
  summary?: string;
  createdAt: number;
  updatedAt?: number;
  targetRole?: string;
  industry?: string;
  keywordAnalysis?: {
    presentKeywords?: string[];
    missingKeywords?: string[];
    keywordDensity: number;
  };
  industryAlignment?: { score: number; feedback: string };
  sectionAnalysis?: {
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasContact: boolean;
    missingsections?: string[];
  };
}
