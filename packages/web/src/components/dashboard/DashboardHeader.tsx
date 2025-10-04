"use client";

import React from "react";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGreeting } from "@/utils/dashboard";
import {
  LayoutDashboard,
  Sparkles,
  Rocket,
  UploadCloud,
  FilePlus,
  ClipboardList,
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
    <div className="bg-background/90 backdrop-blur-2xl border-b border-border/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 gap-6"
        >
          <div className="flex items-start md:items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 flex items-center justify-center shadow-xl"
            >
              <LayoutDashboard className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="text-4xl font-serif font-bold bg-gradient-to-r from-foreground via-emerald-900 to-emerald-800 bg-clip-text text-transparent"
              >
                Job Dashboard
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="flex items-center gap-3 mt-3"
              >
                <p className="text-base text-muted-foreground font-medium">
                  {greeting},{" "}
                  <span className="text-foreground font-semibold">
                    {user?.displayName || user?.email}
                  </span>
                  !
                </p>
                <Badge
                  variant={plan === "premium" ? "default" : "secondary"}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition-all duration-300 ${
                    plan === "premium"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-muted to-muted/80 text-foreground hover:from-muted/80 hover:to-muted/60"
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
                      Free Plan
                    </>
                  )}
                </Badge>
                {currentUsage &&
                  limits.cvAnalysesPerMonth > 0 &&
                  limits.cvAnalysesPerMonth !== -1 && (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-primary/30 text-primary bg-primary/10"
                    >
                      CV Analyses: {currentUsage.cvAnalyses}/
                      {limits.cvAnalysesPerMonth === -1
                        ? "∞"
                        : limits.cvAnalysesPerMonth}
                    </Badge>
                  )}
              </motion.div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onImportJobs}
                variant="default"
                size="sm"
                className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-primary-foreground border-0"
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Import Jobs
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onAddJob}
                variant="default"
                size="sm"
                className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-primary-foreground border-0"
              >
                <FilePlus className="mr-2 h-4 w-4" /> Add Job
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onAddApplication}
                variant="outline"
                size="sm"
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-border hover:border-border hover:bg-muted/50"
              >
                <ClipboardList className="mr-2 h-4 w-4" /> Add Application
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}