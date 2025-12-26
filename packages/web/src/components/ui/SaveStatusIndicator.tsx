"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
  showText?: boolean;
  /** Auto-dismiss "saved" status after this many ms */
  autoHideSavedMs?: number;
}

const statusConfig: Record<SaveStatus, {
  icon: React.ReactNode;
  text: string;
  className: string;
}> = {
  idle: {
    icon: null,
    text: "",
    className: "text-transparent",
  },
  saving: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    text: "Saving...",
    className: "text-muted-foreground",
  },
  saved: {
    icon: <Check className="h-3.5 w-3.5" />,
    text: "Saved",
    className: "text-green-600",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    text: "Save failed",
    className: "text-destructive",
  },
  offline: {
    icon: <CloudOff className="h-3.5 w-3.5" />,
    text: "Offline",
    className: "text-amber-500",
  },
};

/**
 * SaveStatusIndicator - Shows save status with icon and optional text
 * 
 * Usage:
 * const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
 * 
 * const handleSave = async () => {
 *   setSaveStatus("saving");
 *   try {
 *     await save();
 *     setSaveStatus("saved");
 *   } catch {
 *     setSaveStatus("error");
 *   }
 * };
 * 
 * <SaveStatusIndicator status={saveStatus} showText />
 */
export function SaveStatusIndicator({
  status,
  className,
  showText = true,
  autoHideSavedMs = 3000,
}: SaveStatusIndicatorProps) {
  const config = statusConfig[status];
  const isVisible = status !== "idle";

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            config.className,
            className
          )}
          role="status"
          aria-live="polite"
        >
          {config.icon}
          {showText && <span>{config.text}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Unsaved Changes Badge - Shows when there are unsaved changes
 */
export function UnsavedChangesBadge({
  hasChanges,
  className,
}: {
  hasChanges: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md",
            "bg-amber-500/10 border border-amber-500/20",
            "text-xs font-medium text-amber-600",
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          Unsaved changes
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * CloudSyncStatus - Shows cloud sync status with animation
 */
export function CloudSyncStatus({
  syncing,
  synced,
  className,
}: {
  syncing: boolean;
  synced: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <AnimatePresence mode="wait">
        {syncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 180 }}
            className="text-muted-foreground"
          >
            <Cloud className="h-4 w-4 animate-pulse" />
          </motion.div>
        ) : synced ? (
          <motion.div
            key="synced"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-600"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-500"
          >
            <CloudOff className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="text-muted-foreground sr-only">
        {syncing ? "Syncing" : synced ? "Synced" : "Offline"}
      </span>
    </div>
  );
}
