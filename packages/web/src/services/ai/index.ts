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
  MockInterviewQuestion,
  MockInterviewGenerationRequest,
  EditorContentRequest,
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
  generateMockInterviewQuestions,
  generateEditorContent,
  evaluateInterviewAnswer,
} from './services';

// Re-export types for interview evaluation
export type {
  InterviewAnswerEvaluationRequest,
  InterviewAnswerEvaluation,
} from './services';
