"use client";

import * as React from "react";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineErrorProps {
  /** Error message to display */
  message?: string;
  /** Error ID for ARIA association */
  id?: string;
  /** Severity level */
  severity?: "error" | "warning" | "info";
  className?: string;
}

/**
 * InlineError - Consistent field-level error display
 * 
 * Usage:
 * <InlineError message={errors.email} id="email-error" />
 */
export function InlineError({
  message,
  id,
  severity = "error",
  className,
}: InlineErrorProps) {
  if (!message) return null;

  const Icon = severity === "error" 
    ? AlertCircle 
    : severity === "warning" 
    ? AlertTriangle 
    : Info;

  const colorClasses = {
    error: "text-destructive",
    warning: "text-warning",
    info: "text-info",
  };

  return (
    <p
      id={id}
      role={severity === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-1.5 text-sm mt-1.5",
        colorClasses[severity],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export default InlineError;
