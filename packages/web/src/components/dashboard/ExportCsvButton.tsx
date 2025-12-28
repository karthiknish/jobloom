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
import { exportToCsv } from "@/utils/exportToCsv";

type Row = Record<string, unknown>;


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

      exportToCsv(fileName, rows as any);

      showSuccess(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV`);

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

