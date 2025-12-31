"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Search,
  Zap,
  CheckCircle,
  Briefcase,
  Target,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCvAnalysisTitle } from "@/utils/cvAnalysisTitle";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { showSuccess } from "@/components/ui/Toast";
import { themeColors, themeUtils } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";
import type { CvAnalysis } from "../types/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      showSuccess("Please select at least 2 Resume analyses to compare");
      return;
    }
    setCurrentView("comparison");
  };

  const compareAll = () => {
    const top3 = [...analyses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(a => a._id);
    setSelectedAnalyses(top3);
    setCurrentView("comparison");
  };

  const clearSelection = () => setSelectedAnalyses([]);

  if (currentView === "selection") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to History
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Compare Your Analysis</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium italic">Identify improvements over time</p>
          </div>
          <div className="w-20" />
        </div>

        <Card className="shadow-xl border-muted/40 overflow-hidden">
          <CardHeader className="bg-muted/10 border-b pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Select CVs for Side-by-Side Comparison
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                    Selected: {selectedAnalyses.length}/3
                  </Badge>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="p-1 bg-muted rounded-full cursor-help">
                          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-xs font-normal">
                        Comparison is limited to 3 items to ensure optimal readability and meaningful side-by-side analysis.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelection}
                  disabled={selectedAnalyses.length === 0}
                  className="text-xs h-9"
                >
                  Clear All
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={compareAll}
                  className="text-xs h-9 gap-2"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Compare Top 3
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {analyses.map((analysis) => {
                const isSelected = selectedAnalyses.includes(analysis._id);
                return (
                  <motion.div
                    key={analysis._id}
                    className={cn(
                      "p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 relative group",
                      isSelected
                        ? "border-primary bg-primary/[0.03] shadow-md ring-4 ring-primary/5"
                        : "border-muted hover:border-primary/40 hover:bg-muted/30"
                    )}
                    onClick={() => handleSelectAnalysis(analysis._id)}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}>
                        {isSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                              {getCvAnalysisTitle(analysis as any)}
                            </h4>
                            <Badge
                              variant={
                                analysis.analysisStatus === "completed" ? "default" :
                                analysis.analysisStatus === "processing" ? "secondary" :
                                "destructive"
                              }
                              className="text-xxs px-2 h-5 font-bold uppercase tracking-wider"
                            >
                              {analysis.analysisStatus}
                            </Badge>
                          </div>
                          {analysis.overallScore && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border">
                              <span className="text-xs font-bold text-muted-foreground uppercase">Score</span>
                              <span className={cn("font-bold text-base", themeUtils.scoreColor(analysis.overallScore))}>
                                {analysis.overallScore}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3" />
                            {new Date(analysis.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          {analysis.atsCompatibility && (
                            <span className="flex items-center gap-1.5 text-blue-600">
                              <Target className="h-3 w-3" />
                              ATS: {analysis.atsCompatibility.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <p className="text-xs text-muted-foreground max-w-[300px]">
                Comparing different versions helps you track progress and see which adjustments yield better ATS scores.
              </p>
              <Button
                onClick={startComparison}
                disabled={selectedAnalysisData.length < 2}
                className="h-12 px-8 text-base font-bold gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all text-white"
              >
                Start Comparison ({selectedAnalysisData.length})
                <ChevronRight className="h-5 w-5 ml-1" />
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
          <CardTitle className="flex items-center font-bold text-lg">
            <BarChart3 className="h-5 w-5 mr-3 text-primary" />
            Overall Scores Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {selectedAnalysisData.map((analysis, index) => (
              <div key={analysis._id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{getCvAnalysisTitle(analysis as any)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Date(analysis.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                    <Badge variant="outline" className={cn("px-3 border-2 font-bold", themeUtils.scoreColor(analysis.overallScore || 0))}>
                      {analysis.overallScore || 0}/100
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={analysis.overallScore || 0}
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedAnalysisData.map((analysis, index) => (
          <Card key={analysis._id} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle className="text-lg font-bold">{getCvAnalysisTitle(analysis as any)}</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("border-2 font-bold px-3 py-0.5", themeUtils.scoreColor(analysis.overallScore || 0))}>
                  Total Score: {analysis.overallScore || 0}/100
                </Badge>
                <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
                  {new Date(analysis.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Strengths */}
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="space-y-3">
                  <h4 className={cn("font-bold text-xxs uppercase tracking-widest flex items-center gap-2", themeColors.success.text)}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Key Strengths
                  </h4>
                  <ul className="text-sm space-y-2">
                    {analysis.strengths.slice(0, 3).map((strength, i) => (
                      <li key={i} className="flex items-start bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                        <span className={cn("mr-2 mt-0.5 text-emerald-500")}>•</span>
                        <span className="text-emerald-900 font-medium">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div className="space-y-3">
                  <h4 className={cn("font-bold text-xxs uppercase tracking-widest flex items-center gap-2", themeColors.error.text)}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Areas to Improve
                  </h4>
                  <ul className="text-sm space-y-2">
                    {analysis.weaknesses.slice(0, 3).map((weakness, i) => (
                      <li key={i} className="flex items-start bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                        <span className={cn("mr-2 mt-0.5 text-rose-500")}>•</span>
                        <span className="text-rose-900 font-medium">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ATS Score */}
              {analysis.atsCompatibility && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className={cn("font-bold text-xxs uppercase tracking-widest flex items-center gap-2", themeColors.primary.text)}>
                    <Target className="h-3.5 w-3.5" />
                    ATS Optimization
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Progress
                        value={analysis.atsCompatibility.score}
                        className="h-3"
                      />
                    </div>
                    <Badge className="font-bold bg-blue-600">
                      {analysis.atsCompatibility.score}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Keyword Analysis */}
              {analysis.keywordAnalysis && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className={cn("font-bold text-xxs uppercase tracking-widest flex items-center gap-2", themeColors.info.text)}>
                    <Search className="h-3.5 w-3.5" />
                    Keywords Found
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.keywordAnalysis.presentKeywords?.slice(0, 5).map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xxs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-100">
                        {keyword}
                      </Badge>
                    ))}
                    {analysis.keywordAnalysis.presentKeywords &&
                     analysis.keywordAnalysis.presentKeywords.length > 5 && (
                      <Badge variant="outline" className="text-xxs px-2 py-0.5">
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
      <Card className="bg-gradient-to-br from-muted/50 to-muted shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center font-bold text-lg">
            <TrendingUp className="h-5 w-5 mr-3 text-primary" />
            Comparison Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const sortedAnalyses = [...selectedAnalysisData].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );

              const firstScore = sortedAnalyses[0]?.overallScore || 0;
              const lastScore = sortedAnalyses[sortedAnalyses.length - 1]?.overallScore || 0;
              const improvement = lastScore - firstScore;

              return (
                <div className="flex items-center justify-between p-6 bg-white/50 backdrop-blur-sm rounded-2xl border shadow-sm">
                  <div>
                    <p className="font-bold text-lg text-foreground mb-1">Overall Progress</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Comparing oldest vs newest selection
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xxs uppercase tracking-widest font-bold text-muted-foreground mb-1">Delta</p>
                      <div className="flex items-center gap-2 justify-end">
                        {improvement > 0 && <TrendingUp className={cn("h-5 w-5", themeColors.success.icon)} />}
                        {improvement < 0 && <TrendingDown className={cn("h-5 w-5", themeColors.error.icon)} />}
                        {improvement === 0 && <Minus className="h-5 w-5 text-muted-foreground" />}
                        <span className={cn("text-2xl font-black",
                          improvement > 0 ? themeColors.success.text :
                          improvement < 0 ? themeColors.error.text : 'text-muted-foreground'
                        )}>
                          {improvement > 0 ? '+' : ''}{improvement}
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-border mx-2" />
                    <div>
                      <p className="text-xxs uppercase tracking-widest font-bold text-muted-foreground mb-1">Range</p>
                      <p className="text-xl font-bold">{firstScore} → {lastScore}</p>
                    </div>
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
