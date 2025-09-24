"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  source: string;
  dateFound: number;
  userId: string;
}

interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: Job;
}

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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] =
    useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("dateFound");
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
        if (typeof parsed.sortBy === "string") setSortBy(parsed.sortBy);
      }
    } catch {}
  }, []);

  // Persist filters
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
    } catch {}
  }, [selectedStatus, showRecruitmentAgency, searchQuery, sortBy]);
  const [applicationToDelete, setApplicationToDelete] =
    useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("applied");
  const [bulkFollowUp, setBulkFollowUp] = useState<string>("");
  const [savedViews, setSavedViews] = useState<
    { id: string; name: string; filters: any }[]
  >([]);
  const [newViewName, setNewViewName] = useState("");
  const [viewsOpen, setViewsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderEnable, setReminderEnable] = useState(true);
  // ...existing code...
  useEffect(() => {
    dashboardApi
      .getSavedViews()
      .then(setSavedViews)
      .catch(() => {});
  }, []);

  const saveCurrentView = async () => {
    try {
      await dashboardApi.saveSavedView({
        name: newViewName || `View ${savedViews.length + 1}`,
        filters: { selectedStatus, showRecruitmentAgency, searchQuery, sortBy },
      });
      setSavedViews(await dashboardApi.getSavedViews());
      setNewViewName("");
      showSuccess("View saved");
    } catch (e: any) {
      showError(e?.message || "Failed to save view");
    }
  };

  const applySavedView = (id: string) => {
    const v = savedViews.find((x) => x.id === id);
    if (!v) return;
    const f = v.filters || {};
    if (typeof f.selectedStatus === "string")
      setSelectedStatus(f.selectedStatus);
    if (typeof f.showRecruitmentAgency === "boolean")
      setShowRecruitmentAgency(f.showRecruitmentAgency);
    if (typeof f.searchQuery === "string") setSearchQuery(f.searchQuery);
    if (typeof f.sortBy === "string") setSortBy(f.sortBy);
    showSuccess(`Applied "${v.name}"`);
  };

  const deleteSavedView = async (id: string) => {
    try {
      await dashboardApi.deleteSavedView(id);
      setSavedViews(await dashboardApi.getSavedViews());
      showSuccess("View deleted");
    } catch (e: any) {
      showError(e?.message || "Failed to delete view");
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked)
      setSelectedIds(new Set(filteredAndSortedApplications.map((a) => a._id)));
    else setSelectedIds(new Set());
  };

  const doBulkStatus = async () => {
    try {
      await dashboardApi.bulkUpdateApplicationsStatus(
        Array.from(selectedIds),
        bulkStatus
      );
      showSuccess("Status updated");
      setSelectedIds(new Set());
      onChanged?.();
    } catch (e: any) {
      showError(e?.message || "Bulk update failed");
    }
  };

  const doBulkFollowUp = async () => {
    try {
      const ts = bulkFollowUp ? new Date(bulkFollowUp).getTime() : undefined;
      await dashboardApi.bulkUpdateApplicationsFollowUp(
        Array.from(selectedIds),
        ts
      );
      showSuccess("Follow-up set");
      setSelectedIds(new Set());
          onChanged?.();
    } catch (e: any) {
      showError(e?.message || "Bulk update failed");
    }
  };
  const statusVariants: Record<
    | "interested"
    | "applied"
    | "interviewing"
    | "offered"
    | "rejected"
    | "withdrawn",
    "yellow" | "purple" | "green" | "destructive" | "secondary" | "default"
  > = {
    interested: "default",
    applied: "yellow",
    interviewing: "purple",
    offered: "green",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter((app) => {
      const matchesStatus =
        selectedStatus === "all" || app.status === selectedStatus;
      const matchesAgency =
        showRecruitmentAgency || !app.job?.isRecruitmentAgency;
      const matchesSearch =
        searchQuery === "" ||
        app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job?.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesAgency && matchesSearch;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.job?.title || "").localeCompare(b.job?.title || "");
        case "company":
          return (a.job?.company || "").localeCompare(b.job?.company || "");
        case "dateFound":
        default:
          return (b.job?.dateFound || 0) - (a.job?.dateFound || 0);
      }
    });

    return filtered;
  }, [
    applications,
    selectedStatus,
    showRecruitmentAgency,
    searchQuery,
    sortBy,
  ]);

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
  };

  const confirmDelete = () => {
    if (applicationToDelete) {
      onDeleteApplication(applicationToDelete._id);
      setApplicationToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border-0 bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-orange-950/10 dark:to-gray-900 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Job Filters</CardTitle>
              <CardDescription className="text-base">
                Filter and sort your job applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  id="search"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateFound">Date Found</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Checkbox
              id="show-agency"
              checked={showRecruitmentAgency}
              onCheckedChange={(checked) =>
                setShowRecruitmentAgency(checked === true)
              }
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label htmlFor="show-agency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Recruitment Agency Jobs</Label>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewsOpen(true)}
              className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Saved Views
            </Button>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="New view name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400"
              />
            </div>
            <Button size="sm" onClick={saveCurrentView} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save view
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filteredAndSortedApplications.length > 0 ? (
        <Card className="border-0 bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-orange-950/10 dark:to-gray-900 shadow-lg">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredAndSortedApplications.length
                  }
                  onCheckedChange={(checked) =>
                    toggleSelectAll(checked === true)
                  }
                  className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="select-all" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select all</Label>
                <span className="text-sm text-gray-600 dark:text-gray-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[160px] border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={doBulkStatus}
                  disabled={!selectedIds.size}
                  className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set status
                </Button>
                <Input
                  type="date"
                  value={bulkFollowUp}
                  onChange={(e) => setBulkFollowUp(e.target.value)}
                  className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={doBulkFollowUp}
                  disabled={!selectedIds.size}
                  className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set follow-up
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRemindersOpen(true)}
                  disabled={!selectedIds.size}
                  className="hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Reminders…
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedApplications.map((application) => (
                <motion.li
                  key={application._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-amber-50/30 dark:hover:from-orange-950/10 dark:hover:to-amber-950/10 transition-all duration-200 border-l-4 border-transparent hover:border-orange-400 dark:hover:border-orange-600"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          id={`sel-${application._id}`}
                          checked={selectedIds.has(application._id)}
                          onCheckedChange={(checked) =>
                            toggleSelect(application._id, checked === true)
                          }
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label
                          htmlFor={`sel-${application._id}`}
                          className="sr-only"
                        >
                          Select
                        </Label>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                                {application.job?.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="font-medium">{application.job?.company}</span>
                                <span className="text-gray-400">•</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{application.job?.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {application.job?.isSponsored && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-sm">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        Sponsored
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This job is sponsored by the company</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Badge
                                variant={
                                  statusVariants[
                                    application.status as keyof typeof statusVariants
                                  ] || "secondary"
                                }
                                className="capitalize"
                              >
                                {application.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Found:</span>
                          <span>{format(new Date(application.job?.dateFound || 0), "MMM d, yyyy")}</span>
                        </div>
                        {application.appliedDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Applied:</span>
                            <span>{format(new Date(application.appliedDate), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        {application.job?.salary && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Salary:</span>
                            <span>{application.job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="font-medium">Source:</span>
                          <span className="capitalize">{application.job?.source}</span>
                        </div>
                      </div>

                      {application.notes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {application.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewApplication(application)}
                              className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
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
                              className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600"
                            >
                              <PencilIcon className="h-4 w-4" />
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
                                  onClick={() => handleDeleteClick(application)}
                                  className="border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-600 text-red-600 dark:text-red-400"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the application for
                                    &quot;{application.job?.title}&quot; at{" "}
                                    {application.job?.company}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={confirmDelete}
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
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-orange-950/10 dark:to-gray-900 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {searchQuery || selectedStatus !== "all"
                ? "Try adjusting your filters or search terms to find more opportunities"
                : "Start by installing the Chrome extension to track jobs automatically and build your application pipeline"}
            </p>
            {(!searchQuery && selectedStatus === "all") && (
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Extension
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={viewsOpen} onOpenChange={setViewsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Saved Views</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedViews.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  No saved views yet.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Create your first view by setting filters and clicking "Save view"
                </p>
              </div>
            )}
            {savedViews.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{v.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Object.entries(v.filters || {})
                      .map(([k, val]) => `${k}:${String(val)}`)
                      .join(" • ")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySavedView(v.id)}
                    className="border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-600"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSavedView(v.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={remindersOpen} onOpenChange={setRemindersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Quick Reminders</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Enable reminders</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Toggle follow-up reminders for selected items
                  </div>
                </div>
              </div>
              <Switch
                checked={reminderEnable}
                onCheckedChange={(v) => setReminderEnable(v === true)}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Remind on</Label>
              <Input
                id="reminder-date"
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:focus:border-orange-400 dark:focus:ring-orange-400"
                disabled={!reminderEnable}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setRemindersOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const ts =
                      reminderEnable && reminderDate
                        ? new Date(reminderDate).getTime()
                        : undefined;
                    await dashboardApi.bulkUpdateApplicationsFollowUp(
                      Array.from(selectedIds),
                      ts
                    );
                    showSuccess("Reminders updated");
                    setRemindersOpen(false);
                    setSelectedIds(new Set());
                  } catch (e: any) {
                    showError(e?.message || "Failed to update reminders");
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}