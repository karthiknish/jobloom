"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Application } from "@/types/dashboard";
import { JobList } from "@/components/dashboard/JobList";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { BulkActionsBar, ApplicationStatus } from "@/components/dashboard/BulkActionsBar";
import { ExportOptionsDropdown } from "@/components/dashboard/ExportOptionsDropdown";
import { KeyboardShortcutsDialog } from "@/components/dashboard/KeyboardShortcutsDialog";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useKeyboardShortcuts, createDashboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutList, LayoutGrid, Briefcase, Keyboard } from "lucide-react";
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
  onAddJob?: () => void;
  onImport?: () => void;
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
  onAddJob,
  onImport,
}: DashboardJobsViewProps) {
  // Ensure applications is always an array
  const safeApplications = Array.isArray(applications) ? applications : [];
  
  // Filtered applications
  const filteredApplications = useMemo(() => 
    filterApplications(safeApplications, searchTerm, statusFilter, companyFilter),
    [safeApplications, searchTerm, statusFilter, companyFilter]
  );
  
  // Unique companies for filter
  const uniqueCompanies = useMemo(() => 
    getUniqueCompanies(safeApplications),
    [safeApplications]
  );
  
  // Get all application IDs for bulk selection
  const allIds = useMemo(() => 
    filteredApplications.map((app: Application) => app._id),
    [filteredApplications]
  );
  
  // Bulk selection hook
  const bulkSelection = useBulkSelection(allIds);
  
  // Keyboard shortcuts dialog
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Search input ref for focus
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Bulk delete handler (defined before use in keyboard shortcuts)
  const handleBulkDelete = useCallback(async () => {
    try {
      const { dashboardApi } = await import("@/utils/api/dashboard");
      await Promise.all(
        bulkSelection.selectedArray.map((id) => dashboardApi.deleteApplication(id))
      );
      bulkSelection.clearSelection();
      onChanged();
    } catch (e: any) {
      const { showError } = await import("@/components/ui/Toast");
      showError(e?.message || "Bulk delete failed");
    }
  }, [bulkSelection, onChanged]);
  
  // Keyboard shortcuts
  const shortcuts = useMemo(() => createDashboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onNewJob: onAddJob,
    onImport: onImport,
    onEscape: () => bulkSelection.clearSelection(),
    onHelp: () => setShowShortcuts(true),
    onSelectAll: () => bulkSelection.toggleSelectAll(),
    onDelete: bulkSelection.hasSelection 
      ? () => void handleBulkDelete()
      : undefined,
  }), [onAddJob, onImport, bulkSelection, handleBulkDelete]);
  
  useKeyboardShortcuts(shortcuts);

  const hasApplications = safeApplications.length > 0;

  // Wrapper for delete that takes applicationId
  const handleDeleteApplicationForJobList = useCallback((applicationId: string) => {
    const application = safeApplications.find(app => app._id === applicationId);
    if (application) {
      onDeleteApplication(application);
    }
  }, [safeApplications, onDeleteApplication]);

  // Bulk status change handler
  const handleBulkStatusChange = async (status: ApplicationStatus) => {
    try {
      const { dashboardApi } = await import("@/utils/api/dashboard");
      await Promise.all(
        bulkSelection.selectedArray.map(id => 
          dashboardApi.updateApplicationStatus(id, status)
        )
      );
      bulkSelection.clearSelection();
      onChanged();
    } catch (e: any) {
      const { showError } = await import("@/components/ui/Toast");
      showError(e?.message || "Bulk update failed");
    }
  };

  // Bulk export handler
  const handleBulkExport = (format: "csv" | "json") => {
    const selectedApps = filteredApplications.filter((app: Application) => 
      bulkSelection.selectedIds.has(app._id)
    );
    
    if (format === "csv") {
      const headers = ["Title", "Company", "Location", "Status", "Date Found", "Salary"];
      const rows = selectedApps.map((app: Application) => [
        app.job?.title || "",
        app.job?.company || "",
        app.job?.location || "",
        app.status || "",
        app.job?.dateFound || "",
        app.job?.salary || "",
      ]);
      const csv = [headers.join(","), ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))].join("\n");
      downloadFile(csv, "selected-jobs.csv", "text/csv");
    } else {
      const json = JSON.stringify(selectedApps.map((app: Application) => ({
        title: app.job?.title,
        company: app.job?.company,
        location: app.job?.location,
        status: app.status,
        dateFound: app.job?.dateFound,
        salary: app.job?.salary,
      })), null, 2);
      downloadFile(json, "selected-jobs.json", "application/json");
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={slideInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {hasApplications ? (
        <>
          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={bulkSelection.selectedCount}
            totalCount={filteredApplications.length}
            isAllSelected={bulkSelection.isAllSelected}
            isPartiallySelected={bulkSelection.isPartiallySelected}
            onToggleSelectAll={bulkSelection.toggleSelectAll}
            onClearSelection={bulkSelection.clearSelection}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
          />

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-muted/50 rounded-xl border border-border/50">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border/50 shadow-sm">
              <button
                onClick={() => setBoardMode("list")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md motion-control ${
                  boardMode === "list"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setBoardMode("kanban")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md motion-control ${
                  boardMode === "kanban"
                    ? "bg-primary text-primary-foreground shadow-md"
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
            
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Enhanced Export */}
              <ExportOptionsDropdown
                applications={filteredApplications}
                selectedIds={bulkSelection.selectedArray}
              />
              
              {/* Keyboard Shortcuts Button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setShowShortcuts(true)}
              >
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </Button>
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
              selectedIds={bulkSelection.selectedIds}
              onToggleSelection={bulkSelection.toggleSelection}
            />
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-card p-12 text-center border border-border/50 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-foreground">
            No jobs yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Start tracking your job search by importing jobs from the extension or adding them manually.
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        shortcuts={shortcuts}
      />
    </motion.div>
  );
}