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
    content: "Track Your Progress|See your job search stats at a glance - total jobs, sponsored opportunities, and weekly activity.",
  },
  {
    selector: '[data-tour="cv-evaluator"]',
    content: "Optimize Your resume|Use our AI-powered CV Evaluator to get feedback and improve your resume for better results.",
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
    content: "Upload Your resume|Upload your resume in PDF or DOCX format. Our AI will analyze it for improvements.",
  },
  {
    selector: '[data-tour="cv-analysis"]',
    content: "Get AI Feedback|Receive detailed feedback on formatting, content, keywords, and ATS compatibility.",
  },
  {
    selector: '[data-tour="cv-score"]',
    content: "Your resume Score|See your overall score and specific areas for improvement.",
  },
];

// Tour context for managing tour state across the app
interface TourContextType {
  startDashboardTour: () => void;
  startCvEvaluatorTour: () => void;
  hasCompletedTour: (tourId: string) => boolean;
  markTourComplete: (tourId: string) => void;
  shouldShowTour: (tourId: string) => boolean;
  resetTour: (tourId: string) => void;
  activeTourId: string;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTourContext() {
  const context = useContext(TourContext);
  return context;
}

const TourContent = React.memo(({ 
  content, 
  currentStep, 
  totalSteps, 
  setIsOpen, 
  setCurrentStep,
  onComplete,
  onSkip,
}: {
  content: string;
  currentStep: number;
  totalSteps: number;
  setIsOpen: (open: boolean) => void;
  setCurrentStep: (step: number | ((s: number) => number)) => void;
  onComplete: () => void;
  onSkip: () => void;
}) => {
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
          {isFirst ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSkip();
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          ) : (
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
              className="gap-1 shadow-md"
            >
              <Check className="h-4 w-4" />
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="gap-1 shadow-md"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

const ContentComponent = React.memo(({ 
  currentStep, 
  steps, 
  setIsOpen, 
  setCurrentStep,
  activeTourId,
  onComplete,
}: {
  currentStep: number;
  steps: StepType[];
  setIsOpen: (open: boolean) => void;
  setCurrentStep: (step: number | ((s: number) => number)) => void;
  activeTourId: string;
  onComplete: (tourId: string) => void;
}) => {
  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="relative bg-card border border-border rounded-xl shadow-xl">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      <TourContent
        content={step.content as string}
        currentStep={currentStep}
        totalSteps={steps.length}
        setIsOpen={setIsOpen}
        setCurrentStep={setCurrentStep}
        onComplete={() => onComplete(activeTourId)}
        onSkip={() => setIsOpen(false)}
      />
    </div>
  );
});

import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";

// Main Tour Provider
export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryWrapper>
      <ReactTourProvider
        steps={[]} // Initial steps empty, will be set by TourInner
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
        ContentComponent={MemoizedContentWrapper}
        onClickClose={({ setIsOpen }) => {
          setIsOpen(false);
        }}
        padding={{ mask: 8, popover: [12, 12] }}
        showBadge={false}
      >
        <TourInnerProvider>{children}</TourInnerProvider>
      </ReactTourProvider>
    </ErrorBoundaryWrapper>
  );
}

// Separate component to use the useTour hook and provide context
function TourInnerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuth();
  const onboarding = useOnboardingState();
  const tour = useTour();
  
  const [activeTourId, setActiveTourId] = useState<string>(TOUR_IDS.dashboard);
  const [activeTourSteps, setActiveTourSteps] = useState<StepType[]>(DASHBOARD_TOUR_STEPS);

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

