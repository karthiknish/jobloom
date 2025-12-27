"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Briefcase,
  Building2,
} from "lucide-react";
import { Application } from "@/types/dashboard";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";

interface RecentlyDeletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedApplications: Application[];
  onRefetch: () => void;
}

export function RecentlyDeletedModal({
  open,
  onOpenChange,
  deletedApplications,
  onRefetch,
}: RecentlyDeletedModalProps) {
  useRestoreFocus(open);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === deletedApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletedApplications.map(a => a._id)));
    }
  };

  const handleRestore = async (applicationId: string) => {
    setIsLoading(true);
    try {
      await dashboardApi.restoreApplication(applicationId);
      await onRefetch();
      showSuccess("Application restored", "The application has been restored to your dashboard.");
    } catch (error) {
      console.error("Restore failed:", error);
      showError("Failed to restore", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    try {
      await dashboardApi.bulkRestoreApplications(Array.from(selectedIds));
      await onRefetch();
      showSuccess(`${selectedIds.size} applications restored`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Bulk restore failed:", error);
      showError("Failed to restore applications", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentDelete = async (applicationId: string) => {
    setIsLoading(true);
    try {
      await dashboardApi.permanentlyDeleteApplication(applicationId);
      await onRefetch();
      showSuccess("Permanently deleted", "The application has been permanently removed.");
      setConfirmPermanentDelete(null);
    } catch (error) {
      console.error("Permanent delete failed:", error);
      showError("Failed to delete", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (deletedAt: number) => {
    const deleteDate = new Date(deletedAt);
    const expiryDate = new Date(deletedAt + 30 * 24 * 60 * 60 * 1000); // 30 days
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              Recently Deleted
            </DialogTitle>
            <DialogDescription>
              Items are permanently deleted after 30 days. Restore them to keep them.
            </DialogDescription>
          </DialogHeader>

          {deletedApplications.length === 0 ? (
            <div className="py-12 text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No deleted items</h3>
              <p className="text-sm text-muted-foreground">
                When you delete applications, they&apos;ll appear here for 30 days.
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.size === deletedApplications.length && deletedApplications.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                  </span>
                </div>
                {selectedIds.size > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkRestore}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore Selected
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-2 py-2">
                  <AnimatePresence mode="popLayout">
                    {deletedApplications.map((app) => {
                      const daysRemaining = getDaysRemaining(app.deletedAt || 0);
                      
                      return (
                        <motion.div
                          key={app._id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox 
                            checked={selectedIds.has(app._id)}
                            onCheckedChange={() => toggleSelection(app._id)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium truncate">{app.job?.title || "Unknown Position"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{app.job?.company || "Unknown Company"}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <Clock className="h-3 w-3" />
                              <span>Deleted {formatDistanceToNow(app.deletedAt || 0, { addSuffix: true })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {daysRemaining <= 7 && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {daysRemaining}d left
                              </Badge>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(app._id)}
                              disabled={isLoading}
                              className="gap-1"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmPermanentDelete(app._id)}
                              disabled={isLoading}
                              className="text-destructive hover:text-destructive h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              <div className="pt-4 border-t text-center text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Items are automatically and permanently deleted after 30 days
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!confirmPermanentDelete} onOpenChange={() => setConfirmPermanentDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The application will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPermanentDelete && handlePermanentDelete(confirmPermanentDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
