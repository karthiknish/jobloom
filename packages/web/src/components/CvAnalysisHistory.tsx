"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CvAnalysisResults } from "./CvAnalysisResults";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { CvAnalysis, Id } from "../types/convex";
import { useApiMutation } from "../hooks/useApi";
import { cvEvaluatorApi } from "../utils/api/cvEvaluator";

interface CvAnalysisHistoryProps {
  analyses: CvAnalysis[];
}

export function CvAnalysisHistory({ analyses }: CvAnalysisHistoryProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<CvAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { mutate: deleteAnalysis } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { analysisId } = variables;
      return cvEvaluatorApi.deleteCvAnalysis(analysisId as string);
    }
  );

  const handleViewAnalysis = (analysis: CvAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowResults(true);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) {
      return;
    }

    try {
      await deleteAnalysis({ analysisId: analysisId as Id<"cvAnalyses"> });
      toast.success("Analysis deleted successfully");
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast.error("Failed to delete analysis");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      failed: { color: "bg-red-100 text-red-800", label: "Failed" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (showResults && selectedAnalysis) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowResults(false)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Back to History
          </button>
        </div>
        <CvAnalysisResults analysis={selectedAnalysis} />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No CV analyses yet
        </h3>
        <p className="text-gray-600 mb-6">
          Upload your first CV to get started with AI-powered analysis and
          feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Analysis History</h3>
        <span className="text-sm text-gray-500">
          {analyses.length} total analyses
        </span>
      </div>

      <div className="space-y-4">
        {analyses.map((analysis) => (
          <div
            key={analysis._id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {analysis.fileName}
                  </h4>
                  {getStatusBadge(analysis.analysisStatus)}
                </div>

                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {format(
                      new Date(analysis.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </span>
                  <span>•</span>
                  <span>{(analysis.fileSize / 1024).toFixed(1)} KB</span>
                  {analysis.overallScore && (
                    <>
                      <span>•</span>
                      <span
                        className={`font-medium ${getScoreColor(analysis.overallScore)}`}
                      >
                        Score: {analysis.overallScore}/100
                      </span>
                    </>
                  )}
                </div>

                {analysis.analysisStatus === "failed" &&
                  analysis.errorMessage && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {analysis.errorMessage}
                    </div>
                  )}

                {analysis.analysisStatus === "completed" &&
                  analysis.strengths && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Key strengths:</span>{" "}
                        {analysis.strengths.slice(0, 2).join(", ")}
                        {analysis.strengths.length > 2 && "..."}
                      </p>
                    </div>
                  )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {analysis.analysisStatus === "completed" && (
                  <button
                    onClick={() => handleViewAnalysis(analysis)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                    title="View Analysis"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteAnalysis(analysis._id)}
                  className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm text-red-600 bg-white hover:bg-red-50"
                  title="Delete Analysis"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {analysis.analysisStatus === "processing" && (
              <div className="mt-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Analyzing your CV...
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {analyses.length > 5 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing {analyses.length} analyses. Older analyses are automatically
            archived after 90 days.
          </p>
        </div>
      )}
    </div>
  );
}
