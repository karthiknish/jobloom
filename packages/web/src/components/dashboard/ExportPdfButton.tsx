"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showSuccess, showError } from "@/components/ui/Toast";
import { exportToPdf } from "@/utils/exportToPdf";

type Row = Record<string, unknown>;


export interface ExportPdfButtonProps {
  fileName?: string;
  rows: Row[];
  title?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function ExportPdfButton({
  fileName = "applications.pdf",
  rows,
  title = "Job Applications Report",
  disabled = false,
  variant = "outline",
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    // Validate data
    if (!rows || rows.length === 0) {
      showError("No data to export");
      return;
    }

    setIsExporting(true);

    try {
      // Small delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 100));

      const columns = [
        { key: "job.title", label: "Job Title", width: 50 },
        { key: "job.company", label: "Company", width: 40 },
        { key: "job.location", label: "Location", width: 35 },
        { key: "status", label: "Status", width: 25 },
        { key: "appliedDate", label: "Applied", width: 25 },
        { key: "job.salary", label: "Salary", width: 30 },
        { key: "job.isSponsored", label: "Sponsored", width: 20 },
      ];

      // Prepare flattened rows for the utility
      const flattenedRows = rows.map(row => ({
        ...row,
        "job.title": (row.job as any)?.title,
        "job.company": (row.job as any)?.company,
        "job.location": (row.job as any)?.location,
        "job.salary": (row.job as any)?.salary,
        "job.isSponsored": (row.job as any)?.isSponsored ? "Yes" : "No",
      }));

      // Calculate stats for summary
      const statusCounts: Record<string, number> = {};
      let sponsoredCount = 0;

      rows.forEach((row: any) => {
        const status = String(row.status || "Unknown");
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        if (row.job?.isSponsored === true) {
          sponsoredCount++;
        }
      });

      const summaryLines = [
        `Total Applications: ${rows.length}`,
        `Sponsored Jobs: ${sponsoredCount} (${Math.round((sponsoredCount / rows.length) * 100)}%)`,
        `By Status: ${Object.entries(statusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ")}`,
      ];

      await exportToPdf(flattenedRows, {
        fileName,
        title,
        columns,
        summaryLines,
      });

      showSuccess(
        `Exported ${rows.length} application${rows.length !== 1 ? "s" : ""} to PDF`
      );
    } catch (error) {
      console.error("PDF export failed:", error);
      showError("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || isExporting || rows.length === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={variant}
            onClick={handleExport}
            disabled={isDisabled}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : rows.length === 0 ? (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>Export PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {rows.length === 0 ? (
            <p>No data available to export</p>
          ) : (
            <p>
              Download {rows.length} application{rows.length !== 1 ? "s" : ""} as a
              PDF report
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
