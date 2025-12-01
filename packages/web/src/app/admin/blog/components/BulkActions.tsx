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
      <span className="text-sm text-gray-500">
        {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-gray-200">
          <DropdownMenuItem onClick={onBulkPublish} className="text-gray-700 focus:bg-gray-100">
            <FileText className="mr-2 h-4 w-4" />
            Publish Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onBulkDraft} className="text-gray-700 focus:bg-gray-100">
            <FileText className="mr-2 h-4 w-4" />
            Set as Draft
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem onClick={onBulkArchive} className="text-gray-700 focus:bg-gray-100">
            <Archive className="mr-2 h-4 w-4" />
            Archive Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem
            onClick={onBulkDelete}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
