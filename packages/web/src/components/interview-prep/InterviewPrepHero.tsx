"use client";

import { motion } from "framer-motion";

export default function InterviewPrepHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-xl"
    >
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Interview Preparation</h1>
            <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Master your interview skills with AI-powered practice and comprehensive preparation tools
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
