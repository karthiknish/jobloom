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
import { Application, KanbanStatus } from "@/types/dashboard";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { JobAISummary } from "./JobAISummary";
import { EmailHistory } from "./EmailHistory";
import { UkVisaBadge } from "./UkVisaBadge";
import { dashboardApi } from "@/utils/api/dashboard";
import { cn } from "@/lib/utils";

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
                  {/* Status Badge - Simplified for header */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
                      statusStyle.bg,
                      "transition-all duration-300"
                    )}
                  >
                    <span className={statusStyle.color}>{statusStyle.icon}</span>
                    <span className={cn("text-xs font-bold uppercase tracking-wider", statusStyle.color)}>
                      {status}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {job?.isSponsored && (
                  <Badge variant="orange" className="gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Sponsored
                  </Badge>
                )}
                {job?.remoteWork && (
                  <Badge variant="teal" className="gap-1 shadow-sm">
                    <Globe className="h-3 w-3" />
                    Remote
                  </Badge>
                )}
                {job?.isRecruitmentAgency && (
                  <Badge variant="secondary" className="gap-1 shadow-sm">
                    <Users className="h-3 w-3" />
                    Agency
                  </Badge>
                )}
                {job?.seniority && (
                  <Badge variant="outline" className="gap-1 capitalize shadow-sm">
                    <TrendingUp className="h-3 w-3" />
                    {job.seniority}
                  </Badge>
                )}
                {job && <UkVisaBadge job={job} />}
              </div>
            </DialogHeader>

            {/* Tabs for Content Organization */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger 
                  value="overview" 
                  className="gap-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-lg"
                >
                  <Info className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="gap-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-lg"
                >
                  <ListChecks className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="gap-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-lg"
                >
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Application Progress / Status Section - MOVED AND ENHANCED */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">Application Status</h3>
                    </div>
                    <Badge variant="outline" className={cn("font-bold capitalize", statusStyle.color, statusStyle.bg, "border-none")}>
                      {status}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Update current stage:</p>
                      <Select
                        value={status}
                        onValueChange={async (next) => {
                          if (!next || next === status) return;
                          const prev = status;
                          setLocalStatus(next);
                          setIsUpdatingStatus(true);
                          try {
                            await dashboardApi.updateApplication(application._id, { status: next as KanbanStatus });
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
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200 hover:border-blue-400 transition-colors shadow-sm">
                          <SelectValue placeholder="Move to stage..." />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="py-2.5">
                              <div className="flex items-center gap-2">
                                <span className={statusConfig[o.value].color}>
                                  {statusConfig[o.value].icon}
                                </span>
                                <span className="font-medium">{o.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="hidden sm:block h-12 w-px bg-gray-100" />

                    <div className="flex-1 w-full flex flex-col justify-center">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Last Updated</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatDate(application.updatedAt || application.appliedDate)}
                      </p>
                    </div>
                  </div>
                </div>

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
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <MapPin className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Location</p>
                        <p className="font-semibold text-gray-800 leading-tight">{job.location}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Salary */}
                  {job?.salary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Salary</p>
                        <p className="font-bold text-green-700 leading-tight">
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
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <Calendar className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Date Found</p>
                        <p className="font-semibold text-gray-800 leading-tight">{formatDate(job.dateFound)}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Source */}
                  {job?.source && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <Target className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Source</p>
                        <p className="font-semibold text-gray-800 leading-tight capitalize">{job.source}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-8 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Skills Section */}
                {job?.skills && job.skills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Required Skills
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {job.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-4 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 font-medium hover:border-primary/50 transition-colors shadow-sm"
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
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Job Requirements
                      </h4>
                    </div>
                    <ul className="grid gap-3">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-4 p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 group">
                          <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed font-medium">{req}</span>
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
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Company Benefits
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/30 border border-green-100">
                          <Star className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm text-green-900 font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Application Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Timeline & Notes
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Applied Date */}
                    {application.appliedDate && (
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100">
                        <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-800/60 font-bold uppercase tracking-wider mb-0.5">Applied On</p>
                          <p className="font-bold text-blue-900">{formatDate(application.appliedDate)}</p>
                        </div>
                      </div>
                    )}

                    {/* Follow-up Date */}
                    {application.followUpDate && (
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/30 border border-amber-100">
                        <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-amber-100">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-800/60 font-bold uppercase tracking-wider mb-0.5">Follow-up</p>
                          <p className="font-bold text-amber-900">{formatDate(application.followUpDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {application.notes && (
                    <div className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h5 className="font-bold text-gray-800">Internal Notes</h5>
                      </div>
                      <div className="relative p-4 rounded-xl bg-white border border-gray-100 shadow-sm italic text-gray-600 text-sm leading-relaxed">
                        <div className="absolute -top-2 left-4 px-2 bg-white text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personal Reflection</div>
                        {application.notes}
                      </div>
                    </div>
                  )}

                  <EmailHistory applicationId={application._id} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit(application);
                }}
                className="flex-[2] h-12 gap-2 text-base font-bold shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all"
              >
                <Edit className="h-5 w-5" />
                Edit Application
              </Button>
              
              {job?.url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenJobLink}
                  className="flex-1 h-12 gap-2 border-gray-200 font-semibold hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Posting
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="sm:w-auto h-12 px-6 font-semibold"
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
