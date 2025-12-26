"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type OperationStatus = "idle" | "pending" | "progress" | "success" | "error";

interface OperationStep {
  label: string;
  description?: string;
}

interface OperationProgressProps {
  status: OperationStatus;
  /** Progress value 0-100 when status is "progress" */
  progress?: number;
  /** Steps for multi-step operations */
  steps?: OperationStep[];
  /** Current step index */
  currentStep?: number;
  /** Title for the operation */
  title?: string;
  /** Description/subtitle */
  description?: string;
  /** Estimated time remaining in seconds */
  estimatedTime?: number;
  /** Error message when status is "error" */
  errorMessage?: string;
  className?: string;
}

/**
 * OperationProgress - Progress indicator for long-running operations
 * 
 * Modes:
 * - Simple: Just shows spinner/progress bar
 * - Steps: Shows multi-step progress with labels
 * - Timed: Shows estimated time remaining
 * 
 * Usage:
 * <OperationProgress 
 *   status="progress"
 *   progress={45}
 *   title="Generating resume..."
 *   estimatedTime={30}
 * />
 */
export function OperationProgress({
  status,
  progress = 0,
  steps,
  currentStep = 0,
  title,
  description,
  estimatedTime,
  errorMessage,
  className,
}: OperationProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
      case "progress":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "rounded-lg border p-4",
          status === "error" 
            ? "border-destructive/50 bg-destructive/5" 
            : status === "success"
            ? "border-green-200 bg-green-50"
            : "border-border bg-muted/30",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={cn(
                "font-medium text-sm",
                status === "error" ? "text-destructive" : "text-foreground"
              )}>
                {title}
              </h4>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
            
            {status === "error" && errorMessage && (
              <p className="text-xs text-destructive mt-1">
                {errorMessage}
              </p>
            )}
            
            {/* Progress bar */}
            {status === "progress" && (
              <div className="mt-3 space-y-1.5">
                <Progress value={progress} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(progress)}%</span>
                  {estimatedTime && estimatedTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{formatTime(estimatedTime)} remaining
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Multi-step progress */}
            {steps && steps.length > 0 && (
              <div className="mt-3 space-y-2">
                {steps.map((step, index) => {
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isPending = index > currentStep;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        isComplete && "text-green-600",
                        isCurrent && "text-primary font-medium",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                        isComplete && "bg-green-100 text-green-600",
                        isCurrent && "bg-primary/10 text-primary",
                        isPending && "bg-muted text-muted-foreground"
                      )}>
                        {isComplete ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span>{step.label}</span>
                      {isCurrent && status === "progress" && (
                        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple inline loading indicator with optional message
 */
export function InlineProgress({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message && <span>{message}</span>}
    </div>
  );
}
