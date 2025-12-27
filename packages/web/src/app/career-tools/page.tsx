"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Download, Eye } from "lucide-react";
import { ensureFirebaseApp } from "@/firebase/client";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { useTourContext } from "@/providers/onboarding-tour-provider";
import { Button } from "@/components/ui/button";
import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";
import { LoadingPage } from "@/components/ui/loading";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NetworkError } from "@/components/ui/error-display";
import { Skeleton, SkeletonButton, SkeletonText, SkeletonCard } from "@/components/ui/loading-skeleton";
import { 
  CareerToolsSidebar, 
  useCareerToolsState,
  ResumeWizard
} from "@/components/career-tools";

const AIResumeGenerator = dynamic(() => import("@/components/application/AIResumeGenerator").then(mod => mod.AIResumeGenerator), { ssr: false, loading: () => <SkeletonCard /> });
const AICoverLetterGenerator = dynamic(() => import("@/components/application/AICoverLetterGenerator").then(mod => mod.AICoverLetterGenerator), { ssr: false, loading: () => <SkeletonCard /> });
const CvUploadSection = dynamic(() => import("@/components/cv-evaluator/CvUploadSection").then(mod => mod.CvUploadSection), { ssr: false, loading: () => <SkeletonCard /> });
const CvAnalysisHistory = dynamic(() => import("@/components/CvAnalysisHistory").then(mod => mod.CvAnalysisHistory), { ssr: false, loading: () => <SkeletonCard /> });
const CvImprovementTracker = dynamic(() => import("@/components/CvImprovementTracker").then(mod => mod.CvImprovementTracker), { ssr: false, loading: () => <SkeletonCard /> });
const CvStatsOverview = dynamic(() => import("@/components/cv-evaluator").then(mod => mod.CvStatsOverview), { ssr: false, loading: () => <Skeleton className="h-20 w-full" /> });
const ManualBuilderSection = dynamic(() => import("@/components/career-tools/ManualBuilderSection").then(mod => mod.ManualBuilderSection), { ssr: false, loading: () => <SkeletonCard /> });
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, History as HistoryIcon, LayoutDashboard, Sparkles as SparklesIcon } from "lucide-react";

const dashboardTabsListClassName =
  "bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/50 shadow-sm w-full flex flex-wrap gap-1 h-auto sm:inline-flex sm:w-auto sm:flex-nowrap";
const dashboardTabsTriggerClassName =
  "px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md motion-control rounded-lg font-medium text-sm";

function ResumeImporterSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <div className="flex flex-wrap gap-2">
            <SkeletonButton />
            <SkeletonButton className="w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ResumeImporter = dynamic(
  () => import("@/components/application/ResumeImporter").then((mod) => mod.ResumeImporter),
  {
    ssr: false,
    loading: () => <ResumeImporterSkeleton />,
  }
);

