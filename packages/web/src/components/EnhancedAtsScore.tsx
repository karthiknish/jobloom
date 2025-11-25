"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
  Info,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResumeScore } from "@/lib/enhancedAts";
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

interface EnhancedAtsScoreProps {
  score: ResumeScore;
  showDetailed?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function EnhancedAtsScore({
  score,
  showDetailed = true,
  animated = true,
  size = 'medium'
}: EnhancedAtsScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return themeColors.success.text;
    if (value >= 60) return themeColors.warning.text;
    return themeColors.error.text;
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 80) return themeColors.success.bg;
    if (value >= 60) return themeColors.warning.bg;
    return themeColors.error.bg;
  };

  const getScoreLabel = (value: number) => {
    if (value >= 90) return "Outstanding";
    if (value >= 80) return "Excellent";
    if (value >= 70) return "Good";
    if (value >= 60) return "Fair";
    if (value >= 50) return "Needs Improvement";
    return "Critical";
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-600";
    if (value >= 60) return "bg-yellow-500";
    if (value >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const sizeClasses = {
    small: {
      container: "w-16 h-16",
      text: "text-lg font-bold",
      icon: "w-4 h-4"
    },
    medium: {
      container: "w-24 h-24",
      text: "text-2xl font-bold",
      icon: "w-5 h-5"
    },
    large: {
      container: "w-32 h-32",
      text: "text-3xl font-bold",
      icon: "w-6 h-6"
    }
  };

  const currentSize = sizeClasses[size];

  const ScoreCircle = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="text-center"
    >
      <div className={`${currentSize.container} ${getScoreBgColor(value)} rounded-full flex items-center justify-center mx-auto mb-3 relative`}>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
          className={currentSize.text}
        >
          {value}
        </motion.span>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - value / 100)}`}
            className={getScoreColor(value)}
            initial={{ strokeDashoffset: `${2 * Math.PI * 45}` }}
            animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - value / 100)}` }}
            transition={{ delay: delay + 0.5, duration: 1, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <Badge variant="outline" className={getScoreColor(value)}>
        {label}
      </Badge>
    </motion.div>
  );

  const MetricBar = ({
    label,
    value,
    icon: Icon,
    color,
    max = 100,
    delay = 0
  }: {
    label: string;
    value: number;
    icon: any;
    color: string;
    max?: number;
    delay?: number
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${color}`}>
          {value}/{max}
        </span>
      </div>
      <Progress
        value={(value / max) * 100}
        className="h-2"
        indicatorClassName={getProgressColor(value)}
      />
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Target className="w-6 h-6 text-emerald-600" />
              ATS Optimization Score
            </CardTitle>
            <CardDescription className="text-base">
              Your resume&apos;s compatibility with Applicant Tracking Systems
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <ScoreCircle value={score.overall} label={getScoreLabel(score.overall)} />

          {/* Overall Score Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {score.overall >= 80 ? (
                <Star className={cn("w-5 h-5", themeColors.warning.icon)} />
              ) : score.overall >= 60 ? (
                <TrendingUp className={cn("w-5 h-5", themeColors.success.icon)} />
              ) : score.overall >= 40 ? (
                <Info className={cn("w-5 h-5", themeColors.info.icon)} />
              ) : (
                <AlertTriangle className={cn("w-5 h-5", themeColors.error.icon)} />
              )}
              <span className="text-lg font-semibold text-foreground">
                {getScoreLabel(score.overall)} Performance
              </span>
            </div>
            <p className="text-sm max-w-md mx-auto text-muted-foreground">
              {score.overall >= 80 && "Excellent! Your resume is highly optimized for ATS systems and should perform well."}
              {score.overall >= 60 && score.overall < 80 && "Good! Your resume has solid ATS optimization with room for improvement."}
              {score.overall >= 40 && score.overall < 60 && "Fair. Consider implementing the suggested improvements to enhance ATS performance."}
              {score.overall < 40 && "Needs work. Address the critical issues to significantly improve ATS compatibility."}
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {showDetailed && score.breakdown && (
        <>
          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Score Breakdown
              </CardTitle>
              <CardDescription>
                Detailed analysis of your resume&apos;s performance across key areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricBar
                  label="Structure & Organization"
                  value={score.breakdown.structure}
                  icon={Target}
                  color={themeColors.success.text}
                  max={50}
                  delay={0.2}
                />
                <MetricBar
                  label="Content Quality"
                  value={score.breakdown.content}
                  icon={Star}
                  color={themeColors.success.text}
                  max={50}
                  delay={0.3}
                />
                <MetricBar
                  label="Keyword Optimization"
                  value={score.breakdown.keywords}
                  icon={Zap}
                  color={themeColors.success.text}
                  max={35}
                  delay={0.4}
                />
                <MetricBar
                  label="Formatting & Readability"
                  value={score.breakdown.readability}
                  icon={Activity}
                  color={themeColors.warning.text}
                  max={45}
                  delay={0.5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Critical Issues */}
          {(score.strengths || score.criticalIssues) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Performance Analysis
                </CardTitle>
                <CardDescription>
                  Key strengths and areas for improvement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strengths */}
                {score.strengths && score.strengths.length > 0 && (
                  <div>
                    <h4 className={cn("font-semibold mb-3 flex items-center gap-2", themeColors.success.text)}>
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {score.strengths.map((strength: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className={cn("flex items-start gap-2 p-3 rounded-lg", themeColors.success.bg)}
                        >
                          <CheckCircle2 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", themeColors.success.icon)} />
                          <p className={cn("text-sm", themeColors.success.text)}>{strength}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Issues */}
                {score.criticalIssues && score.criticalIssues.length > 0 && (
                  <div>
                    <h4 className={cn("font-semibold mb-3 flex items-center gap-2", themeColors.error.text)}>
                      <AlertTriangle className="w-4 h-4" />
                      Critical Issues
                    </h4>
                    <div className="space-y-2">
                      {score.criticalIssues.map((issue: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className={cn("flex items-start gap-2 p-3 rounded-lg", themeColors.error.bg)}
                        >
                          <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", themeColors.error.icon)} />
                          <p className={cn("text-sm", themeColors.error.text)}>{issue}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {score.suggestions && score.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Improvement Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable suggestions to enhance your resume&apos;s ATS performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {score.suggestions.slice(0, 6).map((suggestion: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      className={cn("flex items-start gap-3 p-3 rounded-lg", themeColors.success.bg)}
                    >
                      <Info className={cn("w-4 h-4 mt-0.5 flex-shrink-0", themeColors.success.icon)} />
                      <p className={cn("text-sm", themeColors.success.text)}>{suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Call to Action */}
      <Card className={cn("border-0 shadow-lg", themeColors.success.bg)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {score.overall >= 80 ? (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className={cn("w-6 h-6", themeColors.warning.icon)} />
                  <span className="text-lg font-bold text-foreground">ATS Optimized!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className={cn("w-6 h-6", themeColors.success.icon)} />
                  <span className="text-lg font-bold text-foreground">Improve Your Score</span>
                </div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-sm max-w-md mx-auto text-muted-foreground"
            >
              {score.overall >= 80
                ? "Your resume is ready for ATS systems. Focus on tailoring it to specific job applications for best results."
                : "Implement the suggested improvements to significantly enhance your resume&apos;s performance with ATS systems."
              }
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto"
              >
                {score.overall >= 80 ? "Download ATS Report" : "View Detailed Analysis"}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}