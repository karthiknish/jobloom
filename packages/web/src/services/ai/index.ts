/**
 * AI Services - Unified Exports
 */

// Types
export type {
  CoverLetterRequest,
  CoverLetterResponse,
  ResumeAnalysisRequest,
  ResumeAnalysisResponse,
  ResumeGenerationRequest,
  ResumeGenerationResult,
  EditorContentRequest,
  JobSummaryResponse,
} from './types';

// Robust client
export {
  getModel,
  generateContentRobust,
  safeParseJSON,
} from './robust-client';

// Service functions
export {
  generateCoverLetter,
  analyzeResume,
  generateResumeWithAI,
  generateEditorContent,
  summarizeJobDescription,
} from './services';
