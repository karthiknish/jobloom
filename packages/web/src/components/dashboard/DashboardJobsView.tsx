"use client";

import React from "react";
import { motion } from "framer-motion";
import { Application } from "@/types/dashboard";
import { JobList } from "@/components/dashboard/JobList";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/UpgradePrompt";
import { FileText } from "lucide-react";
import { filterApplications, getUniqueCompanies } from "@/utils/dashboard";
import { slideInUp } from "@/styles/animations";

interface DashboardJobsViewProps {
  applications: Application[];
  boardMode: "list" | "kanban";
  setBoardMode: (mode: "list" | "kanban") => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  companyFilter: string;
  setCompanyFilter: (filter: string) => void;
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (application: Application) => void;
  onViewApplication: (application: Application) => void;
  onChanged: () => void;
}

export function DashboardJobsView({
  applications,
  boardMode,
  setBoardMode,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  companyFilter,
  setCompanyFilter,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  onChanged,
}: DashboardJobsViewProps) {
  // Create wrapper function for JobList which expects applicationId
  const handleDeleteApplicationForJobList = (applicationId: string) => {
    // Find the application by ID and call the delete function
    const application = applications.find(app => app._id === applicationId);
    if (application) {
      onDeleteApplication(application);
    }
  };
  const filteredApplications = filterApplications(
    applications,
    statusFilter,
    searchTerm,
    companyFilter
  );
  const uniqueCompanies = getUniqueCompanies(applications);

  const hasApplications = Array.isArray(applications) && applications.length > 0;

  return (
    <motion.div
      variants={slideInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {hasApplications ? (
        <>
          {/* Advanced Filters */}
          <DashboardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            uniqueCompanies={uniqueCompanies}
            filteredApplicationsCount={filteredApplications.length}
            totalApplicationsCount={applications.length}
          />

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
            <div className="flex flex-wrap gap-2">
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
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  JSON <span className="ml-1 text-xs">Pro</span>
                </Button>

                {/* PDF Export - Premium Only */}
                <FeatureGate
                  feature="exportFormats"
                  requires="pdf"
                  fallback={
                    <Button size="sm" variant="outline" disabled>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF <span className="ml-1 text-xs">Pro</span>
                    </Button>
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Mock PDF export - would integrate with PDF library
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF <span className="ml-1 text-xs">Pro</span>
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
                  const { dashboardApi } = await import("@/utils/api/dashboard");
                  await dashboardApi.updateApplicationStatus(id, status);
                  onChanged();
                } catch (e: any) {
                  const { showError } = await import("@/components/ui/Toast");
                  showError(e?.message || "Update failed");
                }
              }}
              onReorder={async (draggedId, targetStatus, beforeId) => {
                try {
                  const { dashboardApi } = await import("@/utils/api/dashboard");
                  // Compute an order value
                  const col = applications.filter(
                    (a) => a.status === targetStatus
                  );
                  let newOrder: number;
                  if (beforeId) {
                    const before = col.find((a) => a._id === beforeId);
                    const beforeOrder =
                      typeof before?.order === "number" ? before!.order! : 0;
                    newOrder = beforeOrder - 0.001;
                  } else {
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
                  onChanged();
                } catch (e: any) {
                  const { showError } = await import("@/components/ui/Toast");
                  showError(e?.message || "Reorder failed");
                }
              }}
            />
          ) : (
            <JobList
              applications={filteredApplications}
              onEditApplication={onEditApplication}
              onDeleteApplication={handleDeleteApplicationForJobList}
              onViewApplication={(app) => onViewApplication(app)}
              onChanged={onChanged}
            />
          )}
        </>
      ) : (
        <div className="rounded-xl bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No jobs or applications yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first job or import from a file to get started.
          </p>
        </div>
      )}
    </motion.div>
  );
}