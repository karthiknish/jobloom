"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  Send,
  UserCheck,
  XCircle,
  CheckCircle,
  Archive,
  StickyNote,
  FileText,
  Shield,
  Copy,
} from "lucide-react";
import { Application } from "@/types/dashboard";

export type ApplicationStatus = 
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

interface QuickActionsMenuProps {
  application: Application;
  onEdit: (application: Application) => void;
  onDelete: (applicationId: string) => void;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  onAddNote: (applicationId: string, note: string) => Promise<void>;
  onCheckSponsor?: (company: string) => void;
  onGenerateCoverLetter?: (application: Application) => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; icon: React.ReactNode }[] = [
  { value: "saved", label: "Saved", icon: <Clock className="h-4 w-4" /> },
  { value: "applied", label: "Applied", icon: <Send className="h-4 w-4" /> },
  { value: "interviewing", label: "Interviewing", icon: <UserCheck className="h-4 w-4" /> },
  { value: "offered", label: "Offered", icon: <CheckCircle className="h-4 w-4" /> },
  { value: "rejected", label: "Rejected", icon: <XCircle className="h-4 w-4" /> },
  { value: "withdrawn", label: "Withdrawn", icon: <Archive className="h-4 w-4" /> },
];

export function QuickActionsMenu({
  application,
  onEdit,
  onDelete,
  onStatusChange,
  onAddNote,
  onCheckSponsor,
  onGenerateCoverLetter,
}: QuickActionsMenuProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (status: ApplicationStatus) => {
    setIsLoading(true);
    try {
      await onStatusChange(application._id, status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsLoading(true);
    try {
      await onAddNote(application._id, noteText.trim());
      setNoteText("");
      setShowNoteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (application.job?.url) {
      navigator.clipboard.writeText(application.job.url);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Quick Status Change */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className="gap-2"
                  disabled={application.status === option.value}
                >
                  {option.icon}
                  {option.label}
                  {application.status === option.value && (
                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Quick Note */}
          <DropdownMenuItem onClick={() => setShowNoteDialog(true)} className="gap-2">
            <StickyNote className="h-4 w-4" />
            Add Note
          </DropdownMenuItem>

          {/* Edit */}
          <DropdownMenuItem onClick={() => onEdit(application)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Integration Actions */}
          {onCheckSponsor && application.job?.company && (
            <DropdownMenuItem
              onClick={() => onCheckSponsor(application.job!.company)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Check Sponsor
            </DropdownMenuItem>
          )}

          {onGenerateCoverLetter && (
            <DropdownMenuItem
              onClick={() => onGenerateCoverLetter(application)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Cover Letter
            </DropdownMenuItem>
          )}

          {/* External Link */}
          {application.job?.url && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open(application.job?.url, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Job Posting
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => onDelete(application._id)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Add a note for <span className="font-medium text-foreground">{application.job?.title}</span> at{" "}
              <span className="font-medium text-foreground">{application.job?.company}</span>
            </div>
            <Textarea
              placeholder="Add your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {application.notes && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Existing notes:</span> {application.notes}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNoteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={isLoading || !noteText.trim()}>
              {isLoading ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
