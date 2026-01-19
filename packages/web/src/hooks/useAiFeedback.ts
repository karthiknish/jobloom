"use client";

import { useCallback, useState } from "react";
import { CreateAiFeedbackRequest } from "@hireall/shared";
import { useAnalytics } from "@/providers/analytics-provider";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook to handle user feedback on AI-generated content
 */
export function useAiFeedback() {
  const { trackEvent } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = useQuery(api.users.viewer);
  const createFeedback = useMutation(api.ai_feedback.create);

  const submitFeedback = useCallback(async (request: CreateAiFeedbackRequest) => {
    if (!user) return false;

    setIsSubmitting(true);
    try {
      // 1. Save to Convex for long-term learning
      await createFeedback({
        userId: user._id,
        contentType: request.contentType,
        contentId: request.contentId,
        sentiment: request.sentiment,
        context: request.context,
        metadata: request.metadata,
      });

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
  }, [user, trackEvent, createFeedback]);

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
