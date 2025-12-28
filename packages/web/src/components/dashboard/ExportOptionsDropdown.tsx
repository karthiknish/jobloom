"use client";

import React, { useState } from "react";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileJson, FileText, ChevronDown, Check } from "lucide-react";
import { Application } from "@/types/dashboard";
import { exportToCsv } from "@/utils/exportToCsv";
import { exportToExcel } from "@/utils/exportToExcel";
import { exportToPdf } from "@/utils/exportToPdf";
import { showSuccess, showError } from "@/components/ui/Toast";

interface ExportOptionsDropdownProps {
  allApplications: Application[];
  filteredApplications: Application[];
  selectedIds?: string[];
  className?: string;
}

type ExportFormat = "csv" | "json" | "pdf" | "excel";

interface ExportOptions {
  format: ExportFormat;
  includeNotes: boolean;
  includeDescription: boolean;
  exportScope: "all" | "filtered" | "selected";
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: "csv",
  includeNotes: true,
  includeDescription: false,
  exportScope: "all",
};

export function ExportOptionsDropdown({
  allApplications,
  filteredApplications,
  selectedIds = [],
  className,
}: ExportOptionsDropdownProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  useRestoreFocus(showAdvanced);

  const getExportableApplications = (): Application[] => {
    switch (options.exportScope) {
      case "selected":
        return allApplications.filter((app) => selectedIds.includes(app._id));
      case "filtered":
        return filteredApplications;
      case "all":
      default:
        return allApplications;
    }
  };

  const exportAsCSV = (apps: Application[]) => {
    const data = apps.map((app) => ({
      title: app.job?.title || "",
      company: app.job?.company || "",
      location: app.job?.location || "",
      status: app.status || "",
      dateFound: app.job?.dateFound || "",
      appliedDate: app.appliedDate || "",
      salary: app.job?.salary || "",
      url: app.job?.url || "",
      ...(options.includeNotes && { notes: app.notes || "" }),
      ...(options.includeDescription && { description: app.job?.description || "" }),
    }));

    exportToCsv("job-applications.csv", data);
    showSuccess("Success", `Exported ${apps.length} records to CSV`);
  };

  const exportAsJSON = (apps: Application[]) => {
    const data = apps.map((app) => ({
      title: app.job?.title,
      company: app.job?.company,
      location: app.job?.location,
      status: app.status,
      dateFound: app.job?.dateFound,
      appliedDate: app.appliedDate,
      salary: app.job?.salary,
      url: app.job?.url,
      isSponsored: app.job?.isSponsored,
      ...(options.includeNotes && { notes: app.notes || "" }),
      ...(options.includeDescription && { description: app.job?.description || "" }),
    }));

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, "job-applications.json", "application/json");
  };

  const exportAsExcel = (apps: Application[]) => {
    const data = apps.map((app) => ({
      Title: app.job?.title || "",
      Company: app.job?.company || "",
      Location: app.job?.location || "",
      Status: app.status || "",
      "Date Found": app.job?.dateFound ? new Date(app.job.dateFound).toLocaleDateString() : "",
      "Applied Date": app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "",
      Salary: app.job?.salary || "",
      URL: app.job?.url || "",
      ...(options.includeNotes && { Notes: app.notes || "" }),
      ...(options.includeDescription && { Description: app.job?.description || "" }),
    }));

    exportToExcel(data, "job-applications.xlsx");
    showSuccess("Success", `Exported ${apps.length} records to Excel`);
  };

  const exportAsPdf = (apps: Application[]) => {
    const columns = [
      { key: "title", label: "Title", width: 45 },
      { key: "company", label: "Company", width: 40 },
      { key: "location", label: "Location", width: 35 },
      { key: "status", label: "Status", width: 25 },
      { key: "applied", label: "Applied", width: 25 },
      { key: "salary", label: "Salary", width: 30 },
    ];

    const data = apps.map((app) => ({
      title: app.job?.title || "",
      company: app.job?.company || "",
      location: app.job?.location || "",
      status: app.status || "",
      applied: app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "-",
      salary: app.job?.salary || "-",
    }));

    // Calculate stats for summary
    const statusCounts: Record<string, number> = {};
    apps.forEach((app) => {
      const status = app.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const summaryLines = [
      `Total Applications: ${apps.length}`,
      `By Status: ${Object.entries(statusCounts)
        .map(([status, count]) => `${status}: ${count}`)
        .join(", ")}`,
    ];

    exportToPdf(data, {
      fileName: "job-applications.pdf",
      title: "Job Applications Report",
      columns,
      summaryLines,
    });
    showSuccess("Success", `Exported ${apps.length} records to PDF`);
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const apps = getExportableApplications();
      if (apps.length === 0) {
        showError("No Data", "There are no applications matching your export scope.");
        return;
      }

      switch (options.format) {
        case "csv":
          exportAsCSV(apps);
          break;
        case "json":
          exportAsJSON(apps);
          break;
        case "excel":
          exportAsExcel(apps);
          break;
        case "pdf":
          exportAsPdf(apps);
          break;
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      showError("Export Failed", "Reason: " + error.message);
    } finally {
      setIsExporting(false);
      setShowAdvanced(false);
    }
  };

  const quickExport = (format: ExportFormat) => {
    // For quick export, we assume the user wants to export the currently filtered applications
    // unless explicitly selecting "all" or "selected" via advanced options.
    // So, we temporarily set the scope to "filtered" for quick exports.
    const currentOptions = { ...options, format, exportScope: "filtered" as const };
    setOptions(currentOptions); // Update state for consistency, though getExportableApplications will use the local currentOptions

    const apps = filteredApplications; // Quick export directly uses filtered applications

    if (apps.length === 0) {
      showError("No Data", "There are no applications to export in the current view.");
      return;
    }

    switch (format) {
      case "csv":
        exportAsCSV(apps);
        break;
      case "json":
        exportAsJSON(apps);
        break;
      case "excel":
        exportAsExcel(apps);
        break;
      case "pdf":
        exportAsPdf(apps);
        break;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Export (Current View)</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => quickExport("csv")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
            <span className="ml-auto text-xs text-muted-foreground">{filteredApplications.length}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => quickExport("json")} className="gap-2">
            <FileJson className="h-4 w-4" />
            Export as JSON
            <span className="ml-auto text-xs text-muted-foreground">{filteredApplications.length}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => quickExport("excel")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as Excel (.xlsx)
            <span className="ml-auto text-xs text-muted-foreground">{filteredApplications.length}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => quickExport("pdf")} className="gap-2">
            <FileText className="h-4 w-4" />
            Export as PDF
            <span className="ml-auto text-xs text-muted-foreground">{filteredApplications.length}</span>
          </DropdownMenuItem>

          {selectedIds.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Selected ({selectedIds.length})</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  const selectedApps = allApplications.filter((app: Application) => selectedIds.includes(app._id));
                  exportAsCSV(selectedApps);
                }} 
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Selected as CSV
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowAdvanced(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            Advanced Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Export Dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Export Options</DialogTitle>
            <DialogDescription>
              Customize what data to include in your export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Format</Label>
              <div className="flex gap-2">
                {(["csv", "json", "excel", "pdf"] as ExportFormat[]).map((format) => (
                  <Button
                    key={format}
                    variant={options.format === format ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOptions({ ...options, format })}
                    className="flex-1"
                  >
                    {format === "csv" && <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    {format === "json" && <FileJson className="h-4 w-4 mr-2" />}
                    {format === "excel" && <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    {format === "pdf" && <FileText className="h-4 w-4 mr-2" />}
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Scope</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    checked={options.exportScope === "all"}
                    onChange={() => setOptions({ ...options, exportScope: "all" })}
                    className="h-4 w-4"
                  />
                  All applications ({allApplications.length})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    checked={options.exportScope === "filtered"}
                    onChange={() => setOptions({ ...options, exportScope: "filtered" })}
                    className="h-4 w-4"
                  />
                  Filtered results ({filteredApplications.length})
                </label>
                {selectedIds.length > 0 && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="scope"
                      checked={options.exportScope === "selected"}
                      onChange={() => setOptions({ ...options, exportScope: "selected" })}
                      className="h-4 w-4"
                    />
                    Selected only ({selectedIds.length})
                  </label>
                )}
              </div>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={options.includeNotes}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeNotes: checked === true })
                    }
                  />
                  Notes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={options.includeDescription}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeDescription: checked === true })
                    }
                  />
                  Job Description (first 500 chars)
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvanced(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
