"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIStep {
  id: string;
  label: string;
  description?: string;
}

interface AIProgressStepsProps {
  steps: AIStep[];
  currentStep: number;
  className?: string;
}

/**
 * Step indicator for AI generation processes
 * 
 * Usage:
 * ```tsx
 * const steps = [
 *   { id: "analyze", label: "Analyzing job description" },
 *   { id: "match", label: "Matching skills" },
 *   { id: "generate", label: "Generating content" },
 * ];
 * 
 * <AIProgressSteps steps={steps} currentStep={currentStepIndex} />
 * ```
 */
export function AIProgressSteps({ steps, currentStep, className }: AIProgressStepsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              isComplete && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
              isCurrent && "bg-primary/5 border-primary/30 shadow-sm",
              isPending && "bg-muted/30 border-border opacity-60"
            )}
          >
            {/* Status Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isComplete && "bg-green-500 text-white",
                isCurrent && "bg-primary/20 text-primary",
                isPending && "bg-muted text-muted-foreground"
              )}
            >
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              )}
              {isCurrent && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4" />
                </motion.div>
              )}
              {isPending && (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-sm",
                  isComplete && "text-green-700 dark:text-green-300",
                  isCurrent && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
                {isCurrent && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-1"
                  >
                    ...
                  </motion.span>
                )}
              </p>
              {step.description && isCurrent && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Compact inline progress indicator
 */
export function AIProgressInline({ 
  steps, 
  currentStep,
  className,
}: AIProgressStepsProps) {
  const currentStepData = steps[currentStep];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-4 w-4 text-primary" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-sm text-muted-foreground"
        >
          {currentStepData?.label || "Processing..."}
        </motion.span>
      </AnimatePresence>
      <span className="text-xs text-muted-foreground/60">
        ({currentStep + 1}/{steps.length})
      </span>
    </div>
  );
}

// Pre-defined step configurations for common AI operations
export const AI_RESUME_STEPS: AIStep[] = [
  { id: "analyze", label: "Analyzing your experience", description: "Parsing work history and skills" },
  { id: "optimize", label: "Optimizing for ATS", description: "Adding relevant keywords" },
  { id: "format", label: "Formatting content", description: "Structuring sections" },
  { id: "generate", label: "Generating resume", description: "Creating final document" },
];

export const AI_COVER_LETTER_STEPS: AIStep[] = [
  { id: "analyze", label: "Analyzing job description", description: "Extracting key requirements" },
  { id: "match", label: "Matching your skills", description: "Finding relevant experience" },
  { id: "personalize", label: "Personalizing content", description: "Tailoring to company" },
  { id: "generate", label: "Generating letter", description: "Creating final draft" },
];

export const AI_CV_ANALYSIS_STEPS: AIStep[] = [
  { id: "parse", label: "Parsing document", description: "Extracting content from CV" },
  { id: "analyze", label: "Analyzing content", description: "Evaluating sections and keywords" },
  { id: "score", label: "Calculating ATS score", description: "Measuring compatibility" },
  { id: "suggestions", label: "Generating suggestions", description: "Creating improvement tips" },
];
