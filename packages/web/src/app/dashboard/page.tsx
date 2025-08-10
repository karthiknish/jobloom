"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useApiQuery, useApiMutation } from "../../hooks/useApi";
import { dashboardApi } from "../../utils/api/dashboard";

export default function Dashboard() {
  const { user } = useUser();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] =
    useState<boolean>(true);

  // Expose user ID to extension for authentication
  useEffect(() => {
    if (user) {
      // Set user ID in window object for extension access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__clerk_user = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      };

      // Also set in localStorage for extension access
      localStorage.setItem(
        "__clerk_user",
        JSON.stringify({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
        })
      );
    }
  }, [user]);

  // Fetch user record
  const { data: userRecord } = useApiQuery(
    () => user ? dashboardApi.getUserByClerkId(user.id) : Promise.reject(new Error("No user")),
    [user?.id]
  );

  // Application & status types inferred from local statusColors keys
  const statusColors = {
    interested: "bg-blue-100 text-blue-800",
    applied: "bg-yellow-100 text-yellow-800",
    interviewing: "bg-purple-100 text-purple-800",
    offered: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  } as const;
  type ApplicationStatus = keyof typeof statusColors;
  
  // Fetch applications
  const { data: applications } = useApiQuery(
    () => userRecord ? dashboardApi.getApplicationsByUser(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Fetch job stats
  const { data: jobStats } = useApiQuery(
    () => userRecord ? dashboardApi.getJobStats(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  // Update application status mutation
  const { mutate: updateApplicationStatus } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { applicationId, status } = variables;
      return dashboardApi.updateApplicationStatus(
        applicationId as string,
        status as string
      );
    }
  );

  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    try {
      await updateApplicationStatus({ applicationId, status: newStatus });
      toast.success("Application status updated!");
    } catch {
      // We intentionally ignore the specific error details here in the UI.
      toast.error("Failed to update status");
    }
  };

  const filteredApplications = applications?.filter((app) => {
    const statusMatch =
      selectedStatus === "all" || app.status === selectedStatus;
    const agencyMatch = showRecruitmentAgency || !app.job?.isRecruitmentAgency;
    return statusMatch && agencyMatch;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="mt-2 text-indigo-100">
            Track your job applications and discover new opportunities
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {jobStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Total Jobs
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {jobStats.totalJobs}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Sponsored Jobs
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {jobStats.sponsoredJobs}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Applications
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {jobStats.totalApplications}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        Jobs Today
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {jobStats.jobsToday}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {jobStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-700 truncate">
                        Recruitment Agency Jobs
                      </dt>
                      <dd className="text-2xl font-bold text-purple-900">
                        {jobStats.recruitmentAgencyJobs || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white shadow-lg rounded-xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-bold text-gray-900">
                Job Applications
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showRecruitmentAgency}
                    onChange={(e) => setShowRecruitmentAgency(e.target.checked)}
                    className="mr-2 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Show Agency Jobs
                  </span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
                >
                  <option value="all">All Applications</option>
                  <option value="interested">Interested</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </div>

          {filteredApplications && filteredApplications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application, index: number) => (
                <motion.li
                  key={application._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                          {application.job?.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[
                                application.status as keyof typeof statusColors
                              ]
                            }`}
                          >
                            {application.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="truncate">
                            <span className="font-medium">
                              {application.job?.company}
                            </span>{" "}
                            • {application.job?.location}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>
                          Applied:{" "}
                          {application.appliedDate
                            ? format(
                                new Date(application.appliedDate),
                                "MMM d, yyyy"
                              )
                            : "Not yet"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <select
                        value={application.status}
                        onChange={(e) =>
                          handleStatusChange(
                            application._id,
                            e.target.value as ApplicationStatus
                          )
                        }
                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
                      >
                        <option value="interested">Interested</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                  {application.notes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 bg-gray-50 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-600">
                        {application.notes}
                      </p>
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </ul>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-16 text-center"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-6xl block mb-4"
              >
                📋
              </motion.span>
              <h3 className="text-lg font-medium text-gray-900">
                No applications yet
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Start by installing the Chrome extension to track jobs
                automatically.
              </p>
              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Get Chrome Extension
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
