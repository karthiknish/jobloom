"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FileUploadStatus = "idle" | "uploading" | "success" | "error";

interface FileUploadProgressProps {
  /** File name being uploaded */
  fileName: string;
  /** File size in bytes */
  fileSize?: number;
  /** Upload progress 0-100 */
  progress: number;
  /** Current status */
  status: FileUploadStatus;
  /** Error message if status is error */
  errorMessage?: string;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Callback to retry on error */
  onRetry?: () => void;
  className?: string;
}

/**
 * FileUploadProgress - Shows upload progress with cancel/retry options
 * 
 * Usage:
 * <FileUploadProgress
 *   fileName="resume.pdf"
 *   fileSize={1024000}
 *   progress={45}
 *   status="uploading"
 *   onCancel={() => cancelUpload()}
 * />
 */
export function FileUploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  errorMessage,
  onCancel,
  onRetry,
  className,
}: FileUploadProgressProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        status === "error" ? "border-destructive/50 bg-destructive/5" : "border-border",
        status === "success" ? "border-green-200 bg-green-50" : "",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* File Icon */}
        <div className={cn(
          "flex-shrink-0 p-2 rounded-lg",
          status === "success" ? "bg-green-100 text-green-600" :
          status === "error" ? "bg-destructive/10 text-destructive" :
          "bg-muted text-muted-foreground"
        )}>
          {status === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : status === "error" ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            getFileIcon()
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {fileSize && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatSize(fileSize)}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {status === "uploading" && (
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% uploaded
              </p>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && errorMessage && (
            <p className="text-xs text-destructive mt-1">{errorMessage}</p>
          )}

          {/* Success Message */}
          {status === "success" && (
            <p className="text-xs text-green-600 mt-1">Upload complete</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {status === "uploading" && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {status === "error" && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-primary hover:text-primary"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * RetryableError - Error display with retry animation
 */
interface RetryableErrorProps {
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function RetryableError({
  message,
  suggestion,
  onRetry,
  retrying = false,
  className,
}: RetryableErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/5 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{message}</p>
          {suggestion && (
            <p className="text-xs text-muted-foreground mt-1">{suggestion}</p>
          )}
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {retrying ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Retrying...
              </>
            ) : (
              "Try Again"
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default FileUploadProgress;
