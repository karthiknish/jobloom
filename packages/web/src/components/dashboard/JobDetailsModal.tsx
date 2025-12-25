"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  Edit,
  X,
  CheckCircle2,
  Star,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  AlertCircle,
  FileText,
  Target,
  Info,
  ListChecks,
  Activity,
} from "lucide-react";
import { Application } from "@/types/dashboard";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { JobAISummary } from "./JobAISummary";
import { EmailHistory } from "./EmailHistory";
import { UkVisaBadge } from "./UkVisaBadge";
import { dashboardApi } from "@/utils/api/dashboard";

interface JobDetailsModalProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (application: Application) => void;
  onChanged?: () => void;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  interested: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Star className="h-4 w-4" />,
  },
  applied: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Clock className="h-4 w-4" />,
  },
  offered: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  rejected: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: <X className="h-4 w-4" />,
  },
  withdrawn: {
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

export function JobDetailsModal({
  application,
  open,
  onOpenChange,
  onEdit,
  onChanged,
}: JobDetailsModalProps) {
  useRestoreFocus(open);
  if (!application) return null;

  const job = application.job;

  const statusOptions = useMemo(
    () =>
      [
        { value: "interested", label: "Interested" },
        { value: "applied", label: "Applied" },
        { value: "offered", label: "Offered" },
        { value: "rejected", label: "Rejected" },
        { value: "withdrawn", label: "Withdrawn" },
      ] as const,
    []
  );

  const [localStatus, setLocalStatus] = useState<string>(application.status || "interested");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setLocalStatus(application.status || "interested");
  }, [application._id, application.status]);

  const status = localStatus || "interested";
  const statusStyle = statusConfig[status] || statusConfig.interested;

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return format(date, "MMM d, yyyy");
  };

  const handleOpenJobLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (job?.url) {
      window.open(job.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="text-2xl font-bold leading-tight">
                    {job?.title || "Untitled Position"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {job?.company || "Unknown Company"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status Badge */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusStyle.bg}`}
                  >
                    <span className={statusStyle.color}>{statusStyle.icon}</span>
                    <span className={`font-semibold capitalize ${statusStyle.color}`}>
                      {status}
                    </span>
                  </motion.div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Change</span>
                    <Select
                      value={status}
                      onValueChange={async (next) => {
                        if (!next || next === status) return;
                        const prev = status;
                        setLocalStatus(next);
                        setIsUpdatingStatus(true);
                        try {
                          await dashboardApi.updateApplication(application._id, { status: next });
                          onChanged?.();
                        } catch (err) {
                          console.error("Failed to update status", err);
                          setLocalStatus(prev);
                        } finally {
                          setIsUpdatingStatus(false);
                        }
                      }}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2">
                {job?.isSponsored && (
                  <Badge variant="orange" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Sponsored{job.sponsorshipType ? ` - ${job.sponsorshipType}` : ""}
                  </Badge>
                )}
                {job?.likelySocCode && (
                  <Badge variant="secondary" className="gap-1" title="UK SOC Code for visa classification">
                    SOC: {job.likelySocCode}
                    {job?.socMatchConfidence && ` (${Math.round(job.socMatchConfidence * 100)}%)`}
                  </Badge>
                )}
                {job?.remoteWork && (
                  <Badge variant="teal" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Remote
                  </Badge>
                )}
                {job?.isRecruitmentAgency && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Agency
                  </Badge>
                )}
                {job?.locationType && job.locationType !== "remote" && (
                  <Badge variant="outline" className="capitalize">
                    {job.locationType}
                  </Badge>
                )}
                {job?.employmentType && (
                  <Badge variant="outline" className="capitalize">
                    {job.employmentType}
                  </Badge>
                )}
                {job?.seniority && (
                  <Badge variant="outline" className="gap-1 capitalize">
                    <TrendingUp className="h-3 w-3" />
                    {job.seniority}
                  </Badge>
                )}
                {job?.department && (
                  <Badge variant="outline" className="gap-1 capitalize">
                    <Briefcase className="h-3 w-3" />
                    {job.department}
                  </Badge>
                )}
                {job && <UkVisaBadge job={job} />}
              </div>
            </DialogHeader>

            {/* Tabs for Content Organization */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2 text-sm">
                  <ListChecks className="h-4 w-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2 text-sm">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-4">
            {/* AI Summary Section */}
            {job?.description && (
              <JobAISummary 
                jobDescription={job.description} 
                jobId={job._id} 
              />
            )}

            {/* Job Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              {job?.location && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-background">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Location</p>
                    <p className="font-medium">{job.location}</p>
                  </div>
                </motion.div>
              )}

              {/* Salary */}
              {job?.salary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-background">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Salary</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {job.salary}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Date Found */}
              {job?.dateFound && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-background">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Date Found</p>
                    <p className="font-medium">{formatDate(job.dateFound)}</p>
                  </div>
                </motion.div>
              )}

              {/* Source */}
              {job?.source && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-background">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Source</p>
                    <p className="font-medium capitalize">{job.source}</p>
                  </div>
                </motion.div>
              )}
            </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-4">
            {/* Skills Section */}
            {job?.skills && job.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Requirements Section */}
            {job?.requirements && job.requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Requirements
                </h4>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Benefits Section */}
            {job?.benefits && job.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Benefits
                </h4>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6 mt-4">
            {/* Application Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Application Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Applied Date */}
                {application.appliedDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Briefcase className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Applied On
                      </p>
                      <p className="font-medium text-foreground">
                        {formatDate(application.appliedDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Follow-up Date */}
                {application.followUpDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Follow-up On
                      </p>
                      <p className="font-medium text-foreground">
                        {formatDate(application.followUpDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {application.notes && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h5 className="font-medium text-foreground">Notes</h5>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.notes}
                  </p>
                </div>
              )}

              <EmailHistory applicationId={application._id} />
            </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit(application);
                }}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Application
              </Button>
              
              {job?.url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenJobLink}
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Job Link
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
