"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showSuccess, showError } from "@/components/ui/Toast";

type Row = Record<string, unknown>;

/**
 * Format a value for CSV export
 */
function formatValue(value: unknown): string {
  if (value == null) return "";
  
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
    return value.map(v => formatValue(v)).join("; ");
  }
  
  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Convert rows to CSV with proper escaping and formatting
 */
function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  
  // Collect all unique columns
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  
  // Create human-readable headers
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .trim();
  };
  
  const header = cols.map(formatHeader).join(",");
  
  const lines = rows.map((r) =>
    cols
      .map((k) => {
        const formatted = formatValue(r[k]);
        // Escape quotes and wrap in quotes if needed
        const escaped = formatted.replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or quotes
        if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped || '""';
      })
      .join(",")
  );
  
  return [header, ...lines].join("\n");
}

export interface ExportCsvButtonProps {
  fileName?: string;
  rows: Row[];
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function ExportCsvButton({
  fileName = "applications.csv",
  rows,
  disabled = false,
  variant = "outline",
}: ExportCsvButtonProps) {
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

      const csv = toCsv(rows);
      
      if (!csv) {
        throw new Error("Failed to generate CSV");
      }

      // Add BOM for Excel compatibility with UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV`);
    } catch (error) {
      console.error("CSV export failed:", error);
      showError("Failed to export CSV. Please try again.");
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
              <Download className="h-4 w-4" />
            )}
            <span>Export CSV</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {rows.length === 0 ? (
            <p>No data available to export</p>
          ) : (
            <p>Download {rows.length} record{rows.length !== 1 ? "s" : ""} as a spreadsheet</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

