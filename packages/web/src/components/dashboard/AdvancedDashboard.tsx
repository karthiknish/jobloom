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
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [view, setView] = useState<"dashboard" | "jobs" | "applications">("dashboard");

  // Fetch user record
  const { data: userRecord } = useApiQuery(
    () => user ? dashboardApi.getUserByClerkId(user.id) : Promise.reject(new Error("No user")),
    [user?.id]
  );

  // Fetch applications
  const { data: applications, refetch: refetchApplications } = useApiQuery(
    () => userRecord ? dashboardApi.getApplicationsByUser(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Fetch job stats
  const { data: jobStats, refetch: refetchJobStats } = useApiQuery(
    () => userRecord ? dashboardApi.getJobStats(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Job Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user.firstName}!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowJobForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Job
              </button>
              <button
                onClick={() => setShowApplicationForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Application
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setView("dashboard")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                view === "dashboard"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView("jobs")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                view === "jobs"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Jobs ({applications?.length || 0})
            </button>
          </nav>
        </div>

        {/* Main Content */}
        {view === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Dashboard */}
            {jobStats && <JobStatsDashboard stats={jobStats} />}
            
            {/* Extension Integration */}
            {userRecord && <ExtensionIntegration userId={userRecord._id} />}
            
            {/* Recent Applications */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
              </div>
              <div className="p-6">
                {applications && applications.length > 0 ? (
                  <JobList
                    applications={applications.slice(0, 5)}
                    onEditApplication={handleEditApplication}
                    onDeleteApplication={handleDeleteApplication}
                    onViewApplication={handleViewApplication}
                  />
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">📋</span>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a job or application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {view === "jobs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {applications && (
              <JobList
                applications={applications}
                onEditApplication={handleEditApplication}
                onDeleteApplication={handleDeleteApplication}
                onViewApplication={handleViewApplication}
              />
            )}
          </motion.div>
        )}

        {/* Modals */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <ApplicationForm
                application={editingApplication || undefined}
                onSubmit={handleApplicationSubmit}
                onCancel={() => {
                  setShowApplicationForm(false);
                  setEditingApplication(null);
                }}
              />
            </div>
          </div>
        )}

        {showJobForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <JobForm
                onSubmit={handleJobSubmit}
                onCancel={() => setShowJobForm(false)}
              />
            </div>
          </div>
        )}

        {selectedApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedApplication.job?.title}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{selectedApplication.job?.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{selectedApplication.job?.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedApplication.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Found</p>
                    <p className="font-medium">
                      {new Date(selectedApplication.job?.dateFound || 0).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {selectedApplication.appliedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Applied Date</p>
                    <p className="font-medium">
                      {new Date(selectedApplication.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedApplication.interviewDates && selectedApplication.interviewDates.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Interview Dates</p>
                    <ul className="list-disc list-inside">
                      {selectedApplication.interviewDates.map((date, index) => (
                        <li key={index} className="font-medium">
                          {new Date(date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedApplication.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{selectedApplication.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    handleEditApplication(selectedApplication);
                  }}
                  className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}