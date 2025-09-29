"use client";

import { useState, useCallback } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "../../components/UpgradePrompt";
import { CvUploadForm } from "../../components/CvUploadForm";
import { CvAnalysisHistory } from "../../components/CvAnalysisHistory";
import { CvImprovementTracker } from "../../components/CvImprovementTracker";
import { motion } from "framer-motion";
import { useApiQuery } from "../../hooks/useApi";
import { cvEvaluatorApi } from "../../utils/api/cvEvaluator";
import { ensureFirebaseApp } from "@/firebase/client";
import {
  FileText,
  BarChart3,
  Star,
  Search,
  Target,
  Upload,
  History,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading-skeleton";

export default function CvEvaluatorPage() {
  // Ensure Firebase initialized (prevents transient 'Firestore not initialized' errors)
  ensureFirebaseApp();

  const { user, loading: authLoading } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "history" | "tracking">(
    "upload"
  );

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
    { enabled: !!user?.uid }
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
    { enabled: !!userRecord }
  );
  const cvAnalyses = cvAnalysesQuery.data;
  const [optimisticPending, setOptimisticPending] = useState<any | null>(null);

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
    { enabled: !!userRecord }
  );
  const cvStats = cvStatsQuery.data;

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
        <div className="bg-gradient-to-r from-primary to-secondary shadow-lg">
          <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
        <div className="bg-gradient-to-r from-primary to-secondary shadow-lg">
          <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">CV Evaluator</h1>
            <p className="mt-2 text-primary-foreground/80">
              Get AI-powered insights to improve your CV and increase your chances of landing interviews
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access CV evaluation features.</p>
            <a
              href="/sign-in"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching user record
  if (userRecordQuery.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
        <div className="bg-gradient-to-r from-primary to-secondary shadow-lg">
          <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="shadow-sm border-input">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="relative grid grid-cols-3 bg-muted/50 p-1 rounded-lg mb-6 w-[min(480px,100%)]">
            <Skeleton className="h-10 w-full" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle error fetching user record (was previously treated as perpetual loading)
  if (userRecordQuery.error) {
    const rawMessage = userRecordQuery.error.message;
    const isProd = process.env.NODE_ENV === 'production';
    // Only show generic message in production; expose detail in dev for debugging
    const friendlyMessage = isProd
      ? 'We could not load your profile right now. Please retry shortly.'
      : (rawMessage === 'Unknown error'
          ? 'An unexpected issue occurred while contacting Firestore.'
          : rawMessage);
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
        <div className="bg-gradient-to-r from-primary to-secondary shadow-lg">
          <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">CV Evaluator</h1>
            <p className="mt-2 text-primary-foreground/80">
              Get AI-powered insights to improve your CV and increase your chances of landing interviews
            </p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Unable to load your profile</CardTitle>
              <CardDescription className="whitespace-pre-line">
                {friendlyMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This can happen if your network is offline or your session expired. Please try again.
              </p>
              {!isProd && (
                <div className="mb-4 space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium">Debug details (dev only):</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Raw error: {rawMessage}</li>
                    <li>Firebase user: {user?.uid || 'none'}</li>
                    <li>Check Firestore rules for path users/{user?.uid}</li>
                    <li>Verify env vars NEXT_PUBLIC_FIREBASE_* present.</li>
                    <li>Look for blocked network requests (ad/script blockers).</li>
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => userRecordQuery.refetch()}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleUploadStarted = () => {
    // Optionally could set a transient state/spinner; kick off refetch soon after
    setActiveTab('history');
    // Create an optimistic placeholder so user sees immediate feedback
    setOptimisticPending({
      _id: 'optimistic-' + Date.now(),
      userId: user?.uid || '',
      fileName: 'Processing CV...',
      fileSize: undefined,
      createdAt: Date.now(),
      analysisStatus: 'pending'
    });
    // slight delay to allow server to create pending record
    setTimeout(() => {
      cvAnalysesQuery.refetch();
      cvStatsQuery.refetch();
    }, 800);
  };

  const handleUploadSuccess = (analysisId: string) => {
    // Aggressively refetch list & stats; keep user on history to observe status change
    cvAnalysesQuery.refetch();
    cvStatsQuery.refetch();
    // Remove optimistic once real fetch likely contains entry
    setTimeout(() => setOptimisticPending(null), 2500);
    // Poll a couple times for completion (simple lightweight client polling)
    let attempts = 0;
    const poll = () => {
      attempts += 1;
      cvAnalysesQuery.refetch();
      if (attempts < 5) {
        setTimeout(poll, 2000);
      }
    };
    setTimeout(poll, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex items-start sm:items-center justify-between"
          >
            <div className="flex items-start sm:items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                whileHover={{ scale: 1.05 }}
                className="h-12 w-12 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center"
              >
                <FileText className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="text-3xl font-bold text-white"
                >
                  CV Evaluator
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  className="mt-2 text-primary-foreground/80"
                >
                  Get AI-powered insights to improve your CV and increase your
                  chances of landing interviews
                </motion.p>
              </div>
            </div>
          </motion.div>

          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          >
            {cvStatsQuery.loading ? (
              // Loading skeleton for stats cards
              <>
                {[1, 2, 3, 4].map((index) => (
                  <Card key={index} className="shadow-sm border-input">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-10 rounded-lg" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-12 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : cvStats ? (
              <>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Analyses
                    </CardTitle>
                    <div className="bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cvStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      CVs analyzed
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg. Score
                    </CardTitle>
                    <div className="bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.averageScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall improvement
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Keywords
                    </CardTitle>
                    <div className="bg-secondary/20 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.averageKeywords}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. per analysis
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Success Rate
                    </CardTitle>
                    <div className="bg-yellow-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.successRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Improvement potential
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              </>
            ) : null}
          </motion.div>

          {/* Tab Navigation */}
          <div className="relative grid grid-cols-3 bg-muted/50 p-1 rounded-lg mb-6 w-[min(480px,100%)]">
            <motion.div
              className="absolute top-1 bottom-1 left-1 w-1/3 rounded-md bg-white shadow"
              animate={{
                x:
                  activeTab === "upload"
                    ? "0%"
                    : activeTab === "history"
                    ? "100%"
                    : "200%",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            />
            <button
              onClick={() => setActiveTab("upload")}
              className={`relative z-10 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "upload"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Upload className="h-4 w-4" /> Upload CV
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative z-10 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "history"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <History className="h-4 w-4" /> History
              </span>
            </button>
            <button
              onClick={() => setActiveTab("tracking")}
              className={`relative z-10 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "tracking"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <TrendingUp className="h-4 w-4" /> Progress
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "upload" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CvUploadForm
                userId={user?.uid || ""}
                onUploadStarted={handleUploadStarted}
                onUploadSuccess={handleUploadSuccess}
              />
            </motion.div>
          ) : activeTab === "history" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {cvAnalysesQuery.loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-8 w-20 rounded" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CvAnalysisHistory analyses={cvAnalyses || []} optimistic={optimisticPending} />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {cvAnalysesQuery.loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((index) => (
                          <div key={index} className="text-center">
                            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                            <Skeleton className="h-4 w-20 mx-auto mb-1" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-2">
                          {[1, 2, 3].map((index) => (
                            <div key={index} className="flex justify-between items-center">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-2 w-32 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CvImprovementTracker analyses={cvAnalyses || []} />
              )}
            </motion.div>
          )}
        </FeatureGate>
      </div>
    </div>
  );
}