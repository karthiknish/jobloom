"use client";

import React from "react";
import { UpcomingFollowUps } from "@/components/dashboard/UpcomingFollowUps";
import { SponsorshipQuickCheck } from "@/components/dashboard/SponsorshipQuickCheck";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { JobStatsDashboard } from "@/components/dashboard/JobStatsDashboard";
import { JobList } from "@/components/dashboard/JobList";
import { motion } from "framer-motion";
import { Application, JobStats } from "@/types/dashboard";
import { EmptyStateInline } from "@/components/ui/EmptyState";
import { Calendar, Shield } from "lucide-react";

interface DashboardWidgetsProps {
  jobStats: JobStats | null;
  applications: Application[];
  hasApplications: boolean;
  userRecord: any;
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
  onRefetchApplications: () => void;
  onAddJob?: () => void;
}

export function useDashboardWidgets({
  jobStats,
  applications,
  hasApplications,
  userRecord,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  onRefetchApplications,
  onAddJob,
}: DashboardWidgetsProps) {
  // Ensure applications is always an array
  const safeApplications = Array.isArray(applications) ? applications : [];
  
  return React.useMemo(
    () => [
      {
        id: "job-stats",
        title: "Job Statistics",
        component: jobStats ? <JobStatsDashboard stats={jobStats} /> : null,
        visible: true,
        required: false,
      },
      {
        id: "upcoming-followups",
        title: "Upcoming Follow-ups",
        component:
          safeApplications.length > 0 ? (
            <UpcomingFollowUps
              applications={safeApplications}
              onChanged={onRefetchApplications}
            />
          ) : (
            <EmptyStateInline 
              icon={Calendar} 
              message="No upcoming follow-ups scheduled." 
              action={{
                label: "Add Job",
                onClick: () => onAddJob?.()
              }}
            />
          ),
        visible: hasApplications,
        required: false,
      },
      {
        id: "notification-center",
        title: "Notification Center",
        component: (
          <div className="space-y-4">
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 180,
                  damping: 12,
                }}
                className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center shadow-lg"
              >
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="text-lg font-semibold text-foreground mb-2"
              >
                All caught up!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-muted-foreground"
              >
                No pending notifications or follow-ups at this time.
              </motion.p>
            </div>
          </div>
        ),
        visible: true,
        required: false,
      },
      {
        id: "sponsorship-check",
        title: "Sponsorship Quick Check",
        component:
          safeApplications.length > 0 ? (
            <SponsorshipQuickCheck applications={safeApplications} />
          ) : (
            <EmptyStateInline 
              icon={Shield} 
              message="Add jobs to see sponsorship eligibility insights." 
            />
          ),
        visible: hasApplications,
        required: false,
      },
      {
        id: "extension-integration",
        title: "Extension Integration",
        component: userRecord ? (
          <ExtensionIntegration userId={userRecord._id} />
        ) : null,
        visible: true,
        required: false,
      },
    ],
    [
      jobStats,
      safeApplications,
      hasApplications,
      userRecord,
      onEditApplication,
      onDeleteApplication,
      onViewApplication,
      onRefetchApplications,
    ]
  );
}
