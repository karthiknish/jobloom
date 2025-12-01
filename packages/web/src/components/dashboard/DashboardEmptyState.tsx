"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Inbox, 
  UploadCloud, 
  FilePlus, 
  ArrowRight, 
  Chrome, 
  Sparkles,
  Target,
  TrendingUp,
  Briefcase,
  CheckCircle
} from "lucide-react";
import { ExtensionIntegration } from "@/components/dashboard/ExtensionIntegration";
import { slideInUp, scaleIn, fadeIn } from "@/styles/animations";

interface DashboardEmptyStateProps {
  onImportJobs: () => void;
  onAddJob: () => void;
  onAddApplication: () => void;
  userRecord?: any;
}

export function DashboardEmptyState({
  onImportJobs,
  onAddJob,
  onAddApplication,
  userRecord,
}: DashboardEmptyStateProps) {
  return (
    <motion.div
      variants={slideInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Main Empty State Card */}
      <motion.div
        variants={slideInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="rounded-2xl bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/50 dark:from-background dark:via-emerald-950/20 dark:to-teal-950/20 p-8 md:p-12 text-center shadow-xl border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 dark:from-blue-800/10 dark:to-cyan-800/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 shadow-xl shadow-emerald-500/25"
            >
              <Briefcase className="h-10 w-10 text-white" />
            </motion.div>
            
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
            >
              <Badge className="mt-6 mb-4 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
                <Sparkles className="h-3 w-3 mr-1" />
                Get Started
              </Badge>
            </motion.div>
            
            <motion.h3
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent"
            >
              Start Your Job Search Journey
            </motion.h3>
            
            <motion.p
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.35 }}
              className="mt-3 text-base text-muted-foreground max-w-lg mx-auto"
            >
              Import jobs from the browser extension, add them manually, or upload a CSV file to begin tracking your applications.
            </motion.p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={onImportJobs}
                  size="lg"
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 gap-2"
                >
                  <Chrome className="h-5 w-5" />
                  Import from Extension
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={onAddJob}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 dark:hover:from-blue-900/70 dark:hover:to-indigo-900/70 text-blue-800 dark:text-blue-200 border-0 gap-2"
                >
                  <FilePlus className="h-5 w-5" />
                  Add Job Manually
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={onAddApplication}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 gap-2"
                >
                  Track Application
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        variants={slideInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Feature 1 - Extension */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Chrome className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">Browser Extension</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Save jobs with one click from LinkedIn, Indeed, Glassdoor, and more.
          </p>
        </div>

        {/* Feature 2 - Tracking */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Smart Tracking</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Track application status, interviews, and follow-ups in one place.
          </p>
        </div>

        {/* Feature 3 - Analytics */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">Analytics</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Get insights on your job search progress and success rates.
          </p>
        </div>
      </motion.div>

      {/* Extension Integration Card */}
      {userRecord && (
        <motion.div
          variants={slideInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <ExtensionIntegration userId={userRecord._id} />
        </motion.div>
      )}
    </motion.div>
  );
}