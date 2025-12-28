"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { 
  Sparkles, 
  Briefcase, 
  FileText, 
  Chrome, 
  Shield, 
  ArrowRight,
  Rocket
} from "lucide-react";

interface WelcomeDialogProps {
  onStartTour?: () => void;
  onSkip?: () => void;
}

export function WelcomeDialog({ onStartTour, onSkip }: WelcomeDialogProps) {
  const { user } = useFirebaseAuth();
  const onboarding = useOnboardingState();
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useRestoreFocus(isOpen);

  useEffect(() => {
    if (!hasChecked && user && onboarding.isLoaded && typeof window !== "undefined") {
      setHasChecked(true);
      
      const createdAt = user.metadata?.creationTime;
      
      if (!onboarding.hasSeenWelcome && createdAt) {
        // Only show for users created in the last 24 hours
        const createdDate = new Date(createdAt);
        const hoursSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreated < 24) {
          // Small delay to let the page load
          const timer = window.setTimeout(() => setIsOpen(true), 1000);
          return () => window.clearTimeout(timer);
        }
      }
    }
  }, [user, hasChecked, onboarding.isLoaded, onboarding.hasSeenWelcome]);

  const handleStartTour = () => {
    onboarding.markWelcomeSeen();
    setIsOpen(false);
    onStartTour?.();
  };

  const handleSkip = () => {
    onboarding.markWelcomeSeen();
    setIsOpen(false);
    onSkip?.();
  };

  const features = [
    {
      icon: Briefcase,
      title: "Track Applications",
      description: "Organize all your job applications in one place",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      icon: Shield,
      title: "Sponsor Checker",
      description: "Instantly verify UK visa sponsorship eligibility",
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      icon: FileText,
      title: "Resume Evaluator",
      description: "AI-powered resume feedback and optimization",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      icon: Chrome,
      title: "Browser Extension",
      description: "One-click job import from LinkedIn",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/90 to-primary p-6 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Welcome to Hireall!
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/90 text-base">
              Your smarter job search starts here. Let's get you set up for success.
            </DialogDescription>
          </motion.div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Features grid */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Here's what you can do with Hireall:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${feature.bgColor} w-fit mb-2`}>
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                </div>
                <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleStartTour}
            >
              <Rocket className="h-4 w-4" />
              Take the Tour
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            You can restart the tour anytime from Settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tour trigger button for manual restart
export function TourTriggerButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Sparkles className="h-4 w-4" />
      Take a tour
    </Button>
  );
}

// Onboarding checklist for new users
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
}

export function OnboardingChecklist({ items, onItemClick }: { 
  items: ChecklistItem[];
  onItemClick?: (item: ChecklistItem) => void;
}) {
  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  if (completedCount === items.length) {
    return null; // All done, hide checklist
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          Getting Started
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{items.length} complete
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {items.filter(i => !i.completed).slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full border-2 border-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
