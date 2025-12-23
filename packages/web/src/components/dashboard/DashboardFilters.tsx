"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Job title, company, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
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
  );
}
