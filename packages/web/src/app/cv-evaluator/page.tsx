"use client";

import React, { useState, useCallback } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "../../components/UpgradePrompt";
import { calculateEnhancedATSScore } from "../../lib/enhancedAts";
import type { ResumeData } from "@/types/resume";
import type { ResumeScore } from "@/lib/enhancedAts";
import { useApiQuery } from "../../hooks/useApi";
import { cvEvaluatorApi } from "../../utils/api/cvEvaluator";
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

export default function CvEvaluatorPage() {
  // Ensure Firebase initialized
  ensureFirebaseApp();

  const { user, loading: authLoading } = useFirebaseAuth();
  const { plan } = useSubscription();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentAtsScore, setCurrentAtsScore] = useState<ResumeScore | null>(null);
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);

  const userRecordQueryFn = useCallback(
    () =>
      user && user.uid
        ? cvEvaluatorApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  const userRecordQuery = useApiQuery(
    userRecordQueryFn,
    [user?.uid],
    { enabled: !!user?.uid },
    "cv-evaluator-user-record"
  );
  const userRecord = userRecordQuery.data;

  const cvAnalysesQueryFn = useCallback(
    () =>
      userRecord
        ? cvEvaluatorApi.getUserCvAnalyses(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  const cvAnalysesQuery = useApiQuery(
    cvAnalysesQueryFn,
    [userRecord?._id],
    { enabled: !!userRecord },
    "cv-evaluator-cv-analyses"
  );
  const cvAnalyses = cvAnalysesQuery.data;

  const cvStatsQueryFn = useCallback(
    () =>
      userRecord
        ? cvEvaluatorApi.getCvAnalysisStats(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  const cvStatsQuery = useApiQuery(
    cvStatsQueryFn,
    [userRecord?._id],
    { enabled: !!userRecord },
    "cv-evaluator-cv-stats"
  );
  const cvStats = cvStatsQuery.data;

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

  // Show enhanced error handling
  if (userRecordQuery.error) {
    const rawMessage = userRecordQuery.error.message;
    const isProd = process.env.NODE_ENV === 'production';
    const friendlyMessage = isProd
      ? 'We could not load your profile right now. Please retry shortly.'
      : (rawMessage === 'Unknown error'
          ? 'An unexpected issue occurred while contacting Firestore.'
          : rawMessage);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Unable to Load Profile
            </h1>
            <p className="text-gray-600 mb-6">{friendlyMessage}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => userRecordQuery.refetch()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
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
    <>
      <CvEvaluatorHero 
        showAdvanced={showAdvanced} 
        setShowAdvanced={setShowAdvanced} 
      />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          {/* Stats Overview */}
          <CvStatsOverview 
            cvStats={cvStats} 
            loading={cvStatsQuery.loading} 
          />

          {/* Analysis Tabs */}
          <CvAnalysisTabs
            cvAnalyses={cvAnalyses}
            loading={cvAnalysesQuery.loading}
            onResumeUpdate={handleResumeUpdate}
            currentResume={currentResume}
            currentAtsScore={currentAtsScore}
            setCurrentAtsScore={setCurrentAtsScore}
          />
        </FeatureGate>
      </div>
    </>
  );
}
