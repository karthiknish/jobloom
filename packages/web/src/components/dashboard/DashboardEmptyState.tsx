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

            {/* Action Buttons - Focused hierarchy */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                onClick={onImportJobs}
                size="lg"
                className="motion-button w-full sm:w-auto shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 text-white border-0 gap-2 px-8"
              >
                <Chrome className="h-5 w-5" />
                Import from Extension
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>or</span>
                <button
                  onClick={onAddJob}
                  className="text-primary hover:underline font-medium"
                >
                  add a job manually
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Start Checklist */}
      <motion.div
        variants={slideInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.35 }}
        className="rounded-xl bg-card border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Quick Start Checklist</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Step 1: Upload CV */}
          <a 
            href="/career-tools" 
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <UploadCloud className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                Upload Your resume
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get ATS score & tips
              </p>
            </div>
          </a>
          
          {/* Step 2: Install Extension */}
          <button
            onClick={onImportJobs}
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Chrome className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-sm text-foreground group-hover:text-blue-600 transition-colors">
                Install Extension
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Save jobs with 1 click
              </p>
            </div>
          </button>
          
          {/* Step 3: Add First Job */}
          <button
            onClick={onAddJob}
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
              <FilePlus className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-sm text-foreground group-hover:text-green-600 transition-colors">
                Add First Job
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start tracking today
              </p>
            </div>
          </button>
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
            Track application status, offers, and follow-ups in one place.
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