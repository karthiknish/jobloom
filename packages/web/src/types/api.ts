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
  atsCompatibility?: {
    score: number;
    issues?: string[];
    suggestions?: string[];
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

// Define types for blog system
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category: string;
  featuredImage?: string;
  readingTime?: number; // in minutes
  viewCount: number;
  likeCount: number;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: number;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  postsByCategory: Record<string, number>;
}
