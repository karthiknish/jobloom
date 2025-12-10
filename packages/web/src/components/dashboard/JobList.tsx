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
  onDeleteApplication: _onDeleteApplication,
  onViewApplication,
  onChanged,
}: JobListProps) {
  const { plan } = useSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showRecruitmentAgency, setShowRecruitmentAgency] = useState(true);
  const [sortBy, setSortBy] = useState("dateFound");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      <Card className="border-0 bg-card shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-amber-600">
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
        <Card className="border-0 bg-card shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">
                {selectedIds.size} application{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-primary border-primary/30 hover:bg-primary/10"
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
      <JobDataTable
        applications={filteredApplications}
        onEditApplication={onEditApplication}
        onDeleteApplication={handleDeleteClick}
        onViewApplication={onViewApplication}
        onChanged={onChanged}
      />

        {/* Upgrade Prompt for Free Users with Many Applications */}
        {plan === "free" && applications.length >= 10 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="bg-card border-amber-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900">Upgrade to Premium</h3>
                      <p className="text-amber-700">
                        You&apos;ve reached {applications.length} applications! Upgrade to unlock unlimited job tracking, advanced analytics, and AI-powered insights.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
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
}
