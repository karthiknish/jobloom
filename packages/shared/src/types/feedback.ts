/**
 * AI Feedback-related types for closed-loop learning
 */

export type FeedbackSentiment = 'positive' | 'negative';

export interface AiFeedback {
  /** Unique identifier */
  _id: string;
  /** User who gave the feedback */
  userId: string;
  /** Type of AI content (suggestion, score, cover_letter, resume) */
  contentType: 'suggestion' | 'score' | 'cover_letter' | 'resume';
  /** ID of the suggestion or analysis this refers to */
  contentId: string;
  /** Sentiment given by the user */
  sentiment: FeedbackSentiment;
  /** Optional comments from the user */
  comment?: string;
  /** Context about where this was given (e.g., 'ats_score_modal') */
  context?: string;
  /** Metadata about the specific suggestion (e.g., keyword name, rule ID) */
  metadata?: Record<string, unknown>;
  /** Timestamp when created */
  createdAt: number;
}

export interface CreateAiFeedbackRequest {
  contentType: AiFeedback['contentType'];
  contentId: string;
  sentiment: FeedbackSentiment;
  comment?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}
