"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Archive, FileText, MoreHorizontal } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkPublish: () => void;
  onBulkDraft: () => void;
}

export function BulkActions({
  selectedCount,
  onBulkDelete,
  onBulkArchive,
  onBulkPublish,
  onBulkDraft,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">
        {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onBulkPublish}>
            <FileText className="mr-2 h-4 w-4" />
            Publish Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onBulkDraft}>
            <FileText className="mr-2 h-4 w-4" />
            Set as Draft
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onBulkArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onBulkDelete}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
