"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CvAnalysisResults } from "./CvAnalysisResults";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { CvAnalysis, Id } from "../types/convex";
import { useApiMutation } from "../hooks/useApi";
import { cvEvaluatorApi } from "../utils/api/cvEvaluator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "processing": return "default";
      case "completed": return "default";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "processing": return "Processing";
      case "completed": return "Completed";
      case "failed": return "Failed";
      default: return "Pending";
    }
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowResults(false)}
            className="text-primary hover:text-primary/80"
          >
            ← Back to History
          </Button>
        </div>
        <CvAnalysisResults analysis={selectedAnalysis} />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No CV analyses yet
        </h3>
        <p className="text-muted-foreground mb-6">
          Upload your first CV to get started with AI-powered analysis and
          feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Analysis History</h3>
        <span className="text-sm text-muted-foreground">
          {analyses.length} total analyses
        </span>
      </div>

      <div className="space-y-4">
        {analyses.map((analysis) => (
          <Card key={analysis._id}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="text-lg font-medium text-foreground truncate">
                      {analysis.fileName}
                    </h4>
                    <Badge variant={getStatusVariant(analysis.analysisStatus)}>
                      {getStatusLabel(analysis.analysisStatus)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
                            <span className={
                              analysis.atsCompatibility.score >= 80 
                                ? "text-green-600" 
                                : analysis.atsCompatibility.score >= 60 
                                  ? "text-yellow-600" 
                                  : "text-red-600"
                            }>
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
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAnalysis(analysis._id)}
                    title="Delete Analysis"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {analysis.analysisStatus === "processing" && (
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
        ))}
      </div>

      {analyses.length > 5 && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {analyses.length} analyses. Older analyses are automatically
            archived after 90 days.
          </p>
        </div>
      )}
    </div>
  );
}
