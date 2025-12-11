"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TourProvider as ReactTourProvider, useTour, StepType } from "@reactour/tour";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";

const TOUR_IDS = {
  dashboard: "dashboard",
  cvEvaluator: "cv_evaluator",
} as const;

// Tour step definitions for different pages/flows
export const DASHBOARD_TOUR_STEPS: StepType[] = [
  {
    selector: 'body',
    content: "Welcome to Hireall!|Let's take a quick tour to help you get started with your job search dashboard.",
    position: "center",
  },
  {
    selector: '[data-tour="add-job"]',
    content: "Add Jobs|Click here to manually add a job you've found. You can track any opportunity from any source.",
  },
  {
    selector: '[data-tour="import-jobs"]',
    content: "Import from Extension|Use our Chrome extension to automatically import jobs from LinkedIn. One-click job tracking!",
  },
  {
    selector: '[data-tour="nav-tabs"]',
    content: "Navigate Your Dashboard|Switch between Overview, Jobs list, and Analytics to manage your applications.",
  },
  {
    selector: '[data-tour="stats-cards"]',
    content: "Track Your Progress|See your job search stats at a glance - total jobs, sponsored opportunities, interview rate, and weekly activity.",
  },
  {
    selector: '[data-tour="cv-evaluator"]',
    content: "Optimize Your CV|Use our AI-powered CV Evaluator to get feedback and improve your resume for better results.",
    position: "center",
  },
  {
    selector: 'body',
    content: "You're All Set!|Start adding jobs and tracking your applications. Good luck with your job search!",
    position: "center",
  },
];

export const CV_EVALUATOR_TOUR_STEPS: StepType[] = [
  {
    selector: '[data-tour="cv-upload"]',
    content: "Upload Your CV|Upload your resume in PDF or DOCX format. Our AI will analyze it for improvements.",
  },
  {
    selector: '[data-tour="cv-analysis"]',
    content: "Get AI Feedback|Receive detailed feedback on formatting, content, keywords, and ATS compatibility.",
  },
  {
    selector: '[data-tour="cv-score"]',
    content: "Your CV Score|See your overall score and specific areas for improvement.",
  },
];

// Tour context for managing tour state across the app
interface TourContextType {
  startDashboardTour: () => void;
  startCvEvaluatorTour: () => void;
  hasCompletedTour: (tourId: string) => boolean;
  markTourComplete: (tourId: string) => void;
  shouldShowTour: (tourId: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTourContext() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within TourProvider");
  }
  return context;
}

