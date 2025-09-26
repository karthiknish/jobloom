"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  const statusLabels = {
    interested: "Interested",
    applied: "Applied",
    interviewing: "Interviewing",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Jobs
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      {stats.totalJobs}
                    </p>
                  </div>
                </div>
                <div className="text-blue-500 opacity-20 group-hover:opacity-30 transition-opacity">
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
          <Card className="group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📍</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Sponsored Jobs
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                      {stats.sponsoredJobs}
                    </p>
                  </div>
                </div>
                <div className="text-orange-500 opacity-20 group-hover:opacity-30 transition-opacity">
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
          <Card className="group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📄</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Applications
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                      {stats.totalApplications}
                    </p>
                  </div>
                </div>
                <div className="text-green-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
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
          <Card className="group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Jobs Today
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      {stats.jobsToday}
                    </p>
                  </div>
                </div>
                <div className="text-purple-500 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
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
          <Card className="group hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Applications by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="group/status">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            statusVariants[
                              status as keyof typeof statusVariants
                            ] || "secondary"
                          }
                          className="px-3 py-1 font-medium shadow-sm group-hover/status:shadow-md transition-shadow"
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
          <Card className="group hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                Recruitment Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group/insight flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100   rounded-xl hover:from-gray-100 hover:to-gray-200   transition-all duration-300 cursor-help">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover/insight:shadow-lg transition-shadow">
                            <span className="text-white text-xl">🏢</span>
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
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
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
                      <div className="group/insight flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100   rounded-xl hover:from-orange-100 hover:to-orange-200   transition-all duration-300 cursor-help">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md group-hover/insight:shadow-lg transition-shadow">
                            <span className="text-white text-xl">📍</span>
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
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                          {getPercentage(stats.sponsoredJobs, stats.totalJobs)}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of jobs that are sponsored</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="group/insight flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100   rounded-xl hover:from-green-100 hover:to-green-200   transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover/insight:shadow-lg transition-shadow">
                      <span className="text-white text-xl">📈</span>
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
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
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