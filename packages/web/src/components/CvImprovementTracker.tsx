"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Award,
  BarChart3,
  LineChart,
  Zap,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/ui/Sparkline";
import type { CvAnalysis } from "../types/api";

interface CvImprovementTrackerProps {
  analyses: CvAnalysis[];
}

export function CvImprovementTracker({ analyses }: CvImprovementTrackerProps) {
  const improvementData = useMemo(() => {
    if (!analyses || analyses.length === 0) return null;

    // Sort analyses by date
    const sortedAnalyses = [...analyses]
      .filter(a => a.analysisStatus === "completed")
      .sort((a, b) => a.createdAt - b.createdAt);

    if (sortedAnalyses.length < 2) return null;

    const firstAnalysis = sortedAnalyses[0];
    const latestAnalysis = sortedAnalyses[sortedAnalyses.length - 1];

    const overallImprovement = (latestAnalysis.overallScore || 0) - (firstAnalysis.overallScore || 0);
    const totalTimeSpan = latestAnalysis.createdAt - firstAnalysis.createdAt;
    const timeSpanDays = Math.ceil(totalTimeSpan / (1000 * 60 * 60 * 24));

    // Calculate ATS improvement
    const atsImprovement = latestAnalysis.atsCompatibility && firstAnalysis.atsCompatibility
      ? latestAnalysis.atsCompatibility.score - firstAnalysis.atsCompatibility.score
      : 0;

    // Calculate keyword improvement
    const keywordImprovement = (latestAnalysis.keywordAnalysis?.presentKeywords?.length || 0) -
                               (firstAnalysis.keywordAnalysis?.presentKeywords?.length || 0);

    // Calculate average improvement per day
    const avgImprovementPerDay = timeSpanDays > 0 ? overallImprovement / timeSpanDays : 0;

    // Find best analysis
    const bestAnalysis = sortedAnalyses.reduce((best, current) =>
      (current.overallScore || 0) > (best.overallScore || 0) ? current : best
    );

    // Calculate consistency (how steady the scores are)
    const scores = sortedAnalyses.map(a => a.overallScore || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance)); // Higher = more consistent

    // Calculate milestones
    const milestones = [
      { threshold: 70, label: "Good Score", achieved: (latestAnalysis.overallScore || 0) >= 70 },
      { threshold: 80, label: "Excellent Score", achieved: (latestAnalysis.overallScore || 0) >= 80 },
      { threshold: 85, label: "Outstanding Score", achieved: (latestAnalysis.overallScore || 0) >= 85 },
    ];

    return {
      overallImprovement,
      atsImprovement,
      keywordImprovement,
      timeSpanDays,
      avgImprovementPerDay,
      bestAnalysis,
      consistency,
      milestones,
      sortedAnalyses,
      firstAnalysis,
      latestAnalysis,
    };
  }, [analyses]);

  if (!improvementData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Improvement Tracking</h3>
          <p className="text-muted-foreground">
            Upload at least 2 CV analyses to track your improvement over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    overallImprovement,
    atsImprovement,
    keywordImprovement,
    timeSpanDays,
    avgImprovementPerDay,
    bestAnalysis,
    consistency,
    milestones,
    sortedAnalyses,
    firstAnalysis,
    latestAnalysis,
  } = improvementData;

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Your CV Improvement Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground mb-1">
                {overallImprovement > 0 ? "+" : ""}
                {overallImprovement}
              </div>
              <div className="text-sm text-muted-foreground">
                Point Improvement
              </div>
              <div className="flex items-center justify-center mt-2">
                {overallImprovement > 0 && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {overallImprovement < 0 && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {overallImprovement === 0 && (
                  <div className="h-4 w-4 rounded-full bg-muted-foreground" />
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground mb-1">
                {timeSpanDays}
              </div>
              <div className="text-sm text-muted-foreground">Days Tracking</div>
              <Calendar className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground mb-1">
                {avgImprovementPerDay > 0 ? "+" : ""}
                {avgImprovementPerDay.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Points/Day</div>
              <Zap className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
            </div>
          </div>

          {/* Score Progression Sparkline Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <LineChart className="h-4 w-4 mr-2" />
              Score Trend
            </h4>
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <Sparkline
                data={sortedAnalyses.map(a => a.overallScore || 0)}
                labels={sortedAnalyses.map((a, i) => 
                  i === 0 ? "Start" : i === sortedAnalyses.length - 1 ? "Latest" : `CV ${i + 1}`
                )}
                width={400}
                height={80}
                showPoints={true}
                showArea={true}
                className="w-full max-w-full"
              />
            </div>
            
            {/* Score details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground mb-1">Starting Score</div>
                <div className="text-xl font-bold">{firstAnalysis.overallScore || 0}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground mb-1">Latest Score</div>
                <div className="text-xl font-bold flex items-center gap-2">
                  {latestAnalysis.overallScore || 0}
                  {overallImprovement > 0 && (
                    <span className="text-sm text-green-600 font-medium">+{overallImprovement}</span>
                  )}
                  {overallImprovement < 0 && (
                    <span className="text-sm text-red-600 font-medium">{overallImprovement}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Detailed Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">ATS Compatibility</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {atsImprovement > 0 ? "+" : ""}
                  {atsImprovement}
                </span>
                {atsImprovement > 0 && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {atsImprovement < 0 && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Keywords Found</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {keywordImprovement > 0 ? "+" : ""}
                  {keywordImprovement}
                </span>
                {keywordImprovement > 0 && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {keywordImprovement < 0 && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Consistency Score</span>
              <Badge variant="outline">{consistency.toFixed(0)}/100</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Achievement Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    milestone.achieved
                      ? "bg-green-50 border-green-200"
                      : "bg-muted border-border"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        milestone.achieved
                          ? "bg-green-500 text-white"
                          : "bg-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {milestone.achieved ? (
                        <Award className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        milestone.achieved ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {milestone.label}
                    </span>
                  </div>
                  <Badge variant={milestone.achieved ? "default" : "secondary"}>
                    {milestone.threshold}+
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Your Best Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div>
              <h4 className="font-medium text-yellow-900">
                {bestAnalysis.fileName}
              </h4>
              <p className="text-sm text-yellow-700">
                Scored {bestAnalysis.overallScore}/100 on{" "}
                {new Date(bestAnalysis.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant="default"
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Best Score
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Tips */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Lightbulb className="h-5 w-5 inline mr-2" />
            Improvement Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallImprovement > 5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Excellent progress! Your CV has improved significantly.
                  Keep up the great work!
                </p>
              </div>
            )}

            {overallImprovement > 0 && overallImprovement <= 5 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <TrendingUp className="h-4 w-4 inline mr-1" /> Steady
                  improvement! Small consistent changes are leading to better
                  results.
                </p>
              </div>
            )}

            {overallImprovement <= 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  Consider reviewing your recent changes. Sometimes a different
                  approach can yield better results.
                </p>
              </div>
            )}

            {consistency > 80 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  High consistency in your scores indicates you&apos;re building on
                  solid foundations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
