"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CvAnalysisResults } from "./CvAnalysisResults";
import { CvComparison } from "./CvComparison";
import { CvAnalysisFilters } from "./CvAnalysisFilters";
import { motion } from "framer-motion";
import { Eye, Trash2, Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { showSuccess, showError } from "@/components/ui/Toast";
import type { CvAnalysis, Id } from "../types/api";
import { useApiMutation } from "../hooks/useApi";
import { cvEvaluatorApi } from "../utils/api/cvEvaluator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CvAnalysisHistoryProps {
  analyses: CvAnalysis[];
}

export function CvAnalysisHistory({ analyses }: CvAnalysisHistoryProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<CvAnalysis | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [filteredAnalyses, setFilteredAnalyses] =
    useState<CvAnalysis[]>(analyses);

  // Update filtered analyses when analyses prop changes
  useEffect(() => {
    setFilteredAnalyses(analyses);
  }, [analyses]);

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
      showSuccess("Analysis deleted successfully");
    } catch (error) {
      console.error("Error deleting analysis:", error);
      showError("Failed to delete analysis");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (showComparison) {
    return (
      <CvComparison
        analyses={analyses}
        onBack={() => setShowComparison(false)}
      />
    );
  }

  if (showResults && selectedAnalysis) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResults(false)}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
          </Button>
        </div>
        <CvAnalysisResults analysis={selectedAnalysis} />
      </div>
    );
  }

  if (!filteredAnalyses || filteredAnalyses.length === 0) {
    const hasOriginalAnalyses = analyses && analyses.length > 0;
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-4xl mb-4">
          {hasOriginalAnalyses ? "🔍" : "📄"}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {hasOriginalAnalyses
            ? "No analyses match your filters"
            : "No CV analyses yet"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {hasOriginalAnalyses
            ? "Try adjusting your search criteria or clearing filters to see more results."
            : "Upload your first CV to get started with AI-powered analysis and feedback."}
        </p>
        {!hasOriginalAnalyses && (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">✨ Get detailed insights about your CV:</p>
            <ul className="text-left space-y-1">
              <li>• ATS compatibility scores</li>
              <li>• Keyword optimization suggestions</li>
              <li>• Skills and experience analysis</li>
              <li>• Professional summary improvements</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Analysis History
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filteredAnalyses.length} of {analyses.length} analyses
          </span>
          {analyses.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Compare CVs
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <CvAnalysisFilters
        analyses={analyses}
        onFilteredAnalyses={setFilteredAnalyses}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 1 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
          },
        }}
        className="space-y-4"
      >
        {filteredAnalyses.map((analysis) => (
          <motion.div
            key={analysis._id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="text-lg font-medium text-foreground truncate">
                        {analysis.fileName}
                      </h4>
                      <Badge
                        variant={getStatusVariant(analysis.analysisStatus)}
                      >
                        {getStatusLabel(analysis.analysisStatus)}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {format(
                          new Date(analysis.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                      <span>•</span>
                      {typeof analysis.fileSize === "number" && (
                        <span>{(analysis.fileSize / 1024).toFixed(1)} KB</span>
                      )}
                      {analysis.overallScore && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-medium ${getScoreColor(
                              analysis.overallScore
                            )}`}
                          >
                            Score: {analysis.overallScore}/100
                          </span>
                        </>
                      )}
                    </div>

                    {analysis.analysisStatus === "failed" &&
                      analysis.errorMessage && (
                        <div className="mt-2 text-sm text-destructive">
                          Error: {analysis.errorMessage}
                        </div>
                      )}

                    {analysis.analysisStatus === "completed" &&
                      analysis.strengths && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium">Key strengths:</span>{" "}
                            {analysis.strengths.slice(0, 2).join(", ")}
                            {analysis.strengths.length > 2 && "..."}
                          </p>
                          {analysis.atsCompatibility && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">ATS Score:</span>{" "}
                              <span
                                className={
                                  analysis.atsCompatibility.score >= 80
                                    ? "text-green-600"
                                    : analysis.atsCompatibility.score >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }
                              >
                                {analysis.atsCompatibility.score}/100
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {analysis.analysisStatus === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnalysis(analysis)}
                        title="View Analysis"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnalysis(analysis._id)}
                      title="Delete Analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {analysis.analysisStatus === "processing" && (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Analyzing your CV...
                      </span>
                    </div>
                    <div className="mt-2 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredAnalyses.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground">
            Showing {analyses.length} analyses. Older analyses are automatically
            archived after 90 days.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
