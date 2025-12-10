/**
 * ATS Module - Unified Exports
 * 
 * Main entry point for the modular ATS system.
 * Import from '@/lib/ats' for all ATS functionality.
 */

// Types
export type {
  AtsEvaluation,
  AtsScoreBreakdown,
  AtsDetailedMetrics,
  AtsRecommendations,
  AtsEvaluationOptions,
  ResumeScore,
  AtsIssue,
  AtsIssueType,
  AtsIssueSeverity,
  StandardSection,
} from './types';

// Scorer functions
export {
  calculateAtsScore,
  calculateResumeScore,
} from './scorer';

// Checker functions
export {
  checkAtsCompatibility,
  calculateAtsCompatibilityScore,
  checkFileTypeCompatibility,
  runFullAtsCheck,
  evaluateAtsCompatibilityFromText,
  STANDARD_SECTIONS,
} from './checker';

// Keywords and utilities
export {
  ROLE_KEYWORDS,
  INDUSTRY_KEYWORDS,
  ACTION_VERBS,
  SOFT_SKILLS,
  IMPACT_PATTERNS,
  CERTIFICATION_KEYWORDS,
  getKeywordsForRole,
  getKeywordsForIndustry,
  getAllActionVerbs,
  hasImpactMetrics,
  countImpactMetrics,
  normalizeKeyword,
} from './keywords';
