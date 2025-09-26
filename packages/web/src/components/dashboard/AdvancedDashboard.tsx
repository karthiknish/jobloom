"use client";

import React, { useState } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { JobList } from "@/components/dashboard/JobList";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import { FileText } from "lucide-react";
import { UpcomingFollowUps } from "@/components/dashboard/UpcomingFollowUps";
import { SponsorshipQuickCheck } from "@/components/dashboard/SponsorshipQuickCheck";
import { JobStatsDashboard } from "@/components/dashboard/JobStatsDashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { JobImportModal } from "@/components/dashboard/JobImportModal";
import { CvAnalysisHistory } from "@/components/CvAnalysisHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGate } from "@/components/UpgradePrompt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import {
  ClipboardList,
  LayoutDashboard,
  Inbox,
  FilePlus,
  UploadCloud,
  ArrowRight,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  source: string;
  dateFound: number;
  userId: string;
}

interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: Job;
}

export function AdvancedDashboard() {
  const { user, loading } = useFirebaseAuth();
  const { plan, limits, currentUsage, getRemainingUsage } = useSubscription();

  // All hooks must be called at the top level, before any conditional returns
  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? "Good morning"
      : hours < 18
      ? "Good afternoon"
      : "Good evening";

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [view, setView] = useState<"dashboard" | "jobs" | "applications" | "analytics">(
    "dashboard"
  );
  const [boardMode, setBoardMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [savedViews, setSavedViews] = useState<{ id: string; name: string; filters: Record<string, unknown> }[]>([]);

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

  const hasApplications =
    Array.isArray(applications) && applications.length > 0;

  // Filter applications based on current filters
  const filteredApplications = React.useMemo(() => {
    if (!applications) return [];

    let filtered = applications;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.job?.title.toLowerCase().includes(term) ||
        app.job?.company.toLowerCase().includes(term) ||
        app.job?.location.toLowerCase().includes(term)
      );
    }

    // Company filter
    if (companyFilter !== "all") {
      filtered = filtered.filter(app => app.job?.company === companyFilter);
    }

    return filtered;
  }, [applications, statusFilter, searchTerm, companyFilter]);

  // Get unique companies for filter dropdown
  const uniqueCompanies = React.useMemo(() => {
    if (!applications) return [];
    const companies = applications
      .map(app => app.job?.company)
      .filter(Boolean) as string[];
    return Array.from(new Set(companies)).sort();
  }, [applications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-white    mt-14">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200    bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200    bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200    bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"></div>
              <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200    bg-[length:200%_100%] animate-shimmer rounded-lg shadow-sm"></div>
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

  const handleEditApplication = (application: Application) => {
    setEditingApplication(application);
    setShowApplicationForm(true);
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      await dashboardApi.deleteApplication(applicationId);
      await refetchApplications();
      showSuccess("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      showError("Failed to delete application");
    }
  };

  const handleApplicationSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingApplication) {
        await dashboardApi.updateApplication(editingApplication._id, data);
        showSuccess("Application updated successfully");
      } else {
        await dashboardApi.createApplication(data);
        showSuccess("Application created successfully");
      }
      await refetchApplications();
      setShowApplicationForm(false);
      setEditingApplication(null);
    } catch (error) {
      console.error("Error saving application:", error);
      showError("Failed to save application");
    }
  };

  const handleJobSubmit = async (data: Record<string, unknown>) => {
    try {
      await dashboardApi.createJob(data);
      await refetchJobStats();
      showSuccess("Job added successfully");
      setShowJobForm(false);
    } catch (error) {
      console.error("Error adding job:", error);
      showError("Failed to add job");
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please sign in to access your dashboard
          </h2>
          <p className="text-gray-600">
            Track your job applications and discover new opportunities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50    pt-16">
      {/* Header */}
      <div className="bg-white/90  backdrop-blur-2xl border-b border-gray-200/50  shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 gap-6"
          >
            <div className="flex items-start md:items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl"
              >
                <LayoutDashboard className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900   bg-clip-text text-transparent"
                >
                  Job Dashboard
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  className="flex items-center gap-3 mt-3"
                >
                  <p className="text-base text-gray-700  font-medium">
                    {greeting}, <span className="text-gray-900  font-semibold">{user.displayName || user.email}</span>!
                  </p>
                  <Badge
                    variant={plan === "premium" ? "default" : "secondary"}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition-all duration-300 ${
                      plan === "premium"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400"
                    }`}
                  >
                    {plan === "premium" ? "✨ Premium" : "🚀 Free Plan"}
                  </Badge>
                  {currentUsage &&
                    limits.cvAnalysesPerMonth > 0 &&
                    limits.cvAnalysesPerMonth !== -1 && (
                      <Badge variant="outline" className="text-xs font-medium border-blue-200 text-blue-700 bg-blue-50/50">
                        📊 CV: {currentUsage.cvAnalyses}/
                        {limits.cvAnalysesPerMonth === -1
                          ? "∞"
                          : limits.cvAnalysesPerMonth}
                      </Badge>
                    )}
                </motion.div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="default"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                >
                  <UploadCloud className="mr-2 h-4 w-4" /> Import Jobs
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowJobForm(true)}
                  variant="default"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                >
                  <FilePlus className="mr-2 h-4 w-4" /> Add Job
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  variant="outline"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  <ClipboardList className="mr-2 h-4 w-4" /> Add Application
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

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
            <TabsList className="bg-white/80 backdrop-blur-xl border border-gray-200/50 p-1 shadow-lg">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Dashboard
                </TabsTrigger>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger 
                  value="jobs" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Jobs ({applications?.length || 0})
                </TabsTrigger>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {jobStats && <JobStatsDashboard stats={jobStats} />}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                {applications && applications.length > 0 && (
                  <UpcomingFollowUps
                    applications={applications}
                    onChanged={refetchApplications}
                  />
                )}
              </motion.div>

              {/* Notification Center */}
              {applications && applications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Card className="border-0 bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -8 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </motion.div>
                        <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Notification Center</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center py-12">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 12 }}
                            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </motion.div>
                          <motion.h3
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.3 }}
                            className="text-lg font-semibold text-gray-900 mb-2"
                          >
                            All caught up! 🎉
                          </motion.h3>
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                            className="text-gray-600"
                          >
                            No pending notifications or follow-ups at this time.
                          </motion.p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                {applications && applications.length > 0 && (
                  <SponsorshipQuickCheck applications={applications} />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {userRecord && <ExtensionIntegration userId={userRecord._id} />}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Recent Applications</CardTitle>
                      {applications && (
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <ExportCsvButton
                              fileName="applications.csv"
                              rows={applications.map((a) => ({
                                id: a._id,
                                title: a.job?.title,
                                company: a.job?.company,
                                location: a.job?.location,
                                status: a.status,
                                dateFound: a.job?.dateFound,
                                appliedDate: a.appliedDate,
                                source: a.job?.source,
                                salary: a.job?.salary,
                                sponsored: a.job?.isSponsored,
                                agency: a.job?.isRecruitmentAgency,
                              }))}
                            />
                          </motion.div>
                          <FeatureGate
                            feature="exportFormats"
                            fallback={
                              <Button size="sm" variant="outline" disabled>
                                <FileText className="h-4 w-4 mr-2" />
                                JSON <span className="ml-1 text-xs">⭐</span>
                              </Button>
                            }
                          >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Export as JSON
                                  const data = applications.map((a) => ({
                                    id: a._id,
                                    title: a.job?.title,
                                    company: a.job?.company,
                                    location: a.job?.location,
                                    status: a.status,
                                    dateFound: a.job?.dateFound,
                                    appliedDate: a.appliedDate,
                                    source: a.job?.source,
                                    salary: a.job?.salary,
                                    sponsored: a.job?.isSponsored,
                                    agency: a.job?.isRecruitmentAgency,
                                    notes: a.notes,
                                    interviewDates: a.interviewDates,
                                    followUpDate: a.followUpDate,
                                  }));
                                  const blob = new Blob(
                                    [JSON.stringify(data, null, 2)],
                                    { type: "application/json" }
                                  );
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = "applications-export.json";
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  showSuccess("JSON export completed");
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                JSON{" "}
                                <span className="text-xs text-primary">⭐</span>
                              </Button>
                            </motion.div>
                          </FeatureGate>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <JobList
                      applications={applications!.slice(0, 5)}
                      onEditApplication={handleEditApplication}
                      onDeleteApplication={handleDeleteApplication}
                      onViewApplication={handleViewApplication}
                      onChanged={refetchApplications}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50 p-12 text-center shadow-xl border border-gray-100/50">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                  >
                    <Inbox className="h-8 w-8 text-white" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.35 }}
                    className="mt-6 text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent"
                  >
                    No applications yet
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.35 }}
                    className="mt-3 text-base text-gray-600 max-w-md mx-auto"
                  >
                    Get started by importing your jobs or adding a new one to begin tracking your job search journey.
                  </motion.p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => setShowImportModal(true)} 
                        size="lg"
                        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                      >
                        <UploadCloud className="mr-2 h-5 w-5" /> Import Jobs
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => setShowJobForm(true)}
                        variant="secondary"
                        size="lg"
                        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-800 border-0"
                      >
                        <FilePlus className="mr-2 h-5 w-5" /> Add Job
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => setShowApplicationForm(true)}
                        variant="outline"
                        size="lg"
                        className="shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      >
                        Add Application <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {userRecord && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  <ExtensionIntegration userId={userRecord._id} />
                </motion.div>
              )}
            </motion.div>
          ))}

        {view === "analytics" && (
          <FeatureGate feature="advancedAnalytics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Analytics & Insights
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Premium Feature
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30"
                  >
                    ⭐ Premium
                  </Badge>
                </div>
              </div>

              {/* CV Analysis Section */}
              <Card>
                <CardHeader>
                  <CardTitle>CV Analysis History</CardTitle>
                </CardHeader>
                <CardContent>
                  <CvAnalysisHistory analyses={cvAnalyses || []} />
                </CardContent>
              </Card>

              {/* Application Timeline */}
              {applications && applications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>📊</span>
                      Application Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications
                        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                        .slice(0, 10)
                        .map((application, index) => {
                          const daysSince = Math.floor(
                            (Date.now() - (application.createdAt || 0)) /
                              (1000 * 60 * 60 * 24)
                          );
                          const statusColor =
                            {
                              interested: "bg-gray-100 text-gray-800",
                              applied: "bg-blue-100 text-blue-800",
                              interviewing: "bg-purple-100 text-purple-800",
                              offered: "bg-green-100 text-green-800",
                              rejected: "bg-red-100 text-red-800",
                              withdrawn: "bg-gray-100 text-gray-800",
                            }[application.status] ||
                            "bg-gray-100 text-gray-800";

                          return (
                            <div
                              key={application._id}
                              className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium truncate">
                                    {application.job?.title}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                                  >
                                    {application.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {application.job?.company} •{" "}
                                  {application.job?.location}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {daysSince === 0
                                    ? "Today"
                                    : `${daysSince} day${
                                        daysSince !== 1 ? "s" : ""
                                      } ago`}
                                  {application.appliedDate && (
                                    <span className="ml-2">
                                      • Applied{" "}
                                      {Math.floor(
                                        (Date.now() - application.appliedDate) /
                                          (1000 * 60 * 60 * 24)
                                      )}{" "}
                                      days later
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {applications.length > 10 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" size="sm">
                          View All Applications
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-blue-100">
                            <span className="text-blue-600">📈</span>
                          </div>
                          <span className="ml-3 font-medium">This Week</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {applications?.filter((a) => {
                            const weekAgo =
                              Date.now() - 7 * 24 * 60 * 60 * 1000;
                            return a.createdAt >= weekAgo;
                          }).length || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-green-100">
                            <span className="text-green-600">✅</span>
                          </div>
                          <span className="ml-3 font-medium">Success Rate</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {applications && applications.length > 0
                            ? Math.round(
                                (applications.filter(
                                  (a) => a.status === "offered"
                                ).length /
                                  applications.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-orange-100">
                            <span className="text-orange-600">⏱️</span>
                          </div>
                          <span className="ml-3 font-medium">Avg Response</span>
                        </div>
                        <span className="text-lg font-bold text-orange-600">
                          3.2 days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jobStats && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Applications per Job
                            </span>
                            <span className="font-medium">
                              {jobStats.totalJobs > 0
                                ? (
                                    jobStats.totalApplications /
                                    jobStats.totalJobs
                                  ).toFixed(1)
                                : 0}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Interview Rate
                            </span>
                            <span className="font-medium">
                              {applications && applications.length > 0
                                ? Math.round(
                                    (applications.filter(
                                      (a) => a.status === "interviewing"
                                    ).length /
                                      applications.length) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Sponsored Jobs Applied
                            </span>
                            <span className="font-medium">
                              {applications && applications.length > 0
                                ? Math.round(
                                    (applications.filter(
                                      (a) => a.job?.isSponsored
                                    ).length /
                                      applications.length) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Agency Jobs Applied
                            </span>
                            <span className="font-medium">
                              {applications && applications.length > 0
                                ? Math.round(
                                    (applications.filter(
                                      (a) => a.job?.isRecruitmentAgency
                                    ).length /
                                      applications.length) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CV Analysis Stats */}
              {cvAnalyses && cvAnalyses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>CV Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {cvAnalyses.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Analyses
                        </div>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(
                            cvAnalyses.reduce(
                              (sum, a) => sum + (a.overallScore || 0),
                              0
                            ) / cvAnalyses.length
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg Score
                        </div>
                      </div>

                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {
                            cvAnalyses.filter(
                              (a) => a.analysisStatus === "completed"
                            ).length
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>

                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {cvAnalyses.length > 0
                            ? Math.round(
                                (cvAnalyses[0]?.atsCompatibility as any)
                                  ?.score || 0
                              )
                            : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ATS Score
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goal Setting and Progress Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎯</span>
                    Job Search Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Weekly Application Goal */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Weekly Applications
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {applications?.filter((a) => {
                            const weekAgo =
                              Date.now() - 7 * 24 * 60 * 60 * 1000;
                            return a.createdAt >= weekAgo;
                          }).length || 0}{" "}
                          / 10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              ((applications?.filter((a) => {
                                const weekAgo =
                                  Date.now() - 7 * 24 * 60 * 60 * 1000;
                                return a.createdAt >= weekAgo;
                              }).length || 0) /
                                10) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Goal: 10 applications per week
                      </p>
                    </div>

                    {/* Interview Goal */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Interviews This Month
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {applications?.filter(
                            (a) => a.status === "interviewing"
                          ).length || 0}{" "}
                          / 5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              ((applications?.filter(
                                (a) => a.status === "interviewing"
                              ).length || 0) /
                                5) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Goal: 5 interviews per month
                      </p>
                    </div>

                    {/* Response Rate Goal */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Response Rate
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {applications && applications.length > 0
                            ? Math.round(
                                (applications.filter(
                                  (a) =>
                                    a.status !== "applied" &&
                                    a.status !== "interested"
                                ).length /
                                  applications.length) *
                                  100
                              )
                            : 0}
                          % / 30%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              ((applications && applications.length > 0
                                ? (applications.filter(
                                    (a) =>
                                      a.status !== "applied" &&
                                      a.status !== "interested"
                                  ).length /
                                    applications.length) *
                                  100
                                : 0) /
                                30) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Goal: 30% response rate
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">
                          Set Custom Goals
                        </Button>
                        <Button size="sm" variant="outline">
                          View Progress Report
                        </Button>
                        <Button size="sm" variant="outline">
                          Weekly Summary
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </FeatureGate>
        )}

        {view === "jobs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {hasApplications ? (
              <>
                {/* Advanced Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Search</label>
                        <Input
                          placeholder="Job title, company, location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="interested">
                              Interested
                            </SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="interviewing">
                              Interviewing
                            </SelectItem>
                            <SelectItem value="offered">Offered</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Company Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company</label>
                        <Select
                          value={companyFilter}
                          onValueChange={setCompanyFilter}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {uniqueCompanies.map((company) => (
                              <SelectItem key={company} value={company}>
                                {company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Saved Views */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Saved Views
                        </label>
                        <Select
                          onValueChange={(value) => {
                            const view = savedViews.find((v) => v.id === value);
                            if (view) {
                              setStatusFilter(
                                (view.filters.status as string) || "all"
                              );
                              setCompanyFilter(
                                (view.filters.company as string) || "all"
                              );
                              setSearchTerm(
                                (view.filters.search as string) || ""
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Load saved view..." />
                          </SelectTrigger>
                          <SelectContent>
                            {savedViews.map((view) => (
                              <SelectItem key={view.id} value={view.id}>
                                {view.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Active Filters */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {statusFilter !== "all" && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("all")}
                        >
                          Status: {statusFilter} ×
                        </Badge>
                      )}
                      {companyFilter !== "all" && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setCompanyFilter("all")}
                        >
                          Company: {companyFilter} ×
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setSearchTerm("")}
                        >
                          Search: {searchTerm} ×
                        </Badge>
                      )}
                      {(statusFilter !== "all" ||
                        companyFilter !== "all" ||
                        searchTerm) && (
                        <Badge
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            setStatusFilter("all");
                            setCompanyFilter("all");
                            setSearchTerm("");
                          }}
                        >
                          Clear All
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mt-2">
                      Showing {filteredApplications.length} of{" "}
                      {applications.length} applications
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">View</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={boardMode === "list" ? "secondary" : "outline"}
                      onClick={() => setBoardMode("list")}
                    >
                      List
                    </Button>
                    <Button
                      size="sm"
                      variant={boardMode === "kanban" ? "secondary" : "outline"}
                      onClick={() => setBoardMode("kanban")}
                    >
                      Kanban
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <ExportCsvButton
                      fileName="filtered-applications.csv"
                      rows={filteredApplications.map((a) => ({
                        id: a._id,
                        title: a.job?.title,
                        company: a.job?.company,
                        location: a.job?.location,
                        status: a.status,
                        dateFound: a.job?.dateFound,
                        appliedDate: a.appliedDate,
                        source: a.job?.source,
                        salary: a.job?.salary,
                      }))}
                    />
                    <FeatureGate
                      feature="exportFormats"
                      fallback={
                        <Button size="sm" variant="outline" disabled>
                          <FileText className="h-4 w-4 mr-2" />
                          JSON <span className="ml-1 text-xs">⭐</span>
                        </Button>
                      }
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Export as JSON
                          const data = filteredApplications.map((a) => ({
                            id: a._id,
                            title: a.job?.title,
                            company: a.job?.company,
                            location: a.job?.location,
                            status: a.status,
                            dateFound: a.job?.dateFound,
                            appliedDate: a.appliedDate,
                            source: a.job?.source,
                            salary: a.job?.salary,
                            notes: a.notes,
                            interviewDates: a.interviewDates,
                            followUpDate: a.followUpDate,
                          }));
                          const blob = new Blob(
                            [JSON.stringify(data, null, 2)],
                            { type: "application/json" }
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "applications-export.json";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          showSuccess("JSON export completed");
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        JSON <span className="text-xs text-primary">⭐</span>
                      </Button>

                      {/* PDF Export - Premium Only */}
                      <FeatureGate
                        feature="exportFormats"
                        fallback={
                          <Button size="sm" variant="outline" disabled>
                            <FileText className="h-4 w-4 mr-2" />
                            PDF <span className="ml-1 text-xs">⭐</span>
                          </Button>
                        }
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mock PDF export - would integrate with PDF library
                            showSuccess("PDF export feature coming soon!");
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          PDF <span className="text-xs text-primary">⭐</span>
                        </Button>
                      </FeatureGate>
                    </FeatureGate>
                  </div>
                </div>
                {boardMode === "kanban" ? (
                  <KanbanBoard
                    applications={filteredApplications}
                    onChangeStatus={async (id, status) => {
                      try {
                        await dashboardApi.updateApplicationStatus(id, status);
                        showSuccess(`Status updated to ${status}`);
                        refetchApplications();
                      } catch (e: any) {
                        showError(e?.message || "Update failed");
                      }
                    }}
                    onReorder={async (draggedId, targetStatus, beforeId) => {
                      try {
                        // Compute an order value: if beforeId provided, take its order and subtract a tiny epsilon;
                        // else append at the end (use max order + 1)
                        const col = (applications || []).filter(
                          (a) => a.status === targetStatus
                        );
                        // Find before order
                        let newOrder: number;
                        if (beforeId) {
                          const before = col.find((a) => a._id === beforeId);
                          const beforeOrder =
                            typeof before?.order === "number"
                              ? before!.order!
                              : 0;
                          // To avoid collisions, pick slightly smaller than before
                          newOrder = beforeOrder - 0.001;
                        } else {
                          // Place at end
                          const maxOrder = col.reduce(
                            (m, a) =>
                              Math.max(
                                m,
                                typeof a.order === "number" ? a.order : 0
                              ),
                            0
                          );
                          newOrder = maxOrder + 1;
                        }
                        await dashboardApi.updateApplication(draggedId, {
                          status: targetStatus,
                          order: newOrder,
                        });
                        refetchApplications();
                      } catch (e: any) {
                        showError(e?.message || "Reorder failed");
                      }
                    }}
                    onView={(app) => setSelectedApplication(app as any)}
                  />
                ) : (
                  <JobList
                    applications={filteredApplications}
                    onEditApplication={handleEditApplication}
                    onDeleteApplication={handleDeleteApplication}
                    onViewApplication={handleViewApplication}
                    onChanged={refetchApplications}
                  />
                )}
              </>
            ) : (
              <div className="rounded-xl  bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No jobs or applications yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first job or import from a file to get started.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button onClick={() => setShowJobForm(true)} size="sm">
                      <FilePlus className="mr-2 h-4 w-4" /> Add Job
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowImportModal(true)}
                      variant="secondary"
                      size="sm"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Import Jobs
                    </Button>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Modals */}
        <Dialog
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
