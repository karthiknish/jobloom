"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DashboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  companyFilter: string;
  setCompanyFilter: (company: string) => void;
  uniqueCompanies: string[];
  filteredApplicationsCount: number;
  totalApplicationsCount: number;
}

export function DashboardFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  companyFilter,
  setCompanyFilter,
  uniqueCompanies,
  filteredApplicationsCount,
  totalApplicationsCount,
}: DashboardFiltersProps) {
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm, setSearchTerm]);
  return (
    <TooltipProvider delayDuration={300}>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="search-jobs">Search</label>
            <Input
              id="search-jobs"
              placeholder="Job title, company, location..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              aria-label="Search jobs by title, company or location"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium" htmlFor="status-filter">Status</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter jobs by their current progress in your application funnel.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium" htmlFor="company-filter">Company</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter jobs by the company name.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger id="company-filter" aria-label="Filter by company">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Saved Views */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Saved Views</label>
            <Select onValueChange={() => {}}>
              <SelectTrigger>
                <SelectValue placeholder="Load saved view..." />
              </SelectTrigger>
              <SelectContent>
                {/* This would be populated with saved views */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mt-4 gap-y-3">
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              Status: {statusFilter} ×
            </Badge>
          )}
          {companyFilter !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setCompanyFilter("all")}
            >
              Company: {companyFilter} ×
            </Badge>
          )}
          {searchTerm && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSearchTerm("")}
            >
              Search: {searchTerm} ×
            </Badge>
          )}
          {(statusFilter !== "all" || companyFilter !== "all" || searchTerm) && (
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setStatusFilter("all");
                setCompanyFilter("all");
                setSearchTerm("");
              }}
            >
              Clear All
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          Showing {filteredApplicationsCount} of {totalApplicationsCount} applications
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
