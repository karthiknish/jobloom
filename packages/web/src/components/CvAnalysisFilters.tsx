"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CvAnalysis } from "../types/api";

interface CvAnalysisFiltersProps {
  analyses: CvAnalysis[];
  onFilteredAnalyses: (filtered: CvAnalysis[]) => void;
}

export interface CvFilters {
  search: string;
  status: string[];
  minScore: number;
  industry: string | null;
  sortBy: "date-desc" | "date-asc" | "score-desc" | "score-asc" | "name-asc" | "name-desc";
}

const initialFilters: CvFilters = {
  search: "",
  status: [],
  minScore: 0,
  industry: null,
  sortBy: "date-desc",
};

export function CvAnalysisFilters({ analyses, onFilteredAnalyses }: CvAnalysisFiltersProps) {
  const [filters, setFilters] = useState<CvFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredAndSortedAnalyses = useMemo(() => {
    let filtered = [...analyses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(analysis =>
          ((analysis.fileName || (analysis as any).filename || "") as string)
            .toLowerCase()
            .includes(searchLower) ||
        (analysis.targetRole && analysis.targetRole.toLowerCase().includes(searchLower)) ||
        (analysis.industry && analysis.industry.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(analysis =>
        filters.status.includes(analysis.analysisStatus || 'pending')
      );
    }

    // Minimum score filter
    filtered = filtered.filter(analysis =>
      (analysis.overallScore || 0) >= filters.minScore
    );

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(analysis =>
        analysis.industry === filters.industry
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "date-asc":
          return a.createdAt - b.createdAt;
        case "date-desc":
          return b.createdAt - a.createdAt;
        case "score-asc":
          return (a.overallScore || 0) - (b.overallScore || 0);
        case "score-desc":
          return (b.overallScore || 0) - (a.overallScore || 0);
        case "name-asc":
          return (a.fileName || "").localeCompare(b.fileName || "");
        case "name-desc":
          return (b.fileName || "").localeCompare(a.fileName || "");
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [analyses, filters]);

  // Update parent component when filters change (useEffect, not useMemo)
  useEffect(() => {
    onFilteredAnalyses(filteredAndSortedAnalyses);
  }, [filteredAndSortedAnalyses, onFilteredAnalyses]);

  const updateFilter = <K extends keyof CvFilters>(
    key: K,
    value: CvFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = filters.search ||
    filters.status.length > 0 ||
    filters.minScore > 0 ||
    filters.industry ||
    filters.sortBy !== "date-desc";

  // Get unique industries for filter options
  const industries = useMemo(() => {
    const unique = new Set(analyses.map(a => a.industry).filter(Boolean));
    return Array.from(unique).sort();
  }, [analyses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Resume analyses..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value as CvFilters["sortBy"])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="score-desc">Highest Score</SelectItem>
            <SelectItem value="score-asc">Lowest Score</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              {[
                filters.search && 1,
                filters.status.length,
                filters.minScore > 0 && 1,
                filters.industry && 1,
                filters.sortBy !== "date-desc" && 1,
              ].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/50 rounded-lg p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="space-y-2">
                {["completed", "processing", "failed", "pending"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleStatusFilter(status)}
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm capitalize cursor-pointer"
                    >
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimum Score */}
            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Score</label>
              <Select value={filters.minScore.toString()} onValueChange={(value) => updateFilter("minScore", parseInt(value) || 0)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any score</SelectItem>
                  <SelectItem value="60">60+ (Good)</SelectItem>
                  <SelectItem value="70">70+ (Very Good)</SelectItem>
                  <SelectItem value="80">80+ (Excellent)</SelectItem>
                  <SelectItem value="90">90+ (Outstanding)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Industry Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select
                value={filters.industry ?? "__all__"}
                onValueChange={(value) =>
                  updateFilter("industry", value === "__all__" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry!}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredAndSortedAnalyses.length} of {analyses.length} analyses
        </span>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters applied</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
