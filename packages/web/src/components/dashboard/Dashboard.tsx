"use client";

import React, { useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";

import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";

import { JobImportModal } from "@/components/dashboard/JobImportModal";
import { JobDetailsModal } from "@/components/dashboard/JobDetailsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DraggableDashboard } from "@/components/dashboard/DraggableDashboard";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import { useSubscription } from "@/providers/subscription-provider";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardJobsView } from "@/components/dashboard/DashboardJobsView";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { Application, DashboardView, BoardMode } from "@/types/dashboard";
import { FileText, Target, TrendingUp, Calendar, Briefcase, Sparkles, AlertCircle, Bell, X } from "lucide-react";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { calculatePercentage } from "@/utils/dashboard";
import { isPast, isToday } from "date-fns";





export function Dashboard() {
  const { user, loading } = useFirebaseAuth();
  const { plan } = useSubscription();

  const [view, setView] = useState<DashboardView>("dashboard");
  const [boardMode, setBoardMode] = useState<BoardMode>("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [showReminderAlert, setShowReminderAlert] = useState(true);


  // Use the new hooks
  const { dashboardLayout, handleLayoutChange } = useDashboardLayout();

  // Fetch user record
  const { data: userRecord, loading: userRecordLoading, error: userRecordError } = useApiQuery(
    () =>
      user && user.uid
        ? dashboardApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid],
    { enabled: !!user?.uid }
  );

  // Fetch applications
  const { data: applications, refetch: refetchApplications, loading: applicationsLoading, error: applicationsError } = useApiQuery(
    () => dashboardApi.getApplicationsByUser(userRecord!._id),
    [userRecord?._id],
    { enabled: !!userRecord, staleTime: 0 }, // Disable cache for debugging
    `applications-${userRecord?._id}` // Unique key
  );

  // Fetch job stats
  const { data: jobStats, refetch: refetchJobStats, loading: jobStatsLoading, error: jobStatsError } = useApiQuery(
    () => dashboardApi.getJobStats(userRecord!._id),
    [userRecord?._id],
    { enabled: !!userRecord }
  );

  // Fetch CV analyses
  const { data: cvAnalyses } = useApiQuery(
    () => cvEvaluatorApi.getCvAnalysesByUser(userRecord!._id),
    [userRecord?._id],
    { enabled: !!userRecord }
  );



  // Initialize management hooks after refetch functions are available
  const applicationManagement = useApplicationManagement(refetchApplications);
  const jobManagement = useJobManagement(refetchJobStats);

  const overdueReminders = (applications || []).filter(
    (app) => app.followUpDate && isPast(new Date(app.followUpDate)) && !isToday(new Date(app.followUpDate))
  );
  
  const todayReminders = (applications || []).filter(
    (app) => app.followUpDate && isToday(new Date(app.followUpDate))
  );

  const hasApplications =
    Array.isArray(applications) && applications.length > 0;

  const hasData = hasApplications || (jobStats && jobStats.totalJobs > 0);

  // Computed values for filtering




  // Define dashboard widgets using the hook
  const dashboardWidgets = useDashboardWidgets({
    jobStats,
    applications: applications || [],
    hasApplications,
    userRecord,
    onEditApplication: applicationManagement.handleEditApplication,
    onDeleteApplication: applicationManagement.handleDeleteApplication,
    onViewApplication: applicationManagement.handleViewApplication,
    onRefetchApplications: refetchApplications,
  });

  // Show skeleton during auth loading OR data loading
  const isDataLoading = loading || userRecordLoading || (!!userRecord && (applicationsLoading || jobStatsLoading));
  
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

  // Use the new hook functions
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
    handleJobSubmit,
  } = jobManagement;

  useRestoreFocus(showApplicationForm);
  useRestoreFocus(showJobForm);
  useRestoreFocus(showImportModal);
  useRestoreFocus(!!selectedApplication);

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
        {/* Premium Upgrade Banner for Free Users */}
        {plan === "free" && <PremiumUpgradeBanner className="mb-6" />}

        {/* Welcome / Onboarding Banner */}
        {hasApplications && applications.length < 5 && (
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

        {/* Enhanced Quick Stats */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {/* Total Jobs */}
            <motion.div
              className="motion-card bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md motion-surface"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobStats ? jobStats.totalJobs : (applications?.length || 0)}
                  </p>
                  <p className="text-xxs text-muted-foreground mt-0.5">
                    {jobStats ? 'Imported & Tracked' : 'Tracking'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Sponsored Jobs */}
            <motion.div
              className="motion-card bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md motion-surface"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Sponsored</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobStats ? jobStats.sponsoredJobs : (applications?.filter(app => app.job?.isSponsored).length || 0)}
                  </p>
                  <p className="text-xxs text-muted-foreground mt-0.5">
                    {jobStats 
                      ? `${calculatePercentage(jobStats.sponsoredJobs, jobStats.totalJobs)}% of total`
                      : `${calculatePercentage(applications?.filter(app => app.job?.isSponsored).length || 0, applications?.length || 0)}% of total`
                    }
                  </p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Today's Activity */}
            <motion.div
              className="motion-card bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md motion-surface"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobStats ? jobStats.jobsToday : (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return applications?.filter(app =>
                        new Date(app.createdAt || app.job?.dateFound || 0) >= today
                      ).length || 0;
                    })()}
                  </p>
                  <p className="text-xxs text-muted-foreground mt-0.5">New jobs found</p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Tabs
            value={view}
            onValueChange={(value) =>
              setView(
                value === "dashboard" ||
                  value === "jobs" ||
                  value === "applications" ||
                  value === "analytics"
                  ? value
                  : "dashboard"
              )
            }
            className="mb-6"
          >
            <TabsList className="bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/50 shadow-sm inline-flex h-auto gap-1">
              <TabsTrigger
                value="dashboard"
                className="motion-button px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md motion-control rounded-lg font-medium text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="motion-button px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md motion-control rounded-lg font-medium text-sm"
              >
                Jobs <Badge variant="secondary" className="ml-1.5 text-xxs px-1.5 py-0 bg-muted/80">{applications?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="motion-button px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md motion-control rounded-lg font-medium text-sm"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Main Content */}
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
            applications={applications || []}
            boardMode={boardMode}
            setBoardMode={setBoardMode}
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
        />
      </div>
      </div>
    </div>
  );
}
