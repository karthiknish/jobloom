"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Lightbulb, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnhancedAtsScore } from "@/components/EnhancedAtsScore";
import { useSubscription } from "@/hooks/useSubscription";
import type { ResumeScore } from "./types";
import { themeColors, themeUtils } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

interface ResumeScoreProps {
  score: ResumeScore;
  enhanced?: boolean;
}

export function ResumeScore({ score, enhanced = true }: ResumeScoreProps) {
  const { plan } = useSubscription();
  
  // If enhanced mode is available and the score has enhanced data, use the enhanced component
  if (enhanced && score.breakdown) {
    return <EnhancedAtsScore score={score} />;
  }

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "Needs Work";
  };

  const getScoreColorObj = (value: number) => {
    if (value >= 80) return { bg: themeColors.success.bg, text: themeColors.success.text };
    if (value >= 60) return { bg: themeColors.info.bg, text: themeColors.info.text };
    if (value >= 40) return { bg: themeColors.warning.bg, text: themeColors.warning.text };
    return { bg: themeColors.error.bg, text: themeColors.error.text };
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={cn("inline-flex items-center justify-center w-24 h-24 rounded-full mb-4", getScoreColorObj(score.overall).bg)}>
          <span className={cn("text-3xl font-bold", getScoreColorObj(score.overall).text)}>
            {score.overall}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Resume Score</h3>
        <Badge variant="outline" className={getScoreColorObj(score.overall).text}>
          {getScoreLabel(score.overall)}
        </Badge>
      </motion.div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className={getScoreColorObj(score.completeness).text}>{score.completeness}%</span>
                </div>
                <Progress value={score.completeness} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">ATS Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className={getScoreColorObj(score.ats).text}>{score.ats}%</span>
                </div>
                <Progress value={score.ats} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Impact & Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className={getScoreColorObj(score.impact).text}>{score.impact}%</span>
                </div>
                <Progress value={score.impact} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Improvement Suggestions
            </CardTitle>
            <CardDescription>
              Here are some recommendations to make your resume stand out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {score.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {score.overall >= 70 ? (
                      <CheckCircle className={cn("h-4 w-4 flex-shrink-0", themeColors.success.icon)} />
                    ) : (
                      <AlertCircle className={cn("h-4 w-4 flex-shrink-0", themeColors.warning.icon)} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Prompt for Low Scores */}
        {plan === "free" && score.overall < 70 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={cn("border", "bg-gradient-to-r from-amber-50 to-orange-50", "border-amber-200")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-full", "bg-gradient-to-r from-amber-500 to-orange-500")}>
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900">Boost Your Resume Score</h3>
                      <p className="text-amber-700">
                        Get AI-powered optimization, premium templates, and expert feedback to increase your resume score by 30+ points.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className={cn("text-white", "bg-gradient-to-r from-amber-500 to-orange-500")}
                    onClick={() => window.location.href = '/upgrade'}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}