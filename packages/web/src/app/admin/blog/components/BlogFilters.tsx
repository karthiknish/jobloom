"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

interface BlogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreatePost: () => void;
  selectedCount: number;
  onClearSelection: () => void;
}

export function BlogFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreatePost,
  selectedCount,
  onClearSelection,
}: BlogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-200 focus:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px] border-gray-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-700">
            {selectedCount} selected
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs hover:bg-transparent ml-1 text-gray-500 hover:text-gray-700"
              onClick={onClearSelection}
            >
              Clear
            </Button>
          </Badge>
        )}
        <Button onClick={onCreatePost}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
    </div>
  );
}
