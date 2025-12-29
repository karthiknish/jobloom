"use client";

import { useCallback, useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { createFirestoreCollection } from "@/firebase/firestore";
import { CreateAiFeedbackRequest, AiFeedback, FeedbackSentiment } from "@hireall/shared";
import { useAnalytics } from "@/providers/analytics-provider";

/**
 * Hook to handle user feedback on AI-generated content
 */
export function useAiFeedback() {
  const { user } = useFirebaseAuth();
  const { trackEvent } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackCollection = createFirestoreCollection<AiFeedback & { createdAt: any; updatedAt: any }>("ai_feedback");

  const submitFeedback = useCallback(async (request: CreateAiFeedbackRequest) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 1. Save to Firestore for long-term learning
      await feedbackCollection.create({
        ...request,
        userId: user.uid,
      } as any);

      // 2. Track as analytics event for immediate monitoring
      trackEvent("ai_feedback_given", {
        content_type: request.contentType,
        content_id: request.contentId,
        sentiment: request.sentiment,
        context: request.context,
        ...request.metadata,
      });

      return true;
    } catch (error) {
      console.error("Error submitting AI feedback:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, trackEvent, feedbackCollection]);

  const recordPositiveFeedback = useCallback((
    contentType: CreateAiFeedbackRequest['contentType'],
    contentId: string,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    return submitFeedback({
      contentType,
      contentId,
      sentiment: 'positive',
      context,
      metadata,
    });
  }, [submitFeedback]);

  const recordNegativeFeedback = useCallback((
    contentType: CreateAiFeedbackRequest['contentType'],
    contentId: string,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    return submitFeedback({
      contentType,
      contentId,
      sentiment: 'negative',
      context,
      metadata,
    });
  }, [submitFeedback]);

  return {
    submitFeedback,
    recordPositiveFeedback,
    recordNegativeFeedback,
    isSubmitting,
  };
}
