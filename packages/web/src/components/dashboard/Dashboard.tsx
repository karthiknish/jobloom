"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";

import { useEnhancedApi } from "@/hooks/useEnhancedApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";

import { JobImportModal } from "@/components/dashboard/JobImportModal";
import { JobDetailsModal } from "@/components/dashboard/JobDetailsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useApplicationManagement } from "@/hooks/useApplicationManagement";
import { useJobManagement } from "@/hooks/useJobManagement";
import { useDashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardSidebar, type DashboardSection } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import { settingsApi } from "@/utils/api/settings";
import { useSubscription } from "@/providers/subscription-provider";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Application, DashboardView, BoardMode } from "@/types/dashboard";
import { FileText, Target, TrendingUp, Calendar, Briefcase, Sparkles, AlertCircle, Bell, X } from "lucide-react";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { calculatePercentage } from "@/utils/dashboard";
import { isPast, isToday } from "date-fns";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { useTourContext } from "@/providers/onboarding-tour-provider";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { UpgradeIntentDetail } from "@/utils/upgradeIntent";
import { analytics } from "@/firebase/analytics";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { MobileFAB } from "@/components/dashboard/MobileFAB";

// Dynamically import heavy components for code-splitting
const DraggableDashboard = dynamic(
  () => import("@/components/dashboard/DraggableDashboard").then(mod => ({ default: mod.DraggableDashboard })),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

const DashboardAnalytics = dynamic(
  () => import("@/components/dashboard/DashboardAnalytics").then(mod => ({ default: mod.DashboardAnalytics })),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

const DashboardJobsView = dynamic(
  () => import("@/components/dashboard/DashboardJobsView").then(mod => ({ default: mod.DashboardJobsView })),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);




export function Dashboard() {
  const { user, loading } = useFirebaseAuth();
  const { plan } = useSubscription();
  const isMobile = useIsMobile();
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>("applicationsPerMonth");
  const [upgradeTitle, setUpgradeTitle] = useState("Application Limit Reached");
  const [upgradeDescription, setUpgradeDescription] = useState(
    "You've reached your monthly limit of 50 job applications. Upgrade to Premium for unlimited applications."
  );

  const [view, setView] = useState<DashboardView>("dashboard");
  const [boardMode, setBoardMode] = useState<BoardMode>(() => {
    // Load from localStorage on initial render (fallback while API loads)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hireall_dashboard_board_mode');
      if (saved === 'kanban' || saved === 'list') {
        return saved;
      }
    }
    return "list";
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [showReminderAlert, setShowReminderAlert] = useState(true);

  // Load boardMode from user settings on mount
  useEffect(() => {
    if (!user?.uid) return;
    
    settingsApi.getPreferences()
      .then((response) => {
        const savedMode = response?.preferences?.boardMode;
        if (savedMode === 'kanban' || savedMode === 'list') {
          setBoardMode(savedMode);
          localStorage.setItem('hireall_dashboard_board_mode', savedMode);
        }
      })
      .catch((error) => {
        console.error('Failed to load preferences:', error);
      });
  }, [user?.uid]);

  // Persist boardMode preference to both localStorage and API
  const handleBoardModeChange = (mode: BoardMode) => {
    setBoardMode(mode);
    localStorage.setItem('hireall_dashboard_board_mode', mode);
    
    // Save to user settings API
    if (user) {
      settingsApi.updatePreferences({
        preferences: { boardMode: mode }
      }).catch((error) => {
        console.error('Failed to save board mode preference:', error);
      });
    }
  };


  // Use the new hooks
  const { dashboardLayout, handleLayoutChange } = useDashboardLayout();
  
  // Onboarding state and tour
  const onboarding = useOnboardingState();
  const tour = useTourContext();
  
  // Auto-start dashboard tour for new users
  useEffect(() => {
    if (
      onboarding.isLoaded &&
      onboarding.isNewUser &&
      !onboarding.hasCompletedDashboardTour &&
      user &&
      !loading
    ) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        tour.startDashboardTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onboarding.isLoaded, onboarding.isNewUser, onboarding.hasCompletedDashboardTour, user, loading, tour]);

  // Fetch user record
  const { data: userRecord, loading: userRecordLoading, error: userRecordError, refetch: refetchUserRecord } = useEnhancedApi(
    () =>
      user && user.uid
        ? dashboardApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    { immediate: !!user?.uid }
  );

  // Fetch applications
  const { data: applications, refetch: refetchApplications, loading: applicationsLoading, error: applicationsError } = useEnhancedApi<Application[]>(
    () => dashboardApi.getApplicationsByUser(userRecord!._id),
    { immediate: !!userRecord }
  );

  const safeApplications: Application[] = Array.isArray(applications)
    ? applications
    : Array.isArray((applications as any)?.applications)
      ? (applications as any).applications
      : Array.isArray((applications as any)?.data)
        ? (applications as any).data
        : [];

  // Fetch job stats
  const { data: jobStats, refetch: refetchJobStats, loading: jobStatsLoading, error: jobStatsError } = useEnhancedApi(
    () => dashboardApi.getJobStats(userRecord!._id),
    { immediate: !!userRecord }
  );

  // Fetch Resume analyses
  const { data: cvAnalyses } = useEnhancedApi(
    () => cvEvaluatorApi.getCvAnalysesByUser(userRecord!._id),
    { immediate: !!userRecord }
  );

  // Re-fetch when userRecord changes
  useEffect(() => {
    if (userRecord?._id) {
      refetchApplications();
      refetchJobStats();
    }
  }, [userRecord?._id]);



  // Initialize management hooks after refetch functions are available
  const applicationManagement = useApplicationManagement(refetchApplications);
  const handleUpgradeIntent = (detail: UpgradeIntentDetail) => {
    analytics.logFeatureUsed("upgrade_dialog_open", JSON.stringify(detail));
    setUpgradeFeature(detail?.feature ?? "applicationsPerMonth");
    setUpgradeTitle(detail?.title ?? "Upgrade to Premium");
    setUpgradeDescription(
      detail?.description ??
      "Unlock premium features to keep your job search moving without limits."
    );
    setShowUpgradePrompt(true);
  };

  const jobManagement = useJobManagement(refetchJobStats, handleUpgradeIntent);

  const overdueReminders = safeApplications.filter(
    (app) => app.followUpDate && isPast(new Date(app.followUpDate)) && !isToday(new Date(app.followUpDate))
  );
  
  const todayReminders = safeApplications.filter(
    (app) => app.followUpDate && isToday(new Date(app.followUpDate))
  );

  const hasApplications = safeApplications.length > 0;

  const hasData = hasApplications || (jobStats && jobStats.totalJobs > 0);

  // Computed values for filtering




  // Define dashboard widgets using the hook
  const dashboardWidgets = useDashboardWidgets({
    jobStats,
    applications: safeApplications,
    hasApplications,
    userRecord,
    onEditApplication: applicationManagement.handleEditApplication,
    onDeleteApplication: applicationManagement.handleDeleteApplication,
    onViewApplication: applicationManagement.handleViewApplication,
    onRefetchApplications: refetchApplications,
  });

  // Destructure application management BEFORE conditional returns
  const {
    showApplicationForm,
    setShowApplicationForm,
    editingApplication,
    setEditingApplication,
    selectedApplication,
    setSelectedApplication,
    handleEditApplication,
    handleViewApplication,
    handleDeleteApplication,
    handleApplicationSubmit,
  } = applicationManagement;

  const {
    showJobForm,
    setShowJobForm,
    showImportModal,
    setShowImportModal,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleJobSubmit,
  } = jobManagement;

  // useRestoreFocus hooks MUST be called unconditionally (before any early returns)
  useRestoreFocus(showApplicationForm);
  useRestoreFocus(showJobForm);
  useRestoreFocus(showImportModal);
  useRestoreFocus(!!selectedApplication);

  useEffect(() => {
    const listener = (event: Event) => {
      const upgradeEvent = event as CustomEvent<UpgradeIntentDetail>;
      handleUpgradeIntent(upgradeEvent.detail || {});
      upgradeEvent.preventDefault();
    };

    window.addEventListener("hireall:open-upgrade", listener as EventListener);
    return () => window.removeEventListener("hireall:open-upgrade", listener as EventListener);
  }, []);

  // Show skeleton during auth loading OR data loading
  const isDataLoading =
    loading ||
    (userRecordLoading && !userRecord) ||
    (!!userRecord && applicationsLoading && !applications) ||
    (!!userRecord && jobStatsLoading && !jobStats);
  
  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-14">
        <div className="text-center">
          <p className="mb-4">Please sign in to access your dashboard.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const handleDeleteApplicationWrapper = async (application: Application) => {
    if (!application?._id) {
      return;
    }

    await handleDeleteApplication(application._id);
  };



  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Clean background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-muted/30 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-muted/20 rounded-full filter blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <DashboardHeader
          onImportJobs={() => setShowImportModal(true)}
          onAddJob={() => setShowJobForm(true)}
          onAddApplication={() => setShowApplicationForm(true)}
        />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs for navigation */}
          <Breadcrumbs className="mb-4" />

          {/* PullToRefresh wrapper for mobile */}
          <PullToRefresh
            onRefresh={async () => {
              await Promise.all([
                refetchApplications(),
                refetchJobStats(),
              ]);
            }}
            enabled={isMobile}
          >
        {/* Premium Upgrade Banner for Free Users */}
        {plan === "free" && <PremiumUpgradeBanner className="mb-6" />}

        {/* Welcome / Onboarding Banner */}
        {hasApplications && safeApplications.length < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-primary rounded-2xl text-primary-foreground shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-foreground/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1 text-primary-foreground">Kickstart your job search</h2>
                  <p className="text-primary-foreground/80 max-w-xl text-sm">
                    You&apos;ve added your first applications. Import more jobs using the browser extension or optimize your resume with our AI CV Evaluator.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  onClick={() => setShowImportModal(true)}
                  variant="secondary" 
                  size="sm"
                  className="shadow-md"
                >
                  Import Jobs
                </Button>
                <Button 
                  onClick={() => window.location.href = '/career-tools'}
                  variant="ghost" 
                  size="sm"
                  data-tour="cv-evaluator"
                  className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
                >
                  Optimize CV
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reminder Alert */}
        {showReminderAlert && (overdueReminders.length > 0 || todayReminders.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 overflow-hidden"
          >
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              overdueReminders.length > 0 
                ? "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30" 
                : "bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  overdueReminders.length > 0 ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"
                }`}>
                  {overdueReminders.length > 0 ? (
                    <AlertCircle className={`h-5 w-5 ${overdueReminders.length > 0 ? "text-red-600" : "text-amber-600"}`} />
                  ) : (
                    <Bell className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${overdueReminders.length > 0 ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                    {overdueReminders.length > 0 
                      ? `You have ${overdueReminders.length} overdue follow-up${overdueReminders.length === 1 ? '' : 's'}!` 
                      : `You have ${todayReminders.length} follow-up${todayReminders.length === 1 ? '' : 's'} scheduled for today.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't let these opportunities slip away. Check your reminders below.
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReminderAlert(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Sidebar Navigation + Content (matches Career Tools layout) */}
        <div className="flex gap-6">
          <DashboardSidebar
            activeSection={(view as DashboardSection) || "dashboard"}
            onSectionChange={(next) => setView(next)}
            jobsCount={safeApplications.length}
          />

          <div className="flex-1 min-w-0">
            {view === "dashboard" &&
              (hasData ? (
                <DraggableDashboard
                  widgets={dashboardWidgets}
                  onLayoutChange={handleLayoutChange}
                  savedLayout={
                    dashboardLayout.length > 0 ? dashboardLayout : undefined
                  }
                />
              ) : (
                <DashboardEmptyState
                  onImportJobs={() => setShowImportModal(true)}
                  onAddJob={() => setShowJobForm(true)}
                  onAddApplication={() => setShowApplicationForm(true)}
                  userRecord={userRecord}
                />
              ))}

            {view === "analytics" && (
              <DashboardAnalytics
                applications={applications || []}
                cvAnalyses={cvAnalyses || []}
                jobStats={jobStats}
              />
            )}

            {view === "jobs" && (
              <DashboardJobsView
                applications={safeApplications}
                boardMode={boardMode}
                setBoardMode={handleBoardModeChange}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                onEditApplication={handleEditApplication}
                onDeleteApplication={handleDeleteApplicationWrapper}
                onViewApplication={handleViewApplication}
                onChanged={refetchApplications}
                onAddJob={() => setShowJobForm(true)}
                onImport={() => setShowImportModal(true)}
              />
            )}
          </div>
        </div>
        </PullToRefresh>

        {/* Modals */}
        <Dialog
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] md:w-full overflow-y-auto">
            <ApplicationForm
              application={editingApplication || undefined}
              onSubmit={handleApplicationSubmit}
              onCancel={() => {
                setShowApplicationForm(false);
                setEditingApplication(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] md:w-full overflow-y-auto">
            <JobForm
              onSubmit={handleJobSubmit}
              onCancel={() => setShowJobForm(false)}
            />
          </DialogContent>
        </Dialog>

        {showImportModal && (
          <JobImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => {
              refetchJobStats();
              refetchApplications();
            }}
          />
        )}

        <JobDetailsModal
          application={selectedApplication}
          open={!!selectedApplication}
          onOpenChange={(open) => !open && setSelectedApplication(null)}
          onEdit={(app) => {
            setSelectedApplication(null);
            handleEditApplication(app);
          }}
          onChanged={() => {
            refetchJobStats();
            refetchApplications();
          }}
        />

        {/* Upgrade prompt for premium features */}
        <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{upgradeTitle}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {upgradeDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <UpgradePrompt feature={upgradeFeature} variant="dialog" />
            </div>
          </DialogContent>
        </Dialog>

        <WelcomeDialog />

        {/* Mobile FAB for adding jobs */}
        {isMobile && (
          <MobileFAB
            onClick={() => setShowJobForm(true)}
            label="Add Job"
          />
        )}
      </div>
      </div>
    </div>
  );
}
