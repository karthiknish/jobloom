"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CvAnalysisResults } from "./CvAnalysisResults";
import { CvComparison } from "./CvComparison";
import { CvAnalysisFilters } from "./CvAnalysisFilters";
import { motion } from "framer-motion";
import { Eye, Trash2, ArrowLeft, BarChart3, Search, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";
import type { CvAnalysis, Id } from "../types/api";
import { useEnhancedApi } from "../hooks/useEnhancedApi";
import { cvEvaluatorApi } from "../utils/api/cvEvaluator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge, getScoreBadgeVariant, getScoreBadgeLabel } from "@/components/ui/StatusBadge";
import { getCvAnalysisTitle } from "@/utils/cvAnalysisTitle";

interface CvAnalysisHistoryProps {
  analyses: CvAnalysis[];
  optimistic?: CvAnalysis | null; // show while waiting for server
}

export function CvAnalysisHistory({ analyses, optimistic }: CvAnalysisHistoryProps) {
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<CvAnalysis | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [filteredAnalyses, setFilteredAnalyses] =
    useState<CvAnalysis[]>(analyses || []);

  // Update filtered analyses when analyses prop changes
  // Update when real analyses change
  useEffect(() => {
    setFilteredAnalyses(analyses || []);
  }, [analyses]);

  // Overlay optimistic placeholder only while there are no real analyses
  useEffect(() => {
    const realAnalyses = analyses || [];
    if (realAnalyses.length === 0 && optimistic) {
      setFilteredAnalyses([optimistic]);
    } else if (realAnalyses.length > 0 && optimistic && filteredAnalyses.some(a => a._id === optimistic._id)) {
      // Remove optimistic placeholder when real analyses arrive
      setFilteredAnalyses(realAnalyses);
    }
  }, [optimistic, analyses, filteredAnalyses]);

  const { execute: deleteAnalysis } = useEnhancedApi(
    async (variables: Record<string, unknown>) => {
      const { analysisId } = variables;
      return cvEvaluatorApi.deleteCvAnalysis(analysisId as string);
    },
    { immediate: false }
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
      toast({
        title: "Success",
        description: "Analysis deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive",
      });
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
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-amber-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-primary/20 text-primary";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    if (score >= 40) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const formatCreatedAt = (value: unknown): string | null => {
    try {
      let date: Date | null = null;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === "number" || typeof value === "string") {
        const normalizedValue =
          typeof value === "string" && /^\d+$/.test(value)
            ? Number(value)
            : value;

        const d = new Date(normalizedValue as any);
        date = Number.isNaN(d.getTime()) ? null : d;
      } else if (value && typeof value === "object") {
        const anyVal = value as any;
        if (typeof anyVal.toDate === "function") {
          const d = anyVal.toDate();
          date = d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
        } else if (typeof anyVal.toMillis === "function") {
          const d = new Date(anyVal.toMillis());
          date = Number.isNaN(d.getTime()) ? null : d;
        } else {
          const seconds =
            typeof anyVal.seconds === "number"
              ? anyVal.seconds
              : typeof anyVal._seconds === "number"
                ? anyVal._seconds
                : null;
          const nanos =
            typeof anyVal.nanoseconds === "number"
              ? anyVal.nanoseconds
              : typeof anyVal._nanoseconds === "number"
                ? anyVal._nanoseconds
                : 0;

          if (typeof seconds === "number") {
            const millis = seconds * 1000 + Math.floor(nanos / 1_000_000);
            const d = new Date(millis);
            date = Number.isNaN(d.getTime()) ? null : d;
          }
        }
      }

      if (!date) return null;
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return null;
    }
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
    const realAnalyses = analyses || [];
    const hasOriginalAnalyses = (realAnalyses && realAnalyses.length > 0) || !!optimistic;
    const hasOptimisticOnly = !realAnalyses.length && !!optimistic;
    return (
        <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          {hasOriginalAnalyses ? <Search className="h-12 w-12 mx-auto" /> : <FileText className="h-12 w-12 mx-auto" />}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {hasOriginalAnalyses
            ? hasOptimisticOnly
              ? "Preparing first analysis..."
              : "No analyses match your filters"
            : "No CV analyses yet"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {hasOriginalAnalyses
            ? hasOptimisticOnly
              ? "Your CV is being processed. This will update automatically."
              : "Try adjusting your search criteria or clearing filters to see more results."
            : "Upload your first CV to get started with AI-powered analysis and feedback."}
        </p>
        {!hasOriginalAnalyses && (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Get detailed insights about your CV:
            </p>
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
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-foreground">
          Analysis History
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {filteredAnalyses.length} of {(analyses || []).length} analyses
          </span>
          {(analyses || []).length >= 2 && !optimistic && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Compare CVs
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters */}
      <CvAnalysisFilters
        analyses={analyses || []}
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
            whileHover={{ y: -2, scale: 1.01 }}
          >
            <Card className="shadow-sm border-border hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="text-lg font-medium text-foreground truncate">
                        {getCvAnalysisTitle(analysis as any)}
                      </h4>
                      <Badge
                        variant={getStatusVariant(analysis.analysisStatus || 'pending')}
                        className="text-xs"
                      >
                        {getStatusLabel(analysis.analysisStatus || 'pending')}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {(() => {
                        const items: React.ReactNode[] = [];
                        const createdAtLabel = formatCreatedAt(analysis.createdAt);
                        if (createdAtLabel) items.push(<span key="date">{createdAtLabel}</span>);
                        if (typeof analysis.fileSize === "number") {
                          items.push(
                            <span key="size">{(analysis.fileSize / 1024).toFixed(1)} KB</span>
                          );
                        }
                        if (analysis.overallScore) {
                          items.push(
                            <span key="score">
                              <ScoreBadge score={analysis.overallScore} />
                            </span>
                          );
                        }

                        return items.map((item, index) => (
                          <span key={index} className="inline-flex items-center gap-2">
                            {index > 0 && <span>•</span>}
                            {item}
                          </span>
                        ));
                      })()}
                    </div>

                    {analysis.analysisStatus === "failed" &&
                      analysis.errorMessage && (
                        <div className="mt-2 text-sm text-destructive bg-destructive/5 p-2 rounded">
                          Error: {analysis.errorMessage}
                        </div>
                      )}

                    {analysis.analysisStatus === "completed" &&
                      analysis.strengths && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium">Key strengths:</span>{" "}
                            {analysis.strengths.slice(0, 2).join(", ")}
                            {analysis.strengths.length > 2 && "..."}
                          </p>
                          {analysis.atsCompatibility && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">ATS:</span>
                              <ScoreBadge score={analysis.atsCompatibility.score} />
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {analysis.analysisStatus === "completed" && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAnalysis(analysis)}
                          title="View Analysis"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAnalysis(analysis._id)}
                        title="Delete Analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {analysis.analysisStatus === "processing" && (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <LoadingSpinner inline size="sm" label="Analyzing your CV..." />
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
          className="text-center pt-6"
        >
          <div className="bg-muted rounded-lg p-4 inline-block">
            <p className="text-sm text-muted-foreground">
              Showing {analyses.length} analyses. Older analyses are automatically
              archived after 90 days.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
