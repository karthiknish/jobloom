"use client";

import React, { useState, useCallback } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "../../components/UpgradePrompt";
import { calculateEnhancedATSScore } from "../../lib/enhancedAts";
import type { ResumeData } from "@/types/resume";
import type { ResumeScore } from "@/lib/enhancedAts";
import { useCvEvaluator } from "@/hooks/useCvEvaluator";
import { ensureFirebaseApp } from "@/firebase/client";
import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  CvEvaluatorHero,
  CvStatsOverview,
  CvAnalysisTabs,
} from "../../components/cv-evaluator";
import { ErrorDisplay, NetworkError } from "@/components/ui/error-display";
import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";

export default function CvEvaluatorPage() {
  // Ensure Firebase initialized
  ensureFirebaseApp();

  const { user, loading: authLoading } = useFirebaseAuth();
  const { plan } = useSubscription();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentAtsScore, setCurrentAtsScore] = useState<ResumeScore | null>(null);
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);

  const {
    analyses: cvAnalyses,
    stats: cvStats,
    loading: loadingData,
    error: dataError,
    refresh
  } = useCvEvaluator({
    userId: user?.uid,
    showNotifications: true,
    onError: (error) => {
      console.error('CV Evaluator error:', error);
    }
  });

  

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <p className="mb-4">Please sign in to access CV evaluator.</p>
            <Button asChild>
              <a href="/sign-in">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your CV data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error handling
  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <NetworkError 
            error={dataError}
            onRetry={() => refresh()}
          />
        </div>
      </div>
    );
  }

  const handleResumeUpdate = (resume: ResumeData, targetRole?: string, industry?: string) => {
    setCurrentResume(resume);
    if (resume && targetRole) {
      const score = calculateEnhancedATSScore(resume, { targetRole, industry });
      setCurrentAtsScore(score);
    }
  };

  return (
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('CV Evaluator page error:', error, errorInfo);
      }}
    >
      <>
        <CvEvaluatorHero 
          showAdvanced={showAdvanced} 
          setShowAdvanced={setShowAdvanced} 
        />
        
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <FeatureGate>
            {/* Stats Overview */}
            <CvStatsOverview 
              cvStats={cvStats || undefined} 
              loading={loadingData}
            />

            {/* Analysis Tabs */}
            <CvAnalysisTabs
              userId={user?.uid || ''}
              cvAnalyses={cvAnalyses ?? undefined}
              loading={loadingData}
              onResumeUpdate={handleResumeUpdate}
              currentResume={currentResume}
              currentAtsScore={currentAtsScore}
              setCurrentAtsScore={setCurrentAtsScore}
            />
          </FeatureGate>
        </div>
      </>
    </ErrorBoundaryWrapper>
  );
}
