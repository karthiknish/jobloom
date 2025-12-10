/**
 * ATS Core Types
 * 
 * Shared type definitions for the ATS scoring system.
 */

// Score breakdown categories
export interface AtsScoreBreakdown {
  structure: number;      // Resume structure/sections (0-100)
  content: number;        // Content quality (0-100)
  keywords: number;       // Keyword relevance (0-100)
  formatting: number;     // Formatting ATS-friendliness (0-100)
  readability: number;    // Readability score (0-100)
  impact: number;         // Quantified achievements (0-100)
}

// Detailed metrics for deep analysis
export interface AtsDetailedMetrics {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  actionVerbCount: number;
  technicalKeywordCount: number;
  softSkillCount: number;
  impactStatementCount: number;
  quantifiedAchievements: number;
  sectionsFound: string[];
  sectionsMissing: string[];
  keywordDensity: number;
  readabilityGrade: number;
}

// Prioritized recommendations
export interface AtsRecommendations {
  high: string[];    // Fix immediately
  medium: string[];  // Should improve
  low: string[];     // Nice to have
}

// Complete ATS evaluation result
export interface AtsEvaluation {
  score: number;                          // Overall score (0-100)
  breakdown: AtsScoreBreakdown;           // Score by category
  detailedMetrics: AtsDetailedMetrics;    // Detailed metrics
  matchedKeywords: string[];              // Keywords found
  missingKeywords: string[];              // Suggested keywords to add
  strengths: string[];                    // What's good
  criticalIssues: string[];               // What must be fixed
  improvements: string[];                 // General improvements
  recommendations: AtsRecommendations;    // Prioritized actions
}

// Resume score summary (simplified for UI)
export interface ResumeScore {
  overall: number;
  completeness: number;
  ats: number;
  impact: number;
  suggestions: string[];
  breakdown?: AtsScoreBreakdown;
  detailedMetrics?: AtsDetailedMetrics;
  strengths?: string[];
  criticalIssues?: string[];
  recommendations?: AtsRecommendations;
}

// Evaluation options
export interface AtsEvaluationOptions {
  targetRole?: string;
  industry?: string;
  fileType?: string;
  strictMode?: boolean;
}

// Issue detection types
export type AtsIssueType = 
  | 'formatting' 
  | 'parsing' 
  | 'content' 
  | 'structure' 
  | 'keyword' 
  | 'compatibility';

export type AtsIssueSeverity = 'critical' | 'major' | 'minor' | 'info';

export interface AtsIssue {
  type: AtsIssueType;
  severity: AtsIssueSeverity;
  title: string;
  description: string;
  recommendation: string;
}

// Section definition
export interface StandardSection {
  id: string;
  names: string[];
  required: boolean;
}
