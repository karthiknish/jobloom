"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useApiQuery } from "@/hooks/useApi";
import { dashboardApi } from "@/utils/api/dashboard";
import { JobList } from "@/components/dashboard/JobList";
import { JobStatsDashboard } from "@/components/dashboard/JobStatsDashboard";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";
import { JobForm } from "@/components/dashboard/JobForm";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { JobImportModal } from "@/components/dashboard/JobImportModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { user } = useUser();
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
  const [view, setView] = useState<"dashboard" | "jobs" | "applications">(
    "dashboard"
  );

  // Fetch user record
  const { data: userRecord } = useApiQuery(
    () =>
      user
        ? dashboardApi.getUserByClerkId(user.id)
        : Promise.reject(new Error("No user")),
    [user?.id]
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

  const hasApplications =
    Array.isArray(applications) && applications.length > 0;

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
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  const handleApplicationSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingApplication) {
        await dashboardApi.updateApplication(editingApplication._id, data);
        toast.success("Application updated successfully");
      } else {
        await dashboardApi.createApplication(data);
        toast.success("Application created successfully");
      }
      await refetchApplications();
      setShowApplicationForm(false);
      setEditingApplication(null);
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application");
    }
  };

  const handleJobSubmit = async (data: Record<string, unknown>) => {
    try {
      await dashboardApi.createJob(data);
      await refetchJobStats();
      toast.success("Job added successfully");
      setShowJobForm(false);
    } catch (error) {
      console.error("Error adding job:", error);
      toast.error("Failed to add job");
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
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4"
          >
            <div className="flex items-start md:items-center gap-3">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.05 }}
                className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="text-2xl font-bold text-gray-900"
                >
                  Job Dashboard
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  className="mt-1 text-sm text-gray-600"
                >
                  {greeting}, {user.firstName}!
                </motion.p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="default"
                  size="sm"
                >
                  Import Jobs
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowJobForm(true)}
                  variant="default"
                  size="sm"
                >
                  Add Job
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  variant="outline"
                  size="sm"
                >
                  Add Application
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <Tabs
          value={view}
          onValueChange={(value) =>
            setView(
              value === "dashboard" ||
                value === "jobs" ||
                value === "applications"
                ? value
                : "dashboard"
            )
          }
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="jobs">
              Jobs ({applications?.length || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content */}
        {view === "dashboard" &&
          (hasApplications ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {jobStats && <JobStatsDashboard stats={jobStats} />}
              {userRecord && <ExtensionIntegration userId={userRecord._id} />}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobList
                    applications={applications!.slice(0, 5)}
                    onEditApplication={handleEditApplication}
                    onDeleteApplication={handleDeleteApplication}
                    onViewApplication={handleViewApplication}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="rounded-xl  bg-white p-10 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                >
                  <Inbox className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="mt-4 text-lg font-semibold text-foreground"
                >
                  No applications yet
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="mt-1 text-sm text-muted-foreground"
                >
                  Get started by importing your jobs or adding a new one.
                </motion.p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button onClick={() => setShowImportModal(true)} size="sm">
                      <UploadCloud className="mr-2 h-4 w-4" /> Import Jobs
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowJobForm(true)}
                      variant="secondary"
                      size="sm"
                    >
                      <FilePlus className="mr-2 h-4 w-4" /> Add Job
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowApplicationForm(true)}
                      variant="ghost"
                      size="sm"
                    >
                      Add Application <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {userRecord && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                >
                  <ExtensionIntegration userId={userRecord._id} />
                </motion.div>
              )}
            </motion.div>
          ))}

        {view === "jobs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {hasApplications ? (
              <JobList
                applications={applications!}
                onEditApplication={handleEditApplication}
                onDeleteApplication={handleDeleteApplication}
                onViewApplication={handleViewApplication}
              />
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
