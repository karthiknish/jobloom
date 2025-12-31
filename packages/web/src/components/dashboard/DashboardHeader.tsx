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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl relative z-10"
      role="region"
      aria-label="Dashboard Overview"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-8 gap-6">
          {/* Left Section - Title & User Info */}
          <div className="flex items-start md:items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg"
            >
              <Briefcase className="icon-lg md:icon-xl text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground"
              >
                Job Dashboard
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5"
              >
                <p className="text-sm md:text-base text-primary-foreground/80 font-medium">
                  {greeting},{" "}
                  <span className="text-white font-semibold">
                    {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                  </span>
                </p>
                <Badge
                  variant={plan === "premium" ? "default" : "secondary"}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm motion-control ${
                    plan === "premium"
                      ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                      : "bg-white text-foreground border border-border hover:bg-gray-50"
                  }`}
                >
                  {plan === "premium" ? (
                    <>
                      <Sparkles className="icon-xs inline mr-1" />
                      Premium
                    </>
                  ) : (
                    <>
                      <Rocket className="icon-xs inline mr-1" />
                      Free
                    </>
                  )}
                </Badge>
                {currentUsage &&
                  limits.cvAnalysesPerMonth > 0 &&
                  limits.cvAnalysesPerMonth !== -1 && (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50 hidden sm:inline-flex"
                    >
                      <Zap className="icon-xs mr-1" />
                      {currentUsage.cvAnalyses}/
                      {limits.cvAnalysesPerMonth === -1
                        ? "∞"
                        : limits.cvAnalysesPerMonth} analyses
                    </Badge>
                  )}
              </motion.div>
            </div>
          </div>

          {/* Right Section - Action Buttons with clear hierarchy */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <TooltipProvider>
              {/* Import from Extension - PRIMARY CTA */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onImportJobs}
                    size="sm"
                    data-tour="import-jobs"
                    className="motion-button shadow-lg hover:shadow-xl bg-white text-primary hover:bg-white/90 border border-primary/10 gap-2 font-semibold"
                    aria-label="Import jobs from extension"
                  >
                    <Chrome className="icon-sm" />
                    <span className="hidden sm:inline">Import from Extension</span>
                    <span className="sm:hidden">Import</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Import jobs saved from the browser extension or upload a CSV file</p>
                </TooltipContent>
              </Tooltip>

              {/* Add Job - SECONDARY */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onAddJob}
                    variant="ghost"
                    size="sm"
                    data-tour="add-job"
                    className="motion-button text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/20 gap-2"
                    aria-label="Add new job manually"
                  >
                    <FilePlus className="icon-sm" />
                    <span className="hidden sm:inline">Add Job</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Manually add a job posting</p>
                </TooltipContent>
              </Tooltip>

              {/* Add Application - TERTIARY */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onAddApplication}
                    variant="ghost"
                    size="sm"
                    className="motion-button text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 gap-2"
                    aria-label="Track existing application"
                  >
                    <ClipboardList className="icon-sm" />
                    <span className="hidden md:inline">Track Application</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Track a job you&apos;ve already applied to</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </motion.div>
  );
}