"use client";

import React, { useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { JobImportModal } from "@/components/dashboard/JobImportModal";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/UpgradePrompt";
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
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardJobsView } from "@/components/dashboard/DashboardJobsView";
import { Application, DashboardView, BoardMode } from "@/types/dashboard";
import { UploadCloud, FilePlus, ClipboardList, Inbox, ArrowRight, FileText } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { JobList } from "@/components/dashboard/JobList";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";

export function AdvancedDashboard() {
  const { user, loading } = useFirebaseAuth();
  const { plan, limits, currentUsage } = useSubscription();

  const [view, setView] = useState<DashboardView>("dashboard");
  const [boardMode, setBoardMode] = useState<BoardMode>("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [savedViews, setSavedViews] = useState<any[]>([]);

  // Use the new hooks
  const { dashboardLayout, handleLayoutChange } = useDashboardLayout();

  // Fetch user record
  const { data: userRecord } = useApiQuery(
    () =>
      user && user.uid
        ? dashboardApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  // Fetch applications
  const { data: applications, refetch: refetchApplications } = useApiQuery(
    () =>
      userRecord
        ? dashboardApi.getApplicationsByUser(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Fetch job stats
  const { data: jobStats, refetch: refetchJobStats } = useApiQuery(
    () =>
      userRecord
        ? dashboardApi.getJobStats(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Fetch CV analyses
  const { data: cvAnalyses } = useApiQuery(
    () =>
      userRecord
        ? cvEvaluatorApi.getCvAnalysesByUser(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Fetch saved views
  const { data: savedViewsData } = useApiQuery(
    () => dashboardApi.getSavedViews(),
    []
  );

  // Update saved views when data changes
  React.useEffect(() => {
    if (savedViewsData) {
      setSavedViews(savedViewsData);
    }
  }, [savedViewsData]);

  // Initialize management hooks after refetch functions are available
  const applicationManagement = useApplicationManagement(refetchApplications);
  const jobManagement = useJobManagement(refetchJobStats);

  // Create wrapper functions to match expected interfaces
  const handleDeleteApplicationWrapper = (application: Application) => {
    applicationManagement.handleDeleteApplication(application._id);
  };

  const hasApplications =
    Array.isArray(applications) && applications.length > 0;

  // Computed values for filtering
  const filteredApplications = (applications || []).filter((app) => {
    const matchesSearch = !searchTerm || 
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesCompany = companyFilter === "all" || app.job?.company === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const uniqueCompanies = [...new Set((applications || []).map(app => app.job?.company).filter(Boolean))];



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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted via-amber-50/20 to-background mt-14">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="h-8 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/30 to-muted-foreground/20 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/30 to-muted-foreground/20 bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"
                ></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/30 to-muted-foreground/20 bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"></div>
              <div className="h-64 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/30 to-muted-foreground/20 bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sky-50/20 to-violet-50 pt-16">
      {/* Header */}
      <DashboardHeader
        onImportJobs={() => setShowImportModal(true)}
        onAddJob={() => setShowJobForm(true)}
        onAddApplication={() => setShowApplicationForm(true)}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Premium Upgrade Banner for Free Users */}
        {plan === "free" && <PremiumUpgradeBanner className="mb-6" />}

        {/* Navigation Tabs */}
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
            className="mb-8"
          >
            <TabsList>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-violet-600 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Dashboard
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-violet-600 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Jobs ({applications?.length || 0})
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-violet-600 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Analytics
                </TabsTrigger>
              </motion.div>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Main Content */}
        {view === "dashboard" &&
          (hasApplications ? (
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
          />
        )}

        {/* Modals */}
        <Dialog
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
        >
          <DialogContent className="max-w-4xl md:max-w-4xl max-h-[90vh] w-[95vw] md:w-full overflow-y-auto">
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
          <DialogContent className="max-w-4xl md:max-w-4xl max-h-[90vh] w-[95vw] md:w-full overflow-y-auto">
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

        <Dialog
          open={!!selectedApplication}
          onOpenChange={() => setSelectedApplication(null)}
        >
          <DialogContent className="max-w-2xl md:max-w-2xl max-h-[90vh] w-[95vw] md:w-full overflow-y-auto">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedApplication.job?.title}</DialogTitle>
                  <DialogDescription>
                    View application details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">
                        {selectedApplication.job?.company}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {selectedApplication.job?.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">
                        {selectedApplication.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date Found
                      </p>
                      <p className="font-medium">
                        {new Date(
                          selectedApplication.job?.dateFound || 0
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedApplication.appliedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Applied Date
                      </p>
                      <p className="font-medium">
                        {new Date(
                          selectedApplication.appliedDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {selectedApplication.interviewDates &&
                    selectedApplication.interviewDates.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Interview Dates
                        </p>
                        <ul className="list-disc list-inside">
                          {selectedApplication.interviewDates.map(
                            (date, index) => (
                              <li key={index} className="font-medium">
                                {new Date(date).toLocaleDateString()}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {selectedApplication.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{selectedApplication.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="default"
                    onClick={() => {
                      setSelectedApplication(null);
                      handleEditApplication(selectedApplication);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
