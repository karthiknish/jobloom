"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

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

interface JobListProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
}

export function JobList({ 
  applications, 
  onEditApplication, 
  onDeleteApplication,
  onViewApplication
}: JobListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("dateFound");

  const statusColors = {
    interested: "bg-blue-100 text-blue-800",
    applied: "bg-yellow-100 text-yellow-800",
    interviewing: "bg-purple-100 text-purple-800",
    offered: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      const matchesStatus = selectedStatus === "all" || app.status === selectedStatus;
      const matchesAgency = showRecruitmentAgency || !app.job?.isRecruitmentAgency;
      const matchesSearch = searchQuery === "" || 
        (app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.job?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.job?.location?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesAgency && matchesSearch;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.job?.title || "").localeCompare(b.job?.title || "");
        case "company":
          return (a.job?.company || "").localeCompare(b.job?.company || "");
        case "dateFound":
        default:
          return (b.job?.dateFound || 0) - (a.job?.dateFound || 0);
      }
    });

    return filtered;
  }, [applications, selectedStatus, showRecruitmentAgency, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="interested">Interested</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dateFound">Date Found</option>
              <option value="title">Title</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={showRecruitmentAgency}
              onChange={(e) => setShowRecruitmentAgency(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-600">Show Recruitment Agency Jobs</span>
          </label>
        </div>
      </div>

      {/* Job List */}
      {filteredAndSortedApplications.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedApplications.map((application) => (
              <motion.li
                key={application._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {application.job?.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.job?.company} • {application.job?.location}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {application.job?.isSponsored && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Sponsored
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[application.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 gap-4">
                      <span>
                        Found: {format(new Date(application.job?.dateFound || 0), "MMM d, yyyy")}
                      </span>
                      {application.appliedDate && (
                        <span>
                          Applied: {format(new Date(application.appliedDate), "MMM d, yyyy")}
                        </span>
                      )}
                      {application.job?.salary && (
                        <span>
                          Salary: {application.job.salary}
                        </span>
                      )}
                      <span className="capitalize">
                        Source: {application.job?.source}
                      </span>
                    </div>
                    
                    {application.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {application.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => onViewApplication(application)}
                      className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEditApplication(application)}
                      className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDeleteApplication(application._id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedStatus !== "all" 
              ? "Try adjusting your filters or search terms" 
              : "Start by installing the Chrome extension to track jobs automatically"}
          </p>
        </div>
      )}
    </div>
  );
}