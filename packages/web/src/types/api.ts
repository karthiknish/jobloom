// API types for the application
export type Id<T extends string> = string & { __tableName?: T };

// Define types for the sponsored companies
export interface SponsoredCompany {
  _id: string; // Firestore doc id
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

// Define types for CV analysis
export interface CvAnalysis {
  _id: string; // Firestore doc id
  userId: string;
  // File naming can vary; include both for compatibility
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
  atsCompatibility?: { score: number; issues?: string[]; suggestions?: string[] };
  summary?: string;
  createdAt: number;
  updatedAt?: number;
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

// Define types for sponsorship stats
export interface SponsorshipStats {
  totalSponsoredCompanies: number;
  industryStats: Record<string, number>;
  sponsorshipTypeStats: Record<string, number>;
}

// Define type for company sponsorship check results
export interface CompanySponsorshipResult {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}
