"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FeatureGate } from "../../components/UpgradePrompt";
import { CvUploadForm } from "../../components/CvUploadForm";
import { CvAnalysisHistory } from "../../components/CvAnalysisHistory";
import { motion } from "framer-motion";
import { useApiQuery } from "../../hooks/useApi";
import { cvEvaluatorApi } from "../../utils/api/cvEvaluator";

export default function CvEvaluatorPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");

  const userRecord = useApiQuery(
    () => user ? cvEvaluatorApi.getUserByClerkId(user.id) : Promise.reject(new Error("No user")),
    [user?.id]
  ).data;

  const cvAnalyses = useApiQuery(
    () => userRecord ? cvEvaluatorApi.getUserCvAnalyses(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  ).data;

  const cvStats = useApiQuery(
    () => userRecord ? cvEvaluatorApi.getCvAnalysisStats(userRecord._id) : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  ).data;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please sign in to access the CV evaluator
          </h2>
          <p className="text-gray-600">
            Get AI-powered insights to improve your CV
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">CV Evaluator 📄</h1>
              <p className="mt-2 text-blue-100">
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Total Analyses
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {cvStats.totalAnalyses}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Completed
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {cvStats.completedAnalyses}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Average Score
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {cvStats.averageScore}/100
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Latest Score
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {cvStats.recentAnalysis?.overallScore || "N/A"}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white shadow-lg rounded-xl overflow-hidden"
          >
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "upload"
                      ? "border-blue-500 text-blue-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>📤</span>
                    Upload & Analyze
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "history"
                      ? "border-blue-500 text-blue-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>📜</span>
                    Analysis History
                  </span>
                </button>
              </nav>
            </div>

            <div className="p-8">
              {activeTab === "upload" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Pro Tip
                    </h3>
                    <p className="text-sm text-blue-700">
                      Upload your CV in PDF format for best results. Our AI will
                      analyze keywords, formatting, and ATS compatibility.
                    </p>
                  </div>
                  <CvUploadForm userId={user.id} />
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <CvAnalysisHistory analyses={cvAnalyses || []} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </FeatureGate>
      </div>
    </div>
  );
}
