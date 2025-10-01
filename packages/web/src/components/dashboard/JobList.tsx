"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardApi, Job, Application } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";

interface JobListProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
  onChanged?: () => void;
}

export function JobList({
  applications,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  onChanged,
}: JobListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] = useState(true);
  const [sortBy, setSortBy] = useState("dateFound");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewsOpen, setViewsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [reminderEnable, setReminderEnable] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [savedViews, setSavedViews] = useState<{ [key: string]: any }>({});

  // Restore filters from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("joblist:filters");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.selectedStatus === "string")
          setSelectedStatus(parsed.selectedStatus);
        if (typeof parsed.showRecruitmentAgency === "boolean")
          setShowRecruitmentAgency(parsed.showRecruitmentAgency);
        if (typeof parsed.searchQuery === "string")
          setSearchQuery(parsed.searchQuery);
        if (typeof parsed.sortBy === "string")
          setSortBy(parsed.sortBy);
      }
    } catch (error) {
      console.error("Failed to restore filters from localStorage:", error);
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "joblist:filters",
        JSON.stringify({
          selectedStatus,
          showRecruitmentAgency,
          searchQuery,
          sortBy,
        })
      );
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error);
    }
  }, [selectedStatus, showRecruitmentAgency, searchQuery, sortBy]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    const filtered = applications.filter((application) => {
      const matchesSearch =
        searchQuery === "" ||
        application.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.job?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.job?.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || application.status === selectedStatus;

      const matchesRecruitmentAgency =
        showRecruitmentAgency || !application.job?.isRecruitmentAgency;

      return matchesSearch && matchesStatus && matchesRecruitmentAgency;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dateFound":
          return (b.job?.dateFound || 0) - (a.job?.dateFound || 0);
        case "company":
          return (a.job?.company || "").localeCompare(b.job?.company || "");
        case "title":
          return (a.job?.title || "").localeCompare(b.job?.title || "");
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, searchQuery, selectedStatus, showRecruitmentAgency, sortBy]);

  const handleDeleteClick = async (applicationId: string) => {
    try {
      await dashboardApi.deleteApplication(applicationId);
      showSuccess("Application deleted", "The job application has been removed.");
      onChanged?.();
    } catch (error) {
      showError("Delete failed", "Unable to delete application. Please try again.");
      console.error("Delete application error:", error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          dashboardApi.deleteApplication(id)
        )
      );
      showSuccess("Applications deleted", `${selectedIds.size} applications have been removed.`);
      setSelectedIds(new Set());
      onChanged?.();
    } catch (error) {
      showError("Delete failed", "Unable to delete applications. Please try again.");
      console.error("Bulk delete error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border-0 bg-gradient-to-br from-background via-amber-50/30 to-background shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-amber-600 to-amber-600 bg-clip-text text-transparent">
                Job Filters
              </CardTitle>
              <CardDescription className="text-base">
                Filter and sort your job applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-foreground">
                Search Jobs
              </Label>
              <Input
                id="search"
                placeholder="Search jobs by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
className="border-border focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-foreground">
                Filter by Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className="border-border focus:border-amber-500 focus:ring-amber-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recruitment-agency"
                checked={showRecruitmentAgency}
                onCheckedChange={(checked) => setShowRecruitmentAgency(checked === true)}
              />
              <Label htmlFor="recruitment-agency" className="text-sm text-muted-foreground">
                Show recruitment agency jobs
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-foreground">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateFound">Date Found</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="title">Job Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-0 bg-gradient-to-br from-sky-50 to-violet-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-sky-700">
                {selectedIds.size} application{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sky-600 border-sky-200 hover:bg-sky-50"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <motion.div
            key={application._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-border hover:border-amber-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedIds.has(application._id)}
                    onCheckedChange={(checked) => {
                      const newSelectedIds = new Set(selectedIds);
                      if (checked) {
                        newSelectedIds.add(application._id);
                      } else {
                        newSelectedIds.delete(application._id);
                      }
                      setSelectedIds(newSelectedIds);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {application.job?.title || "Untitled Job"}
                        </h3>
                        <p className="text-muted-foreground mb-2">{application.job?.company || "Unknown Company"}</p>
                        
                        {/* Basic Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {application.job?.location || "Unknown Location"}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(application.job?.dateFound || 0), "MMM d, yyyy")}
                          </span>
                          {application.job?.jobType && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {application.job.jobType}
                            </span>
                          )}
                        </div>
                        
                        {/* Additional Details */}
                        {(application.job?.salary || application.job?.experienceLevel || application.job?.industry) && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            {application.job?.salary && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {application.job.salary}
                              </span>
                            )}
                            {application.job?.experienceLevel && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                {application.job.experienceLevel}
                              </span>
                            )}
                            {application.job?.industry && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {application.job.industry}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Skills */}
                        {application.job?.skills && application.job.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {application.job.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {application.job.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{application.job.skills.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Status and Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={application.status === "applied" ? "default" : "secondary"}>
                            {application.status}
                          </Badge>
                          {application.job?.isSponsored && (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                              🇬🇧 Sponsored
                            </Badge>
                          )}
                          {application.job?.isRecruitmentAgency && (
                            <Badge variant="outline" className="border-sky-500 text-sky-700">
                              Agency
                            </Badge>
                          )}
                          {application.job?.remoteWork && (
                            <Badge variant="outline" className="border-violet-500 text-violet-700">
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewApplication(application)}
className="text-sky-600 border-sky-200 hover:bg-sky-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Application</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditApplication(application)}
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Application</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Application</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the application for &quot;{application.job?.title || "this job"}&quot; at {application.job?.company || "this company"}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteClick(application._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Application</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredApplications.length === 0 && (
          <Card className="border-0 bg-gradient-to-br from-muted to-muted/80 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No applications found
              </h3>
              <p className="text-muted-foreground">
                {applications.length === 0
                  ? "You haven't added any job applications yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
