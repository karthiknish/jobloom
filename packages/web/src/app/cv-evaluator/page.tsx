"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FeatureGate } from "../../components/UpgradePrompt";
import { CvUploadForm } from "../../components/CvUploadForm";
import { CvAnalysisHistory } from "../../components/CvAnalysisHistory";
import { motion } from "framer-motion";
import { useApiQuery } from "../../hooks/useApi";
import { cvEvaluatorApi } from "../../utils/api/cvEvaluator";
import {
  FileText,
  BarChart3,
  Star,
  Search,
  Target,
  Upload,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CvEvaluatorPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");

  const userRecord = useApiQuery(
    () =>
      user
        ? cvEvaluatorApi.getUserByClerkId(user.id)
        : Promise.reject(new Error("No user")),
    [user?.id]
  ).data;

  const cvAnalyses = useApiQuery(
    () =>
      userRecord
        ? cvEvaluatorApi.getUserCvAnalyses(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  ).data;

  const cvStats = useApiQuery(
    () =>
      userRecord
        ? cvEvaluatorApi.getCvAnalysisStats(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  ).data;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Please sign in to access the CV evaluator</CardTitle>
            <CardDescription>
              Get AI-powered insights to improve your CV
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex items-start sm:items-center justify-between"
          >
            <div className="flex items-start sm:items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                whileHover={{ scale: 1.05 }}
                className="h-12 w-12 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center"
              >
                <FileText className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="text-3xl font-bold text-white"
                >
                  CV Evaluator
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  className="mt-2 text-primary-foreground/80"
                >
                  Get AI-powered insights to improve your CV and increase your
                  chances of landing interviews
                </motion.p>
              </div>
            </div>
          </motion.div>

          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          {/* Stats Cards */}
          {cvStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
            >
              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Analyses
                    </CardTitle>
                    <div className="bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cvStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      CVs analyzed
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg. Score
                    </CardTitle>
                    <div className="bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.averageScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall improvement
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Keywords
                    </CardTitle>
                    <div className="bg-secondary/20 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.averageKeywords}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. per analysis
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Success Rate
                    </CardTitle>
                    <div className="bg-yellow-100 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cvStats.successRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Improvement potential
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="relative grid grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6 w-[min(360px,100%)]">
            <motion.div
              className="absolute top-1 bottom-1 left-1 w-1/2 rounded-md bg-white shadow"
              animate={{ x: activeTab === "upload" ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            />
            <button
              onClick={() => setActiveTab("upload")}
              className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "upload"
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Upload className="h-4 w-4" /> Upload CV
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "history"
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex w-fit items-center gap-2 whitespace-nowrap">
                <History className="h-4 w-4" /> Analysis History
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "upload" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CvUploadForm userId={userRecord?._id || ""} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CvAnalysisHistory analyses={cvAnalyses || []} />
            </motion.div>
          )}
        </FeatureGate>
      </div>
    </div>
  );
}
