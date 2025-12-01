"use client";

import React from "react";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/providers/subscription-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGreeting } from "@/utils/dashboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Briefcase,
  Sparkles,
  Rocket,
  UploadCloud,
  FilePlus,
  ClipboardList,
  Chrome,
  Zap,
} from "lucide-react";

interface DashboardHeaderProps {
  onImportJobs: () => void;
  onAddJob: () => void;
  onAddApplication: () => void;
}

export function DashboardHeader({
  onImportJobs,
  onAddJob,
  onAddApplication,
}: DashboardHeaderProps) {
  const { user } = useFirebaseAuth();
  const { plan, limits, currentUsage } = useSubscription();
  const greeting = getGreeting();

  return (
    <div className="bg-gradient-to-r from-background via-background to-emerald-50/30 dark:to-emerald-950/10 backdrop-blur-2xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 gap-5"
        >
          {/* Left Section - Title & User Info */}
          <div className="flex items-start md:items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Briefcase className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-emerald-800 to-emerald-700 dark:via-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent"
              >
                Job Dashboard
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5"
              >
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {greeting},{" "}
                  <span className="text-foreground font-semibold">
                    {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                  </span>
                </p>
                <Badge
                  variant={plan === "premium" ? "default" : "secondary"}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm transition-all duration-300 ${
                    plan === "premium"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {plan === "premium" ? (
                    <>
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      Premium
                    </>
                  ) : (
                    <>
                      <Rocket className="h-3 w-3 inline mr-1" />
                      Free
                    </>
                  )}
                </Badge>
                {currentUsage &&
                  limits.cvAnalysesPerMonth > 0 &&
                  limits.cvAnalysesPerMonth !== -1 && (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hidden sm:inline-flex"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {currentUsage.cvAnalyses}/
                      {limits.cvAnalysesPerMonth === -1
                        ? "∞"
                        : limits.cvAnalysesPerMonth} analyses
                    </Badge>
                  )}
              </motion.div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <TooltipProvider>
              {/* Import from Extension - Primary CTA */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={onImportJobs}
                      size="sm"
                      className="shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 gap-2"
                    >
                      <Chrome className="h-4 w-4" />
                      <span className="hidden sm:inline">Import from Extension</span>
                      <span className="sm:hidden">Import</span>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Import jobs saved from the browser extension or upload a CSV file</p>
                </TooltipContent>
              </Tooltip>

              {/* Add Job */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={onAddJob}
                      variant="default"
                      size="sm"
                      className="shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 gap-2"
                    >
                      <FilePlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Job</span>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Manually add a job posting</p>
                </TooltipContent>
              </Tooltip>

              {/* Add Application */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={onAddApplication}
                      variant="outline"
                      size="sm"
                      className="shadow-sm hover:shadow-md transition-all duration-300 border-border/60 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 gap-2"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span className="hidden sm:inline">Track Application</span>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Track a job you&apos;ve already applied to</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
      </div>
    </div>
  );
}