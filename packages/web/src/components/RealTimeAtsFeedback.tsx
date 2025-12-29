"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateResumeScore } from "@/lib/ats";
import type { ResumeScore } from "@/lib/ats";
import type { ResumeData } from "@/types/resume";
import { AiFeedbackButtons } from "./shared/AiFeedbackButtons";
import { AtsRecommendationItem } from "@/lib/ats/types";
import { useConversionTracking } from "@/hooks/useConversionTracking";


interface RealTimeAtsFeedbackProps {
  resume: ResumeData;
  targetRole?: string;
  industry?: string;
  onFieldChange?: (field: string, value: string) => void;
  onScoreUpdate?: (score: ResumeScore) => void;
  showSuggestions?: boolean;
  compact?: boolean;
}

interface FeedbackItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  field?: string;
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export function RealTimeAtsFeedback({
  resume,
  targetRole,
  industry,
  onFieldChange,
  onScoreUpdate,
  showSuggestions = true,
  compact = false
}: RealTimeAtsFeedbackProps) {
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'suggestions'>('overview');
  const { trackSuggestionImplementation } = useConversionTracking();

  const analyzeResume = useCallback(() => {
    setIsAnalyzing(true);

    // Simulate processing time for better UX
    setTimeout(() => {
      const newScore = calculateResumeScore(resume, { targetRole, industry });
      setScore(newScore);

      if (onScoreUpdate) {
        onScoreUpdate(newScore);
      }

      // Generate real-time feedback
      const newFeedback = generateFeedback(newScore, resume);
      setFeedback(newFeedback);
      setIsAnalyzing(false);
    }, 300);
  }, [resume, targetRole, industry, onScoreUpdate]);

  const generateFeedback = (score: ResumeScore, resume: ResumeData): FeedbackItem[] => {
    const items: FeedbackItem[] = [];

    // Critical issues (high priority)
    if (score.criticalIssues && score.criticalIssues.length > 0) {
      score.criticalIssues.forEach((issue, index) => {
        items.push({
          id: `critical-${index}`,
          type: 'error',
          message: issue,
          impact: 'high',
          suggestion: 'Address this issue immediately to improve ATS performance'
        });
      });
    }

    // Strengths (positive feedback)
    if (score.strengths && score.strengths.length > 0) {
      score.strengths.forEach((strength, index) => {
        items.push({
          id: `strength-${index}`,
          type: 'success',
          message: strength,
          impact: 'low',
          suggestion: 'Great job! Keep this element in your resume'
        });
      });
    }

    // Keyword analysis
    if (score.detailedMetrics) {
      const { keywordDensity, actionVerbCount, quantifiedAchievements } = score.detailedMetrics;

      if (keywordDensity < 30) {
        items.push({
          id: 'keywords-low',
          type: 'warning',
          message: 'Low keyword diversity detected',
          impact: 'high',
          field: 'skills',
          suggestion: 'Add more industry-specific keywords relevant to your target role'
        });
      } else if (keywordDensity > 80) {
        items.push({
          id: 'keywords-high',
          type: 'info',
          message: 'High keyword density - ensure keywords are used naturally',
          impact: 'medium',
          suggestion: 'Review keyword placement to avoid keyword stuffing'
        });
      }

      if (actionVerbCount < 5) {
        items.push({
          id: 'action-verbs-low',
          type: 'warning',
          message: 'Low action verb usage',
          impact: 'high',
          field: 'experience',
          suggestion: 'Start bullet points with strong action verbs like "Led", "Developed", "Achieved"'
        });
      }

      if (quantifiedAchievements < 3) {
        items.push({
          id: 'metrics-low',
          type: 'warning',
          message: 'Limited quantifiable achievements',
          impact: 'high',
          field: 'experience',
          suggestion: 'Add specific metrics like "Increased sales by 25%" or "Managed team of 5"'
        });
      }
    }

    // Section completeness
    if (!resume.personalInfo.summary) {
      items.push({
        id: 'summary-missing',
        type: 'error',
        message: 'Professional summary is missing',
        impact: 'high',
        field: 'personalInfo.summary',
        suggestion: 'Add a 2-3 sentence summary highlighting your key qualifications and value'
      });
    }

    if (resume.experience.length === 0) {
      items.push({
        id: 'experience-missing',
        type: 'error',
        message: 'No work experience listed',
        impact: 'high',
        field: 'experience',
        suggestion: 'Add relevant work experience, including internships or volunteer work if applicable'
      });
    }

    // Sort by impact priority
    return items.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  useEffect(() => {
    if (autoRefresh) {
      analyzeResume();
    }
  }, [resume, targetRole, industry, autoRefresh, analyzeResume]);

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 80) return "bg-green-100";
    if (value >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getFeedbackIcon = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getFeedbackColor = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'success': return "text-green-600 bg-green-50 border-green-200";
      case 'warning': return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case 'error': return "text-red-600 bg-red-50 border-red-200";
      case 'info': return "text-info bg-info-soft border-info/20";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const detailedMetrics = score?.detailedMetrics;
  const recommendations = score?.recommendations;

  if (compact) {
    return (
      <div className="space-y-4">
        {score && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${getScoreBgColor(score.overall)} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${getScoreColor(score.overall)}`}>
                  {score.overall}
                </span>
              </div>
              <span className="text-sm font-medium">ATS Score</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeResume}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {feedback.filter(f => f.impact === 'high').slice(0, 2).map((item) => (
          <Alert key={item.id} className={getFeedbackColor(item.type)}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {item.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Score */}
        <Card data-tour="cv-score">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  ATS Optimization Score
                </CardTitle>
                <CardDescription>
                  Real-time analysis of your resume&apos;s ATS compatibility
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? "bg-blue-50" : ""}
                >
                  Auto-refresh: {autoRefresh ? "On" : "Off"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeResume}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {score && (
              <div className="space-y-4">
                {/* Overall Score Display */}
                <div className="flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full ${getScoreBgColor(score.overall)} flex items-center justify-center`}>
                    <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>
                      {score.overall}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown */}
                {score.breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Structure</div>
                      <div className={`text-lg font-semibold ${getScoreColor(score.breakdown.structure)}`}>
                        {score.breakdown.structure}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Keywords</div>
                      <div className={`text-lg font-semibold ${getScoreColor(score.breakdown.keywords)}`}>
                        {score.breakdown.keywords}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Impact</div>
                      <div className={`text-lg font-semibold ${getScoreColor(score.breakdown.impact)}`}>
                        {score.breakdown.impact}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Readability</div>
                      <div className={`text-lg font-semibold ${getScoreColor(score.breakdown.readability)}`}>
                        {score.breakdown.readability}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Optimization Feedback
              </CardTitle>
              <div className="flex gap-1">
                {(['overview', 'details', 'suggestions'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {feedback.filter(f => f.impact === 'high').map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${getFeedbackColor(item.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getFeedbackIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.message}</p>
                          {item.suggestion && (
                            <p className="text-xs mt-1 opacity-80">{item.suggestion}</p>
                          )}
                        </div>
                        <AiFeedbackButtons 
                          contentType="suggestion"
                          contentId={item.id}
                          context="real_time_ats_feedback_high"
                        />
                        {item.field && onFieldChange && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  onFieldChange?.(item.field!, item.suggestion!);
                                  trackSuggestionImplementation(item.id, 'rule', {
                                    message: item.message,
                                    suggestion: item.suggestion
                                  });
                                }}
                              >
                                <Zap className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Quick fix available</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {feedback.filter(f => f.impact === 'high').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">Great job! No critical issues detected.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'details' && detailedMetrics && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Content Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Word Count</span>
                          <span>{detailedMetrics.wordCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Keyword Density</span>
                          <span>{detailedMetrics.keywordDensity.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Action Verbs</span>
                          <span>{detailedMetrics.actionVerbCount}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Quality Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Quantified Achievements</span>
                          <span>{detailedMetrics.quantifiedAchievements}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Soft Skills</span>
                          <span>{detailedMetrics.softSkillCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sections Found</span>
                          <span>{detailedMetrics.sectionsFound.length}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'suggestions' && showSuggestions && recommendations && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {recommendations.high.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">High Priority</h4>
                      <div className="space-y-2">
                        {recommendations.high.map((suggestion, index) => (
                          <div key={`high-${index}`} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <p className="text-sm flex-1">{typeof suggestion === 'string' ? suggestion : suggestion.text}</p>
                            <AiFeedbackButtons 
                              contentType="suggestion"
                              contentId={typeof suggestion === 'string' ? `legacy-high-${index}` : suggestion.id}
                              context="real_time_ats_feedback_tab_high"
                              metadata={typeof suggestion === 'string' ? {} : suggestion.metadata}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.medium.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-yellow-600">Medium Priority</h4>
                      <div className="space-y-2">
                        {recommendations.medium.map((suggestion: string | AtsRecommendationItem, index: number) => (
                          <div key={`medium-${index}`} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                            <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <p className="text-sm flex-1">{typeof suggestion === 'string' ? suggestion : suggestion.text}</p>
                            <AiFeedbackButtons 
                              contentType="suggestion"
                              contentId={typeof suggestion === 'string' ? `legacy-medium-${index}` : suggestion.id}
                              context="real_time_ats_feedback_tab_medium"
                              metadata={typeof suggestion === 'string' ? {} : suggestion.metadata}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.low.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-blue-600">Low Priority</h4>
                      <div className="space-y-2">
                        {recommendations.low.map((suggestion: string | AtsRecommendationItem, index: number) => (
                          <div key={`low-${index}`} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <p className="text-sm flex-1">{typeof suggestion === 'string' ? suggestion : suggestion.text}</p>
                            <AiFeedbackButtons 
                              contentType="suggestion"
                              contentId={typeof suggestion === 'string' ? `legacy-low-${index}` : suggestion.id}
                              context="real_time_ats_feedback_tab_low"
                              metadata={typeof suggestion === 'string' ? {} : suggestion.metadata}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}