"use client";

import React from "react";
import { UpcomingFollowUps } from "@/components/dashboard/UpcomingFollowUps";
import { SponsorshipQuickCheck } from "@/components/dashboard/SponsorshipQuickCheck";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { JobStatsDashboard } from "@/components/dashboard/JobStatsDashboard";
import { JobList } from "@/components/dashboard/JobList";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import { ExportPdfButton } from "@/components/dashboard/ExportPdfButton";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { showSuccess, showError } from "@/components/ui/Toast";

interface DashboardWidgetsProps {
  jobStats: any;
  applications: any[];
  hasApplications: boolean;
  userRecord: any;
  onEditApplication: (application: any) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: any) => void;
  onRefetchApplications: () => void;
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
          ) : null,
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
          ) : null,
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
      {
        id: "recent-applications",
        title: "Recent Applications",
        component: safeApplications.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <ExportCsvButton
                  fileName="applications.csv"
                  rows={safeApplications.map((a) => ({
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
                  }))}
                />
                <ExportPdfButton
                  fileName="applications.pdf"
                  title="My Job Applications"
                  rows={safeApplications.map((a) => ({
                    title: a.job?.title,
                    company: a.job?.company,
                    location: a.job?.location,
                    status: a.status,
                    appliedDate: a.appliedDate,
                    salary: a.job?.salary,
                    sponsored: a.job?.isSponsored,
                  }))}
                />
                <FeatureGate
                  feature="exportFormats"
                  requires="json"
                  fallback={
                    <Button size="sm" variant="outline" disabled>
                      <FileText className="h-4 w-4 mr-2" />
                      JSON <span className="ml-1 text-xs">Pro</span>
                    </Button>
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const data = safeApplications.map((a) => ({
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
                      const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      });
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
                    JSON <span className="text-xs text-primary">Pro</span>
                  </Button>
                </FeatureGate>
              </div>
            </div>
            <JobList
              applications={safeApplications.slice(0, 5)}
              onEditApplication={onEditApplication}
              onDeleteApplication={onDeleteApplication}
              onViewApplication={onViewApplication}
              onChanged={onRefetchApplications}
            />
          </div>
        ) : null,
        visible: hasApplications,
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
