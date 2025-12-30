"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
} from "@/components/ui/dialog";
import { Switch as _Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardApi, Job as _Job, Application } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useSubscription } from "@/providers/subscription-provider";
import { Crown, Calendar, MapPin, DollarSign, Building, Target, Award, Clock, Mail, ExternalLink, Bookmark, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobDataTable } from "./JobDataTable";
import { getSalaryDisplay } from "@/utils/dashboard";

interface JobListProps {
  applications: Application[];
  onEditApplication: (application: Application) => void;
  onDeleteApplication: (applicationId: string) => void;
  onViewApplication: (application: Application) => void;
  onChanged?: () => void;
  // Optional external selection control
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export const JobList = React.memo(({
  applications,
  onEditApplication,
  onDeleteApplication: _onDeleteApplication,
  onViewApplication,
  onChanged,
  selectedIds: externalSelectedIds,
  onToggleSelection,
}: JobListProps) => {
  const { plan } = useSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] = useState(true);
  const [sortBy, setSortBy] = useState("dateFound");
  const [_viewsOpen, _setViewsOpen] = useState(false);
  const [_remindersOpen, _setRemindersOpen] = useState(false);
  const [_reminderEnable, _setReminderEnable] = useState(false);
  const [_reminderDate, _setReminderDate] = useState("");
  const [_savedViews, _setSavedViews] = useState<{ [key: string]: any }>({});

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
        (application.job?.title?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
        (application.job?.company?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
        (application.job?.location?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false);

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
          return (Number(b.job?.dateFound) || 0) - (Number(a.job?.dateFound) || 0);
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

  // Memoize delete handler to prevent JobDataTable re-renders
  const handleDeleteClick = useCallback(async (applicationId: string) => {
    try {
      await dashboardApi.deleteApplication(applicationId);
      showSuccess("Application deleted", "The job application has been removed.");
      onChanged?.();
    } catch (error) {
      showError("Delete failed", "Unable to delete application. Please try again.");
      console.error("Delete application error:", error);
    }
  }, [onChanged]);



  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-foreground">
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
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-foreground">
                Filter by Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className="border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
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
              <SelectTrigger className="w-full sm:w-40 border-border">
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

      {/* Applications List */}
      <JobDataTable
        applications={filteredApplications}
        onEditApplication={onEditApplication}
        onDeleteApplication={handleDeleteClick}
        onViewApplication={onViewApplication}
        onChanged={onChanged}
        selectedIds={externalSelectedIds}
        onToggleSelection={onToggleSelection}
      />

        {/* Upgrade Prompt for Free Users with Many Applications */}
        {plan === "free" && applications.length >= 10 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="bg-primary/5 border border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/15 rounded-full">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Upgrade to Premium</h3>
                      <p className="text-muted-foreground">
                        You&apos;ve reached {applications.length} applications! Upgrade to unlock unlimited job tracking, advanced analytics, and AI-powered insights.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => window.location.href = '/upgrade'}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </div>
  );
});
