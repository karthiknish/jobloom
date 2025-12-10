"use client";

import React, { useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";

import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";

import { JobImportModal } from "@/components/dashboard/JobImportModal";
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
import { Application, DashboardView, BoardMode } from "@/types/dashboard";
import { FileText, Target, TrendingUp, Calendar, Briefcase, Sparkles } from "lucide-react";





export function AdvancedDashboard() {
  const { user, loading } = useFirebaseAuth();
  const { plan } = useSubscription();

  const [view, setView] = useState<DashboardView>("dashboard");
  const [boardMode, setBoardMode] = useState<BoardMode>("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");


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
    () => dashboardApi.getApplicationsByUser(userRecord!._id),
    [userRecord?._id],
    { enabled: !!userRecord }
  );

  // Fetch job stats
  const { data: jobStats, refetch: refetchJobStats } = useApiQuery(
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

  // Create wrapper functions to match expected interfaces


  const hasApplications =
    Array.isArray(applications) && applications.length > 0;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background mt-14">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="h-8 bg-muted animate-pulse rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-muted animate-pulse rounded-lg shadow-sm"
                ></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-muted animate-pulse rounded-lg shadow-sm"></div>
              <div className="h-64 bg-muted animate-pulse rounded-lg shadow-sm"></div>
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
                  variant="outline" 
                  size="sm"
                  className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
                >
                  Optimize CV
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Quick Stats */}
        {hasApplications && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {/* Total Applications */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{applications?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tracking</p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Sponsored Jobs */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Sponsored</p>
                  <p className="text-2xl font-bold text-foreground">
                    {applications?.filter(app => app.job?.isSponsored).length || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {((applications?.filter(app => app.job?.isSponsored).length || 0) / (applications?.length || 1) * 100).toFixed(0)}% of total
                  </p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Interview Rate */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Interview Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      const applied = applications?.filter(app => app.status === 'applied').length || 0;
                      const interviewing = applications?.filter(app => app.status === 'interviewing').length || 0;
                      return applied > 0 ? Math.round((interviewing / applied) * 100) : 0;
                    })()}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Success rate</p>
                </div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </motion.div>

            {/* This Week Activity */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">This Week</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return applications?.filter(app =>
                        new Date(app.createdAt || app.job?.dateFound || 0) >= weekAgo
                      ).length || 0;
                    })()}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">New jobs added</p>
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
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="dashboard"
                  className="px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg font-medium text-sm"
                >
                  Overview
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="jobs"
                  className="px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg font-medium text-sm"
                >
                  Jobs <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 bg-muted/80">{applications?.length || 0}</Badge>
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="analytics"
                  className="px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg font-medium text-sm"
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
    </div>
  );
}
