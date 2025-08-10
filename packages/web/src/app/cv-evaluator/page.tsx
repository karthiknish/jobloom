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
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">CV Evaluator 📄</h1>
              <p className="mt-2 text-primary-foreground/80">
                Get AI-powered insights to improve your CV and increase your
                chances of landing interviews
              </p>
            </div>
          </div>
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
                      <span className="text-blue-600 text-lg">📊</span>
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
                      <span className="text-green-600 text-lg">⭐</span>
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
                      <span className="text-secondary text-lg">🔍</span>
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
                      <span className="text-yellow-600 text-lg">🎯</span>
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
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "upload"
                  ? "bg-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Upload CV
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "history"
                  ? "bg-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Analysis History
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "upload" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CvUploadForm userId={userRecord?._id || ""} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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