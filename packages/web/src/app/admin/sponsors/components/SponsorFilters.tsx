"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, RefreshCw, Download, Filter } from "lucide-react";

interface SponsorFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  industryFilter: string;
  onIndustryFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreateSponsor: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isExporting: boolean;
  industries: string[];
  types: string[];
}

export function SponsorFilters({
  searchTerm,
  onSearchChange,
  industryFilter,
  onIndustryFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onCreateSponsor,
  onRefresh,
  onExport,
  isExporting,
  industries,
  types,
}: SponsorFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search sponsors..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-200 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Select value={industryFilter} onValueChange={onIndustryFilterChange}>
              <SelectTrigger className="w-[160px] border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue placeholder="Industry" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-[160px] border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[140px] border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh" className="border-gray-200 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="outline" onClick={onExport} disabled={isExporting} className="border-gray-200 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4 text-gray-500" />
            Export
          </Button>
          <Button onClick={onCreateSponsor}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sponsor
          </Button>
        </div>
      </div>
    </div>
  );
}
