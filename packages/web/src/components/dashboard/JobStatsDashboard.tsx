"use client";

import { motion } from "framer-motion";
import { Briefcase, Building, MapPin, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
  byStatus: Record<string, number>;
}

interface JobStatsDashboardProps {
  stats: JobStats;
}

export function JobStatsDashboard({ stats }: JobStatsDashboardProps) {
  // Early return if stats is not available
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground italic">
        Loading statistics...
      </div>
    );
  }

  if (stats.totalJobs === 0 && stats.totalApplications === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Statistics Yet"
        description="Add some job applications to see your metrics and insights come to life."
        size="lg"
        primaryAction={{
          label: "Add Your First Job",
          onClick: () => (document.querySelector('[data-tour="add-job-btn"]') as HTMLButtonElement)?.click(),
          icon: Zap
        }}
      />
    );
  }

  const statusVariants: Record<
    | "interested"
    | "applied"
    | "offered"
    | "rejected"
    | "withdrawn",
    "yellow" | "teal" | "green" | "destructive" | "secondary" | "default"
  > = {
    interested: "default",
    applied: "yellow",
    offered: "green",
    rejected: "destructive",
    withdrawn: "secondary",
  };

  const statusLabels = {
    interested: "Interested",
    applied: "Applied",
    offered: "Offered",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      {/* Main Stats Cards */}
      <div data-tour="stats-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 motion-stagger">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="group motion-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Jobs
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.totalJobs}
                    </p>
                  </div>
                </div>
                <div className="text-sky-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="group motion-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-orange-500 shadow-lg">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Sponsored Jobs
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {stats.sponsoredJobs}
                    </p>
                  </div>
                </div>
                <div className="text-amber-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="group motion-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-primary shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Applications
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {stats.totalApplications}
                    </p>
                  </div>
                </div>
                <div className="text-emerald-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 3H3L9 12H6l4 7 1-9h3l-5-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="group motion-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-teal-500 shadow-lg">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Today&apos;s Jobs
                    </p>
                    <p className="text-3xl font-bold text-teal-600">
                      {stats.jobsToday}
                    </p>
                  </div>
                </div>
                <div className="text-teal-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 3a1 1 0 100 2h11.586l-3.293 3.293a1 1 0 001.414 1.414l4.999-4.999a1 1 0 000-1.414l-5-5a1 1 0 10-1.414 1.414L14.586 3H3z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="group hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Applications by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="group/status">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            statusVariants[
                              status as keyof typeof statusVariants
                            ] || "secondary"
                          }
                          className="px-3 py-1 font-medium shadow-sm group-hover/status:shadow-md motion-control"
                        >
                          {statusLabels[status as keyof typeof statusLabels] ||
                            status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">
                          {count}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({getPercentage(count, stats.totalApplications)}%)
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress
                        value={getPercentage(count, stats.totalApplications)}
                        className="h-3 rounded-full overflow-hidden"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                        style={{
                          width: `${getPercentage(
                            count,
                            stats.totalApplications
                          )}%`,
                          animationDuration: "2s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recruitment Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="group hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6 text-primary" />
                Recruitment Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group/insight flex items-center justify-between p-4 bg-card border rounded-xl hover:from-muted/80 hover:to-muted/60 motion-surface cursor-help">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-blue-500 shadow-md group-hover/insight:shadow-lg motion-control">
                            <Building className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <span className="font-semibold text-foreground">
                              Agency Jobs
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Recruitment agency postings
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {stats.recruitmentAgencyJobs || 0}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jobs posted by recruitment agencies</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group/insight flex items-center justify-between p-4 bg-card rounded-xl hover:from-orange-100 hover:to-orange-200 motion-surface cursor-help">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-orange-500 shadow-md group-hover/insight:shadow-lg motion-control">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <span className="font-semibold text-foreground">
                              Sponsored %
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Company-sponsored positions
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-orange-600">
                          {getPercentage(stats.sponsoredJobs, stats.totalJobs)}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of jobs that are sponsored</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="group/insight flex items-center justify-between p-4 bg-card rounded-xl hover:from-green-100 hover:to-green-200 motion-surface">
                  <div className="flex items-center">
                    <div className="p-3 rounded-xl bg-green-500 shadow-md group-hover/insight:shadow-lg motion-control">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <span className="font-semibold text-foreground">
                        Application Rate
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Jobs applied to vs total
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {getPercentage(stats.totalApplications, stats.totalJobs)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}