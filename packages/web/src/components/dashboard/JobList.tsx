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
      <Card>
        <CardHeader>
          <CardTitle>Job Filters</CardTitle>
          <CardDescription>
            Filter and sort your job applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
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
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-agency"
              checked={showRecruitmentAgency}
              onCheckedChange={(checked) =>
                setShowRecruitmentAgency(checked === true)
              }
            />
            <Label htmlFor="show-agency">Show Recruitment Agency Jobs</Label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewsOpen(true)}
            >
              Saved Views
            </Button>
            <Input
              placeholder="New view name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
            />
            <Button size="sm" onClick={saveCurrentView}>
              Save view
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filteredAndSortedApplications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredAndSortedApplications.length
                  }
                  onCheckedChange={(checked) =>
                    toggleSelectAll(checked === true)
                  }
                />
                <Label htmlFor="select-all">Select all</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[160px]">
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
                >
                  Set status
                </Button>
                <Input
                  type="date"
                  value={bulkFollowUp}
                  onChange={(e) => setBulkFollowUp(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={doBulkFollowUp}
                  disabled={!selectedIds.size}
                >
                  Set follow-up
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRemindersOpen(true)}
                  disabled={!selectedIds.size}
                >
                  Reminders…
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {filteredAndSortedApplications.map((application) => (
                <motion.li
                  key={application._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id={`sel-${application._id}`}
                          checked={selectedIds.has(application._id)}
                          onCheckedChange={(checked) =>
                            toggleSelect(application._id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`sel-${application._id}`}
                          className="sr-only"
                        >
                          Select
                        </Label>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {application.job?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {application.job?.company} •{" "}
                            {application.job?.location}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {application.job?.isSponsored && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="orange">Sponsored</Badge>
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
                          >
                            {application.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                        <span>
                          Found:{" "}
                          {format(
                            new Date(application.job?.dateFound || 0),
                            "MMM d, yyyy"
                          )}
                        </span>
                        {application.appliedDate && (
                          <span>
                            Applied:{" "}
                            {format(
                              new Date(application.appliedDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        )}
                        {application.job?.salary && (
                          <span>Salary: {application.job.salary}</span>
                        )}
                        <span className="capitalize">
                          Source: {application.job?.source}
                        </span>
                      </div>

                      {application.notes && (
                        <p className="mt-2 text-sm text-foreground line-clamp-2">
                          {application.notes}
                        </p>
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
                                    className="bg-destructive hover:bg-destructive/90"
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
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No jobs found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedStatus !== "all"
                ? "Try adjusting your filters or search terms"
                : "Start by installing the Chrome extension to track jobs automatically"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={viewsOpen} onOpenChange={setViewsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Views</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {savedViews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No saved views yet.
              </p>
            )}
            {savedViews.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">
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
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSavedView(v.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Reminders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable reminders</div>
                <div className="text-sm text-muted-foreground">
                  Toggle follow-up reminders for selected items
                </div>
              </div>
              <Switch
                checked={reminderEnable}
                onCheckedChange={(v) => setReminderEnable(v === true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Remind on</Label>
              <Input
                id="reminder-date"
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRemindersOpen(false)}>
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
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}