  // Update filtered steps when active tour or DOM changes
  useEffect(() => {
    const updateSteps = () => {
      const filtered = filterStepsForPage(activeTourSteps);
      tour.setSteps?.(filtered);
    };

    updateSteps();

    if (typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      updateSteps();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-tour']
    });

    return () => observer.disconnect();
  }, [activeTourSteps, filterStepsForPage, tour.setSteps]);

  // Restore current step from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && tour.isOpen) {
      const savedStep = localStorage.getItem(`hireall:tour_step:${activeTourId}`);
      if (savedStep) {
        const step = parseInt(savedStep, 10);
        if (!isNaN(step) && step < tour.steps.length) {
          tour.setCurrentStep?.(step);
        }
      }
    }
  }, [tour.isOpen, activeTourId, tour.steps.length, tour.setCurrentStep]);

  // Persist current step to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && tour.isOpen) {
      localStorage.setItem(`hireall:tour_step:${activeTourId}`, tour.currentStep.toString());
    }
  }, [tour.currentStep, activeTourId, tour.isOpen]);

  const hasCompletedTour = useCallback((tourId: string) => {
    if (tourId === TOUR_IDS.dashboard) return onboarding.hasCompletedDashboardTour;
    if (tourId === TOUR_IDS.cvEvaluator) return onboarding.hasCompletedCvTour;
    return false;
  }, [onboarding.hasCompletedDashboardTour, onboarding.hasCompletedCvTour]);

  const markTourComplete = useCallback((tourId: string) => {
    if (tourId === TOUR_IDS.dashboard) {
      onboarding.markDashboardTourComplete();
    } else if (tourId === TOUR_IDS.cvEvaluator) {
      onboarding.markCvTourComplete();
    }
    // Clear persisted step
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`hireall:tour_step:${tourId}`);
    }
  }, [onboarding]);

  const shouldShowTour = useCallback((tourId: string) => {
    return !!user && onboarding.isLoaded && !hasCompletedTour(tourId);
  }, [user, onboarding.isLoaded, hasCompletedTour]);

  const startDashboardTour = useCallback(() => {
    setActiveTourId(TOUR_IDS.dashboard);
    setActiveTourSteps(DASHBOARD_TOUR_STEPS);
    tour.setIsOpen?.(true);
  }, [tour.setIsOpen]);

  const startCvEvaluatorTour = useCallback(() => {
    setActiveTourId(TOUR_IDS.cvEvaluator);
    setActiveTourSteps(CV_EVALUATOR_TOUR_STEPS);
    tour.setIsOpen?.(true);
  }, [tour.setIsOpen]);

  const resetTour = useCallback(async (tourId: string) => {
    if (tourId === "dashboard") {
      onboarding.saveState({ hasCompletedDashboardTour: false });
    } else if (tourId === "cv_evaluator") {
      onboarding.saveState({ hasCompletedCvTour: false });
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`hireall:tour_step:${tourId}`);
    }
  }, [onboarding]);

  const contextValue: TourContextType = React.useMemo(() => ({
    startDashboardTour,
    startCvEvaluatorTour,
    hasCompletedTour,
    markTourComplete,
    shouldShowTour,
    resetTour,
    activeTourId, // Pass this so ContentComponent can access it
  }), [
    startDashboardTour,
    startCvEvaluatorTour,
    hasCompletedTour,
    markTourComplete,
    shouldShowTour,
    resetTour,
    activeTourId,
  ]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
}

// Stable reference for the content component
const MemoizedContentWrapper = (props: any) => {
  return <TourContentProxy {...props} />;
};

// Proxy component to bridge between ReactTour and our Context
const TourContentProxy = (props: any) => {
  const context = useTourContext();
  
  // Context may not be available during initial render
  if (!context) {
    return null;
  }
  
  return (
    <ContentComponent 
      {...props} 
      activeTourId={context.activeTourId} 
      onComplete={context.markTourComplete} 
    />
  );
};

// Hook to trigger tour from anywhere
export function useTourTrigger() {
  const tour = useTour();
  const context = useTourContext();

  const startTour = useCallback((tourId: string) => {
    if (!context) return;
    if (tourId === "dashboard") {
      context.startDashboardTour();
    } else if (tourId === "cv_evaluator") {
      context.startCvEvaluatorTour();
    }
    tour.setIsOpen(true);
  }, [tour, context]);

  const endTour = useCallback((tourId: string) => {
    tour.setIsOpen(false);
    context?.markTourComplete(tourId);
  }, [tour, context]);

  const resetTour = useCallback((tourId: string) => {
    context?.resetTour(tourId);
  }, [context]);

  return {
    startTour,
    endTour,
    resetTour,
    isOpen: tour.isOpen,
    setIsOpen: tour.setIsOpen,
    currentStep: tour.currentStep,
    setCurrentStep: tour.setCurrentStep,
  };
}
