"use client";

import React, { useState, useMemo } from "react";
import { Search, Briefcase, RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Job } from "@/utils/api/dashboard";
import { themeColors } from "@/styles/theme-colors";

interface JobSelectorProps {
  jobs: Job[];
  selectedJob: Job | null;
  onJobSelect: (job: Job) => void;
  onClear: () => void;
  loading?: boolean;
}

export function JobSelector({
  jobs,
  selectedJob,
  onJobSelect,
  onClear,
  loading = false,
}: JobSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs.slice(0, 5);
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading your saved jobs...
      </div>
    );
  }

  if (selectedJob) {
    return (
      <div className={cn("p-4 border rounded-lg", "bg-blue-50", "border-blue-200")}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={cn("font-medium", "text-blue-900")}>{selectedJob.title}</div>
            <div className={cn("text-sm", themeColors.primary.text)}>
              {selectedJob.company} • {selectedJob.location}
            </div>
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedJob.skills.slice(0, 4).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn("text-xs bg-white", themeColors.primary.border, themeColors.primary.text)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className={cn("hover:bg-blue-100", themeColors.primary.text, themeColors.primary.border)}
          >
            Change Job
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search saved jobs by title or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Button
              key={job._id}
              variant="outline"
              className="justify-start h-auto p-3 text-left hover:bg-gray-50 border-gray-200 group"
              onClick={() => onJobSelect(job)}
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors">
                  {job.title}
                </div>
                <div className="text-xs text-gray-600">
                  {job.company} • {job.location}
                </div>
              </div>
              <Briefcase className="h-4 w-4 text-gray-300 group-hover:text-primary ml-2" />
            </Button>
          ))
        ) : (
          <div className="text-center p-4 text-gray-500 text-sm border-2 border-dashed rounded-lg">
            No matching jobs found. Add more jobs to your dashboard!
          </div>
        )}
        {jobs.length > 5 && !searchTerm && (
          <p className="text-center text-[10px] text-gray-400">
            Showing latest 5 jobs. Use search to find more.
          </p>
        )}
      </div>
    </div>
  );
}
