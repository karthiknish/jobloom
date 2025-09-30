"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Inbox, UploadCloud, FilePlus, ArrowRight } from "lucide-react";
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
      className="space-y-8"
    >
      <motion.div
        variants={slideInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="rounded-xl bg-gradient-to-br from-background via-sky-50/20 to-violet-50 p-12 text-center shadow-xl border border-border/50">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 shadow-lg"
          >
            <Inbox className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h3
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.25 }}
            className="mt-6 text-2xl font-bold bg-gradient-to-r from-foreground to-sky-900 bg-clip-text text-transparent"
          >
            No applications yet
          </motion.h3>
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="mt-3 text-base text-muted-foreground max-w-md mx-auto"
          >
            Get started by importing your jobs or adding a new one to begin tracking your job search journey.
          </motion.p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onImportJobs}
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-primary-foreground border-0"
              >
                <UploadCloud className="mr-2 h-5 w-5" /> Import Jobs
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onAddJob}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-violet-100 to-violet-200 hover:from-violet-200 hover:to-violet-300 text-violet-800 border-0"
              >
                <FilePlus className="mr-2 h-5 w-5" /> Add Job
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onAddApplication}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 border-border hover:border-border hover:bg-muted/50"
              >
                Add Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {userRecord && (
        <motion.div
          variants={slideInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
        >
          <ExtensionIntegration userId={userRecord._id} />
        </motion.div>
      )}
    </motion.div>
  );
}