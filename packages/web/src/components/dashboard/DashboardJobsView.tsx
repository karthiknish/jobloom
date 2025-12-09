"use client";

import React from "react";
import { motion } from "framer-motion";
import { Application } from "@/types/dashboard";
import { JobList } from "@/components/dashboard/JobList";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureGate } from "@/components/UpgradePrompt";
import { FileText, LayoutList, LayoutGrid, Download, Briefcase } from "lucide-react";
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
  // Ensure applications is always an array
  const safeApplications = Array.isArray(applications) ? applications : [];
  
  // Create wrapper function for JobList which expects applicationId
  const handleDeleteApplicationForJobList = (applicationId: string) => {
    // Find the application by ID and call the delete function
    const application = safeApplications.find(app => app._id === applicationId);
    if (application) {
      onDeleteApplication(application);
    }
  };
  const filteredApplications = filterApplications(
    safeApplications,
    statusFilter,
    searchTerm,
    companyFilter
  );
  const uniqueCompanies = getUniqueCompanies(safeApplications);

  const hasApplications = safeApplications.length > 0;

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
            totalApplicationsCount={safeApplications.length}
          />

          {/* View Toggle & Export Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded-xl border border-border/50">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border/50 shadow-sm">
              <button
                onClick={() => setBoardMode("list")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  boardMode === "list"
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setBoardMode("kanban")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  boardMode === "kanban"
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
            </div>

            {/* Results Count */}
            <Badge variant="secondary" className="text-sm font-medium px-3 py-1.5">
              {filteredApplications.length} of {safeApplications.length} jobs
            </Badge>
            
            {/* Export Actions */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                  <Button size="sm" variant="outline" disabled className="h-9 gap-2">
                    <Download className="h-4 w-4" />
                    JSON <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">Pro</Badge>
                  </Button>
                }
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-2"
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
                  <Download className="h-4 w-4" />
                  JSON
                </Button>

                {/* PDF Export - Premium Only */}
                <FeatureGate
                  feature="exportFormats"
                  requires="pdf"
                  fallback={
                    <Button size="sm" variant="outline" disabled className="h-9 gap-2">
                      <FileText className="h-4 w-4" />
                      PDF <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">Pro</Badge>
                    </Button>
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-2"
                    onClick={() => {
                      // Mock PDF export - would integrate with PDF library
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </FeatureGate>
              </FeatureGate>
            </div>
          </div>

          {/* Content Area */}
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
                  const col = safeApplications.filter(
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
        <div className="rounded-2xl bg-gradient-to-br from-background via-muted/30 to-background p-12 text-center border border-border/50 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50">
            <Briefcase className="h-8 w-8 text-primary dark:text-emerald-400" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-foreground">
            No jobs yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Start tracking your job search by importing jobs from the extension or adding them manually.
          </p>
        </div>
      )}
    </motion.div>
  );
}