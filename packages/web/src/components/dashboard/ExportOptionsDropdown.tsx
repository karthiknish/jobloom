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
  DropdownMenuCheckboxItem,
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

interface ExportOptionsDropdownProps {
  applications: Application[];
  selectedIds?: string[];
  filteredCount?: number;
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
  applications,
  selectedIds = [],
  filteredCount,
  className,
}: ExportOptionsDropdownProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  useRestoreFocus(showAdvanced);

  const getExportableApplications = (): Application[] => {
    switch (options.exportScope) {
      case "selected":
        return applications.filter((app) => selectedIds.includes(app._id));
      case "filtered":
        // For now, return all - in actual use, this would be the filtered list
        return applications;
      case "all":
      default:
        return applications;
    }
  };

  const exportAsCSV = (apps: Application[]) => {
    const headers = [
      "Title",
      "Company",
      "Location",
      "Status",
      "Date Found",
      "Applied Date",
      "Salary",
      "URL",
      ...(options.includeNotes ? ["Notes"] : []),
      ...(options.includeDescription ? ["Description"] : []),
    ];

    const rows = apps.map((app) => [
      app.job?.title || "",
      app.job?.company || "",
      app.job?.location || "",
      app.status || "",
      app.job?.dateFound ? new Date(app.job.dateFound).toLocaleDateString() : "",
      app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "",
      app.job?.salary || "",
      app.job?.url || "",
      ...(options.includeNotes ? [app.notes?.replace(/,/g, ";") || ""] : []),
      ...(options.includeDescription ? [app.job?.description?.substring(0, 500)?.replace(/,/g, ";") || ""] : []),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    downloadFile(csvContent, "job-applications.csv", "text/csv");
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
      ...(options.includeNotes && { notes: app.notes }),
      ...(options.includeDescription && { description: app.job?.description }),
    }));

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, "job-applications.json", "application/json");
  };

  const exportAsExcel = (apps: Application[]) => {
    const headers = [
      "Title",
      "Company",
      "Location",
      "Status",
      "Date Found",
      "Applied Date",
      "Salary",
      "URL",
      ...(options.includeNotes ? ["Notes"] : []),
      ...(options.includeDescription ? ["Description"] : []),
    ];

    const rows = apps.map((app) => [
      app.job?.title || "",
      app.job?.company || "",
      app.job?.location || "",
      app.status || "",
      app.job?.dateFound ? new Date(app.job.dateFound).toLocaleDateString() : "",
      app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "",
      app.job?.salary || "",
      app.job?.url || "",
      ...(options.includeNotes ? [app.notes || ""] : []),
      ...(options.includeDescription ? [app.job?.description?.substring(0, 500) || ""] : []),
    ]);

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Job Applications</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc; }
          td { border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    downloadFile(html, "job-applications.xls", "application/vnd.ms-excel");
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
        alert("No applications to export");
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
          // PDF export would require additional library
          alert("PDF export coming soon!");
          break;
      }
    } finally {
      setIsExporting(false);
      setShowAdvanced(false);
    }
  };

  const quickExport = (format: ExportFormat) => {
    setOptions({ ...options, format });
    const apps = getExportableApplications();
    if (format === "csv") {
      exportAsCSV(apps);
    } else if (format === "json") {
      exportAsJSON(apps);
    } else if (format === "excel") {
      exportAsExcel(apps);
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
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => quickExport("csv")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
            <span className="ml-auto text-xs text-muted-foreground">{applications.length}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => quickExport("json")} className="gap-2">
            <FileJson className="h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => quickExport("excel")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as Excel (.xls)
          </DropdownMenuItem>

          {selectedIds.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export Selected ({selectedIds.length})</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setOptions({ ...options, exportScope: "selected" });
                  const apps = applications.filter((app) => selectedIds.includes(app._id));
                  exportAsCSV(apps);
                }}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Selected as CSV
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
                {(["csv", "json", "excel"] as ExportFormat[]).map((format) => (
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
                  All applications ({applications.length})
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