export default function CareerToolsPage() {
  // Ensure Firebase initialized
  useEffect(() => {
    ensureFirebaseApp();
  }, []);

  const state = useCareerToolsState();
  const {
    user,
    authLoading,
    activeSection,
    setActiveSection,
    showManualResumeActions,
    saving,
    dirty,
    previewResume,
    saveResume,
    exportResume,
    currentResume,
    currentAtsScore,
    setCurrentAtsScore,
    handleResumeUpdate,
    handleResumeImport,
    cvStats,
    cvAnalyses,
    loadingData,
    dataError,
    refresh,
  } = state;

  // Onboarding state and tour
  const onboarding = useOnboardingState();
  const tour = useTourContext();
  const [showWizard, setShowWizard] = useState(false);

  // Show wizard for new users on first visit
  useEffect(() => {
    if (
      onboarding.isLoaded &&
      onboarding.isNewUser &&
      !localStorage.getItem('hireall_career_wizard_shown') &&
      user &&
      !authLoading
    ) {
      const timer = setTimeout(() => {
        setShowWizard(true);
        localStorage.setItem('hireall_career_wizard_shown', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboarding.isLoaded, onboarding.isNewUser, user, authLoading]);

  // Auto-start CV evaluator tour for new users
  useEffect(() => {
    if (
      onboarding.isLoaded &&
      onboarding.isNewUser &&
      !onboarding.hasCompletedCvTour &&
      user &&
      !authLoading &&
      activeSection === "cv-optimizer"
    ) {
      const timer = setTimeout(() => {
        tour.startCvEvaluatorTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onboarding.isLoaded, onboarding.isNewUser, onboarding.hasCompletedCvTour, user, authLoading, tour, activeSection]);

  // Loading state
  if (authLoading) {
    return <LoadingPage label="Loading Career Tools..." />;
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to access Career Tools
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild variant="outline">
              <a href="/sign-in">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

// Render content based on active section
  const renderContent = () => {
    if (dataError) {
      return <NetworkError error={dataError} onRetry={() => refresh()} />;
    }

    switch (activeSection) {
      case "ai-generator":
        return (
          <div className="space-y-6">
            <CvStatsOverview cvStats={cvStats || undefined} loading={loadingData} />
            <AIResumeGenerator />
          </div>
        );
      case "manual-builder":
        return (
          <div className="space-y-6">
            <CvStatsOverview cvStats={cvStats || undefined} loading={loadingData} />
            <ManualBuilderSection
              state={state}
              tabsListClassName={dashboardTabsListClassName}
              tabsTriggerClassName={dashboardTabsTriggerClassName}
            />
          </div>
        );
      case "import":
        return (
          <div className="space-y-6">
            <CvStatsOverview cvStats={cvStats || undefined} loading={loadingData} />
            <ResumeImporter onImport={handleResumeImport} />
          </div>
        );
      case "cv-optimizer":
        return (
          <div className="space-y-6">
            <CvStatsOverview cvStats={cvStats || undefined} loading={loadingData} />
            
            <Tabs defaultValue="analyze" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="analyze" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Analyze New CV
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4" />
                  Analysis History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="analyze" className="space-y-6">
                <CvUploadSection
                  userId={user?.uid || ''}
                  onUploadStarted={() => {
                    refresh();
                  }}
                  onUploadSuccess={() => {
                    refresh();
                    // Optionally switch to history tab here if needed
                  }}
                  onResumeUpdate={handleResumeUpdate}
                  currentResume={currentResume}
                  currentAtsScore={currentAtsScore}
                  setCurrentAtsScore={setCurrentAtsScore}
                />
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                {loadingData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                ) : (
                  <>
                    <CvAnalysisHistory analyses={cvAnalyses ?? []} />
                    <CvImprovementTracker analyses={cvAnalyses ?? []} />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        );
      case "cover-letter":
        return <AICoverLetterGenerator />;
      default:
        return <AIResumeGenerator />;
    }
  };

  return (
    <>
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('Career Tools page error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl relative z-10"
        >
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">Career Tools</h1>
                <p className="text-base sm:text-lg text-primary-foreground/90 max-w-2xl leading-relaxed">
                  Build professional resumes, generate cover letters, and optimize your CV with AI-powered tools
                </p>
              </div>
              {showManualResumeActions ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={previewResume}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveResume()}
                    disabled={saving || !dirty}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {saving ? "Saving..." : dirty ? "Save" : "Saved"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportResume}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </Button>
                </div>
              ) : null}
            </div>
            {showManualResumeActions && dirty && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 w-fit"
              >
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-100 font-medium">Unsaved changes</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs for navigation */}
          <Breadcrumbs className="mb-4" />
          
          <FeatureGate>
            {/* Sidebar + Content Layout */}
            <div className="flex gap-6">
              {/* Sidebar Navigation */}
              <CareerToolsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
              
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </div>
            </div>
          </FeatureGate>
        </div>
      </div>
    </ErrorBoundaryWrapper>

    {/* Resume Wizard for new users */}
    <ResumeWizard
      open={showWizard}
      onOpenChange={setShowWizard}
      onSelectOption={setActiveSection}
    />
    </>
  );
}
