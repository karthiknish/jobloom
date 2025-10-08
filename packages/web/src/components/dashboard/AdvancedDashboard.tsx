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
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardJobsView } from "@/components/dashboard/DashboardJobsView";
import { Application, DashboardView, BoardMode } from "@/types/dashboard";
import { ArrowRight, FileText, Target, TrendingUp, Calendar, BarChart3, Brain, Sparkles, Zap } from "lucide-react";





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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background mt-14">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="h-8 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-shimmer-v2 rounded w-1/4 skeleton-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-shimmer-v2 rounded-lg shadow-sm skeleton-shimmer"
                ></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-shimmer-v2 rounded-lg shadow-sm skeleton-shimmer"></div>
              <div className="h-64 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-shimmer-v2 rounded-lg shadow-sm skeleton-shimmer"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <DashboardHeader
          onImportJobs={() => setShowImportModal(true)}
          onAddJob={() => setShowJobForm(true)}
          onAddApplication={() => setShowApplicationForm(true)}
        />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Premium Upgrade Banner for Free Users */}
        {plan === "free" && <PremiumUpgradeBanner className="mb-6" />}

        {/* Enhanced Quick Stats */}
        {hasApplications && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Applications */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-primary/10 border border-primary/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary text-sm font-medium mb-1">Total Applications</p>
                  <p className="text-2xl font-bold text-primary">{applications?.length || 0}</p>
                  <p className="text-xs text-primary mt-1">Active job search</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Sponsored Jobs */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm font-medium mb-1">Sponsored Jobs</p>
                  <p className="text-2xl font-bold text-secondary">
                    {applications?.filter(app => app.job?.isSponsored).length || 0}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    {((applications?.filter(app => app.job?.isSponsored).length || 0) / (applications?.length || 1) * 100).toFixed(0)}% of total
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-secondary-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Interview Rate */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-accent/10 border border-accent/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent-foreground text-sm font-medium mb-1">Interview Rate</p>
                  <p className="text-2xl font-bold text-accent-foreground">
                    {(() => {
                      const applied = applications?.filter(app => app.status === 'applied').length || 0;
                      const interviewing = applications?.filter(app => app.status === 'interviewing').length || 0;
                      return applied > 0 ? Math.round((interviewing / applied) * 100) : 0;
                    })()}%
                  </p>
                  <p className="text-xs text-accent-foreground mt-1">Success rate</p>
                </div>
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
              </div>
            </motion.div>

            {/* This Week Activity */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-muted border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">This Week</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return applications?.filter(app =>
                        new Date(app.createdAt || app.job?.dateFound || 0) >= weekAgo
                      ).length || 0;
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">New applications</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
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
                  value === "analytics" ||
                  value === "cv-evaluator"
                  ? value
                  : "dashboard"
              )
            }
            className="mb-8"
          >
            <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Jobs ({applications?.length || 0})
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="cv-evaluator"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  CV Evaluator
                </TabsTrigger>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
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

        {view === "cv-evaluator" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Brain className="w-6 h-6 text-primary" />
                      AI-Powered CV Evaluator
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Optimize your CV with our advanced ATS scoring system and get personalized feedback
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-card/80 rounded-xl border border-border">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">Real-time Analysis</h3>
                    <p className="text-sm text-muted-foreground">Get instant feedback as you write your CV</p>
                  </div>
                  <div className="text-center p-6 bg-card/80 rounded-xl border border-border">
                    <Target className="w-8 h-8 text-secondary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">ATS Optimized</h3>
                    <p className="text-sm text-muted-foreground">Pass through Applicant Tracking Systems with confidence</p>
                  </div>
                  <div className="text-center p-6 bg-card/80 rounded-xl border border-border">
                    <TrendingUp className="w-8 h-8 text-accent-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">Industry Insights</h3>
                    <p className="text-sm text-muted-foreground">Get tailored recommendations for your target role</p>
                  </div>
                </div>
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => window.location.href = '/cv-evaluator'}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Launch CV Evaluator
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    {cvAnalyses && cvAnalyses.length > 0
                      ? `You have ${cvAnalyses.length} previous ${cvAnalyses.length === 1 ? 'analysis' : 'analyses'}`
                      : "Start your first CV analysis today"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {cvAnalyses && cvAnalyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Recent CV Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cvAnalyses.slice(0, 6).map((analysis: any) => (
                      <div key={analysis._id} className="p-4 border border-border rounded-lg bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium truncate">{analysis.fileName}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            (analysis.overallScore || 0) >= 80
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : (analysis.overallScore || 0) >= 60
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {analysis.overallScore || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </p>
                        {analysis.atsCompatibility && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ATS Score: {analysis.atsCompatibility.score}/100
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {cvAnalyses.length > 6 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => window.location.href = '/cv-evaluator'}>
                        View All Analyses ({cvAnalyses.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

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
