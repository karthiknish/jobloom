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
import jsPDF from "jspdf";

type Row = Record<string, unknown>;

/**
 * Format a value for display in PDF
 */
function formatValue(value: unknown): string {
  if (value == null) return "-";

  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Handle timestamps (numbers > year 2000 in milliseconds)
  if (typeof value === "number" && value > 946684800000) {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((v) => formatValue(v)).join(", ") : "-";
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + "..." : str;
}

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

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = margin;

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(title, margin, currentY);
      currentY += 8;

      // Subtitle with date and count
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const subtitle = `Generated on ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} • ${rows.length} application${rows.length !== 1 ? "s" : ""}`;
      pdf.text(subtitle, margin, currentY);
      pdf.setTextColor(0);
      currentY += 12;

      // Define columns to display
      const columns = [
        { key: "title", label: "Job Title", width: 50 },
        { key: "company", label: "Company", width: 40 },
        { key: "location", label: "Location", width: 35 },
        { key: "status", label: "Status", width: 25 },
        { key: "appliedDate", label: "Applied", width: 25 },
        { key: "salary", label: "Salary", width: 30 },
        { key: "sponsored", label: "Sponsored", width: 20 },
      ];

      // Calculate total width and scale if needed
      const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
      const availableWidth = pageWidth - margin * 2;
      const scale = totalWidth > availableWidth ? availableWidth / totalWidth : 1;

      // Table header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY - 4, availableWidth, 8, "F");

      let xPos = margin;
      columns.forEach((col) => {
        pdf.text(col.label, xPos + 2, currentY);
        xPos += col.width * scale;
      });
      currentY += 8;

      // Table rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      rows.forEach((row, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - margin - 10) {
          pdf.addPage();
          currentY = margin;

          // Repeat header on new page
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, currentY - 4, availableWidth, 8, "F");

          xPos = margin;
          columns.forEach((col) => {
            pdf.text(col.label, xPos + 2, currentY);
            xPos += col.width * scale;
          });
          currentY += 8;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
        }

        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY - 4, availableWidth, 7, "F");
        }

        xPos = margin;
        columns.forEach((col) => {
          const value = formatValue(row[col.key]);
          const truncated =
            value.length > Math.floor(col.width / 2)
              ? value.substring(0, Math.floor(col.width / 2) - 3) + "..."
              : value;
          pdf.text(truncated, xPos + 2, currentY);
          xPos += col.width * scale;
        });
        currentY += 7;
      });

      // Summary section
      currentY += 10;
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Summary", margin, currentY);
      currentY += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      // Calculate stats
      const statusCounts: Record<string, number> = {};
      let sponsoredCount = 0;

      rows.forEach((row) => {
        const status = String(row.status || "Unknown");
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        if (row.sponsored === true || row.sponsored === "Yes") {
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

      summaryLines.forEach((line) => {
        pdf.text(line, margin, currentY);
        currentY += 5;
      });

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - 8
        );
        pdf.text("HireAll Job Tracker", margin, pageHeight - 8);
        pdf.setTextColor(0);
      }

      // Download
      pdf.save(fileName);

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