// Custom content component for tour steps
function TourContent({ 
  content, 
  currentStep, 
  totalSteps, 
  setIsOpen, 
  setCurrentStep,
  onComplete,
}: {
  content: string;
  currentStep: number;
  totalSteps: number;
  setIsOpen: (open: boolean) => void;
  setCurrentStep: (step: number | ((s: number) => number)) => void;
  onComplete: () => void;
}) {
  // Parse pipe-separated format: "Title|Body"
  const [title, body] = typeof content === 'string' && content.includes('|')
    ? content.split('|')
    : [undefined, content];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="p-4 max-w-sm">
      {title && (
        <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
          {currentStep === 0 && <Sparkles className="h-5 w-5 text-primary" />}
          {title}
        </h3>
      )}
      <p className="text-sm text-muted-foreground mb-4">{body}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          
          {isLast ? (
            <Button
              size="sm"
              onClick={() => {
                onComplete();
                setIsOpen(false);
              }}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Tour Provider
export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuth();
  const onboarding = useOnboardingState();
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());
  const [activeTour, setActiveTour] = useState<StepType[]>(DASHBOARD_TOUR_STEPS);
  const [activeTourId, setActiveTourId] = useState<string>(TOUR_IDS.dashboard);

  const filterStepsForPage = useCallback((steps: StepType[]) => {
    if (typeof window === "undefined") return steps;
    return steps.filter((step) => {
      if (typeof step.selector === "string") {
        if (step.selector === "body") return true;
        return !!document.querySelector(step.selector);
      }
      return !!step.selector;
    });
  }, []);

  // Load completed tours from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hireall:completed_tours");
      if (saved) {
        try {
          setCompletedTours(new Set(JSON.parse(saved)));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  const hasCompletedTour = useCallback((tourId: string) => {
    if (tourId === TOUR_IDS.dashboard) return onboarding.hasCompletedDashboardTour || completedTours.has(tourId);
    if (tourId === TOUR_IDS.cvEvaluator) return onboarding.hasCompletedCvTour || completedTours.has(tourId);
    return completedTours.has(tourId);
  }, [completedTours, onboarding.hasCompletedDashboardTour, onboarding.hasCompletedCvTour]);

  const markTourComplete = useCallback((tourId: string) => {
    if (tourId === TOUR_IDS.dashboard) {
      onboarding.markDashboardTourComplete();
      return;
    }
    if (tourId === TOUR_IDS.cvEvaluator) {
      onboarding.markCvTourComplete();
      return;
    }

    setCompletedTours((prev) => {
      const next = new Set(prev);
      next.add(tourId);
      if (typeof window !== "undefined") {
        localStorage.setItem("hireall:completed_tours", JSON.stringify([...next]));
      }
      return next;
    });
  }, [onboarding]);

  const shouldShowTour = useCallback((tourId: string) => {
    // Show tour if user is logged in and hasn't completed it
    return !!user && onboarding.isLoaded && !hasCompletedTour(tourId);
  }, [user, onboarding.isLoaded, hasCompletedTour]);

  const startDashboardTour = useCallback(() => {
    setActiveTourId(TOUR_IDS.dashboard);
    setActiveTour(filterStepsForPage(DASHBOARD_TOUR_STEPS));
  }, [filterStepsForPage]);

  const startCvEvaluatorTour = useCallback(() => {
    setActiveTourId(TOUR_IDS.cvEvaluator);
    setActiveTour(filterStepsForPage(CV_EVALUATOR_TOUR_STEPS));
  }, [filterStepsForPage]);

  const contextValue: TourContextType = {
    startDashboardTour,
    startCvEvaluatorTour,
    hasCompletedTour,
    markTourComplete,
    shouldShowTour,
  };

  return (
    <TourContext.Provider value={contextValue}>
      <ReactTourProvider
        steps={activeTour}
        styles={{
          popover: (base) => ({
            ...base,
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            padding: 0,
          }),
          maskArea: (base) => ({
            ...base,
            rx: 8,
          }),
          badge: (base) => ({
            ...base,
            display: "none",
          }),
          close: (base) => ({
            ...base,
            display: "none",
          }),
        }}
        ContentComponent={({ currentStep, steps, setIsOpen, setCurrentStep }) => (
          <div className="relative bg-card border border-border rounded-xl shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <TourContent
              content={steps[currentStep].content as any}
              currentStep={currentStep}
              totalSteps={steps.length}
              setIsOpen={setIsOpen}
              setCurrentStep={setCurrentStep}
              onComplete={() => markTourComplete(activeTourId)}
            />
          </div>
        )}
        onClickClose={({ setIsOpen }) => {
          setIsOpen(false);
        }}
        padding={{ mask: 8, popover: [12, 12] }}
        showBadge={false}
      >
        {children}
      </ReactTourProvider>
    </TourContext.Provider>
  );
}

// Hook to trigger tour from anywhere
export function useTourTrigger() {
  const tour = useTour();
  const { markTourComplete, startDashboardTour, startCvEvaluatorTour } = useTourContext();

  const startTour = useCallback((tourId: string) => {
    if (tourId === TOUR_IDS.dashboard) {
      startDashboardTour();
    } else if (tourId === TOUR_IDS.cvEvaluator) {
      startCvEvaluatorTour();
    }
    tour.setIsOpen(true);
  }, [tour, startDashboardTour, startCvEvaluatorTour]);

  const endTour = useCallback((tourId: string) => {
    tour.setIsOpen(false);
    markTourComplete(tourId);
  }, [tour, markTourComplete]);

  return {
    startTour,
    endTour,
    isOpen: tour.isOpen,
    setIsOpen: tour.setIsOpen,
    currentStep: tour.currentStep,
    setCurrentStep: tour.setCurrentStep,
  };
}
