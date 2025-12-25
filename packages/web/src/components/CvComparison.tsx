"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCvAnalysisTitle } from "@/utils/cvAnalysisTitle";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess } from "@/components/ui/Toast";
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";
import type { CvAnalysis } from "../types/api";

interface CvComparisonProps {
  analyses: CvAnalysis[];
  onBack: () => void;
}

export function CvComparison({ analyses, onBack }: CvComparisonProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<"selection" | "comparison">("selection");

  const handleSelectAnalysis = (analysisId: string) => {
    setSelectedAnalyses(prev =>
      prev.includes(analysisId)
        ? prev.filter(id => id !== analysisId)
        : prev.length < 3
          ? [...prev, analysisId]
          : prev
    );
  };

  const selectedAnalysisData = analyses.filter(analysis =>
    selectedAnalyses.includes(analysis._id)
  );

  const startComparison = () => {
    if (selectedAnalysisData.length < 2) {
      showSuccess("Please select at least 2 CV analyses to compare");
      return;
    }
    setCurrentView("comparison");
  };

  if (currentView === "selection") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary hover:text-primary/80"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to History
          </Button>
          <h2 className="text-xl font-semibold">Select CVs to Compare</h2>
          <div className="w-20" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Select up to 3 CV analyses to compare their scores, strengths, and improvements over time.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {selectedAnalyses.length}/3
              </p>
            </div>

            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {analyses.map((analysis) => (
                <motion.div
                  key={analysis._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnalyses.includes(analysis._id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handleSelectAnalysis(analysis._id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedAnalyses.includes(analysis._id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{getCvAnalysisTitle(analysis as any)}</h4>
                        <Badge
                          variant={
                            analysis.analysisStatus === "completed" ? "default" :
                            analysis.analysisStatus === "processing" ? "secondary" :
                            "destructive"
                          }
                        >
                          {analysis.analysisStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                        {analysis.overallScore && ` • Score: ${analysis.overallScore}/100`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={startComparison}
                disabled={selectedAnalysisData.length < 2}
                className="min-w-32"
              >
                Compare CVs ({selectedAnalysisData.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Comparison View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("selection")}
          className="text-primary hover:text-primary/80"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Selection
        </Button>
        <h2 className="text-xl font-semibold">CV Comparison</h2>
        <div className="w-20" />
      </div>

      {/* Overall Scores Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Overall Scores Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {selectedAnalysisData.map((analysis, index) => (
              <div key={analysis._id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{getCvAnalysisTitle(analysis as any)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">
                      {analysis.overallScore || 0}/100
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={analysis.overallScore || 0}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedAnalysisData.map((analysis, index) => (
          <Card key={analysis._id}>
            <CardHeader>
              <CardTitle className="text-lg">{getCvAnalysisTitle(analysis as any)}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Score: {analysis.overallScore || 0}/100
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strengths */}
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div>
                  <h4 className={cn("font-medium mb-2", themeColors.success.text)}>Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {analysis.strengths.slice(0, 3).map((strength, i) => (
                      <li key={i} className="flex items-start">
                        <span className={cn("mr-2 mt-1", themeColors.success.icon)}>•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div>
                  <h4 className={cn("font-medium mb-2 flex items-center gap-2", themeColors.error.text)}>
                    <AlertTriangle className="h-4 w-4" />
                    Areas for Improvement
                  </h4>
                  <ul className="text-sm space-y-1">
                    {analysis.weaknesses.slice(0, 3).map((weakness, i) => (
                      <li key={i} className="flex items-start">
                        <span className={cn("mr-2 mt-1", themeColors.error.icon)}>•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ATS Score */}
              {analysis.atsCompatibility && (
                <div>
                  <h4 className={cn("font-medium mb-2", themeColors.primary.text)}>ATS Compatibility</h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={analysis.atsCompatibility.score}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-medium">
                      {analysis.atsCompatibility.score}/100
                    </span>
                  </div>
                </div>
              )}

              {/* Keyword Analysis */}
              {analysis.keywordAnalysis && (
                <div>
                  <h4 className={cn("font-medium mb-2 flex items-center gap-2", themeColors.info.text)}>
                    <Search className="h-4 w-4" />
                    Keywords
                  </h4>
                  <div className="flex gap-1 flex-wrap">
                    {analysis.keywordAnalysis.presentKeywords?.slice(0, 5).map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {analysis.keywordAnalysis.presentKeywords &&
                     analysis.keywordAnalysis.presentKeywords.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{analysis.keywordAnalysis.presentKeywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Improvement Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Improvement Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const sortedAnalyses = [...selectedAnalysisData].sort(
                (a, b) => a.createdAt - b.createdAt
              );

              const firstScore = sortedAnalyses[0]?.overallScore || 0;
              const lastScore = sortedAnalyses[sortedAnalyses.length - 1]?.overallScore || 0;
              const improvement = lastScore - firstScore;

              return (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Overall Progress</p>
                    <p className="text-sm text-muted-foreground">
                      From {firstScore} to {lastScore} points
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {improvement > 0 && <TrendingUp className={cn("h-5 w-5", themeColors.success.icon)} />}
                    {improvement < 0 && <TrendingDown className={cn("h-5 w-5", themeColors.error.icon)} />}
                    {improvement === 0 && <Minus className="h-5 w-5 text-muted-foreground" />}
                    <span className={cn("font-bold",
                      improvement > 0 ? themeColors.success.text :
                      improvement < 0 ? themeColors.error.text : 'text-muted-foreground'
                    )}>
                      {improvement > 0 ? '+' : ''}{improvement} points
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
