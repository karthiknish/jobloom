"use client";

import { motion } from "framer-motion";

interface JobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
  byStatus: Record<string, number>;
}

interface JobStatsDashboardProps {
  stats: JobStats;
}

export function JobStatsDashboard({ stats }: JobStatsDashboardProps) {
  const statusColors = {
    interested: "bg-blue-500",
    applied: "bg-yellow-500",
    interviewing: "bg-purple-500",
    offered: "bg-green-500",
    rejected: "bg-red-500",
    withdrawn: "bg-gray-500",
  };

  const statusLabels = {
    interested: "Interested",
    applied: "Applied",
    interviewing: "Interviewing",
    offered: "Offered",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-blue-600 text-xl">💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="text-orange-600 text-xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sponsored Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sponsoredJobs}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-green-600 text-xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-purple-600 text-xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jobs Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.jobsToday}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Applications by Status</h3>
          <div className="space-y-4">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {statusLabels[status as keyof typeof statusLabels] || status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || "bg-gray-500"}`}
                    style={{ 
                      width: `${stats.totalApplications > 0 ? (count / stats.totalApplications) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recruitment Agency Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recruitment Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100">
                  <span className="text-purple-600">🏢</span>
                </div>
                <span className="ml-3 font-medium text-gray-900">Agency Jobs</span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {stats.recruitmentAgencyJobs || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-orange-100">
                  <span className="text-orange-600">🎯</span>
                </div>
                <span className="ml-3 font-medium text-gray-900">Sponsored %</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {stats.totalJobs > 0 
                  ? Math.round((stats.sponsoredJobs / stats.totalJobs) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}