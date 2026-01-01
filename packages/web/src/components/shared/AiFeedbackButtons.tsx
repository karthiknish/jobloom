"use client";

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { FeedbackSentiment } from '@hireall/shared';
import { useAiFeedback } from '@/hooks/useAiFeedback';

interface AiFeedbackButtonsProps {
  contentType: 'suggestion' | 'score' | 'cover_letter' | 'resume';
  contentId: string;
  context?: string;
  metadata?: Record<string, any>;
  onFeedbackGiven?: (sentiment: FeedbackSentiment) => void;
}

export const AiFeedbackButtons: React.FC<AiFeedbackButtonsProps> = ({
  contentType,
  contentId,
  context,
  metadata,
  onFeedbackGiven,
}) => {
  const { recordPositiveFeedback, recordNegativeFeedback, isSubmitting } = useAiFeedback();
  const [givenSentiment, setGivenSentiment] = useState<FeedbackSentiment | null>(null);

  const handleFeedback = async (sentiment: FeedbackSentiment) => {
    if (isSubmitting || givenSentiment) return;

    let success = false;
    if (sentiment === 'positive') {
      success = (await recordPositiveFeedback(contentType, contentId, context, metadata)) ?? false;
    } else {
      success = (await recordNegativeFeedback(contentType, contentId, context, metadata)) ?? false;
    }

    if (success) {
      setGivenSentiment(sentiment);
      onFeedbackGiven?.(sentiment);
    }
  };

  if (givenSentiment) {
    return (
      <div className="flex items-center space-x-1 text-xs text-green-500 bg-green-50  px-2 py-1 rounded-full">
        <Check size={12} />
        <span>Feedback received</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleFeedback('positive')}
        disabled={isSubmitting}
        className="p-1 text-slate-400 hover:text-green-500 hover:bg-green-50  rounded transition-colors"
        title="Helpful"
      >
        <ThumbsUp size={16} />
      </button>
      <button
        onClick={() => handleFeedback('negative')}
        disabled={isSubmitting}
        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50  rounded transition-colors"
        title="Not helpful"
      >
        <ThumbsDown size={16} />
      </button>
    </div>
  );
};
