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
        <div className="rounded-2xl bg-card p-8 md:p-12 text-center shadow-lg border border-border relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-muted/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-muted/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg"
            >
              <Briefcase className="h-10 w-10 text-white" />
            </motion.div>
            
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
            >
              <Badge className="mt-6 mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Get Started
              </Badge>
            </motion.div>
            
            <motion.h3
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground"
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
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:from-emerald-700 hover:to-teal-700 text-white border-0 gap-2"
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
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 gap-2"
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
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 border-border hover:border-emerald-300 hover:bg-primary/10/50 gap-2"
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
        <div className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <Chrome className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="font-semibold text-foreground">Browser Extension</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Save jobs with one click from LinkedIn, Indeed, Glassdoor, and more.
          </p>
        </div>

        {/* Feature 2 - Tracking */}
        <div className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="font-semibold text-foreground">Smart Tracking</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Track application status, interviews, and follow-ups in one place.
          </p>
        </div>

        {/* Feature 3 - Analytics */}
        <div className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="font-semibold text-foreground">Analytics</h4>
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