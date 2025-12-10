"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckSquare,
  Trash2,
  Download,
  ChevronDown,
  X,
  Clock,
  Send,
  UserCheck,
  XCircle,
  CheckCircle,
  Archive,
} from "lucide-react";

export type ApplicationStatus = 
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: ApplicationStatus) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkExport: (format: "csv" | "json") => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; icon: React.ReactNode }[] = [
  { value: "saved", label: "Saved", icon: <Clock className="h-4 w-4" /> },
  { value: "applied", label: "Applied", icon: <Send className="h-4 w-4" /> },
  { value: "interviewing", label: "Interviewing", icon: <UserCheck className="h-4 w-4" /> },
  { value: "offered", label: "Offered", icon: <CheckCircle className="h-4 w-4" /> },
  { value: "rejected", label: "Rejected", icon: <XCircle className="h-4 w-4" /> },
  { value: "withdrawn", label: "Withdrawn", icon: <Archive className="h-4 w-4" /> },
];

export function BulkActionsBar({
  selectedCount,
  totalCount,
  isAllSelected,
  isPartiallySelected,
  onToggleSelectAll,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
  onBulkExport,
}: BulkActionsBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (status: ApplicationStatus) => {
    setIsLoading(true);
    try {
      await onBulkStatusChange(status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onBulkDelete();
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl mb-4"
          >
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                // Use data attribute to handle indeterminate state
                data-state={isPartiallySelected ? "indeterminate" : isAllSelected ? "checked" : "unchecked"}
                onCheckedChange={onToggleSelectAll}
                className="data-[state=indeterminate]:bg-primary/50"
              />
              <span className="text-sm font-medium text-foreground">
                {selectedCount} of {totalCount} selected
              </span>
            </div>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Status Change Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isLoading}
                >
                  <CheckSquare className="h-4 w-4" />
                  Change Status
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className="gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onBulkExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <div className="flex-1" />

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected jobs and their application history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
