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
import type { ResumeScore } from "@/types/resume";

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
    if (value >= 90) return "text-emerald-600";
    if (value >= 80) return "text-green-600";
    if (value >= 70) return "text-lime-600";
    if (value >= 60) return "text-yellow-600";
    if (value >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 90) return "bg-emerald-100";
    if (value >= 80) return "bg-green-100";
    if (value >= 70) return "bg-lime-100";
    if (value >= 60) return "bg-yellow-100";
    if (value >= 50) return "bg-orange-100";
    return "bg-red-100";
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
    if (value >= 80) return "bg-green-500";
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
              <Target className="w-6 h-6 text-blue-600" />
              ATS Optimization Score
            </CardTitle>
            <CardDescription className="text-base">
              Your resume's compatibility with Applicant Tracking Systems
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <ScoreCircle value={score.overall} label={getScoreLabel(score.overall)} />

          {/* Overall Score Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {score.overall >= 80 ? (
                <Star className="w-5 h-5 text-yellow-500" />
              ) : score.overall >= 60 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : score.overall >= 40 ? (
                <Info className="w-5 h-5 text-blue-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-lg font-semibold text-gray-700">
                {getScoreLabel(score.overall)} Performance
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
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
                Detailed analysis of your resume's performance across key areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricBar
                  label="Structure & Organization"
                  value={score.breakdown.structure}
                  icon={Target}
                  color="text-blue-600"
                  max={50}
                  delay={0.2}
                />
                <MetricBar
                  label="Content Quality"
                  value={score.breakdown.content}
                  icon={Star}
                  color="text-purple-600"
                  max={50}
                  delay={0.3}
                />
                <MetricBar
                  label="Keyword Optimization"
                  value={score.breakdown.keywords}
                  icon={Zap}
                  color="text-green-600"
                  max={35}
                  delay={0.4}
                />
                <MetricBar
                  label="Formatting & Readability"
                  value={score.breakdown.readability}
                  icon={Activity}
                  color="text-orange-600"
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
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {score.strengths.map((strength, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-800">{strength}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Issues */}
                {score.criticalIssues && score.criticalIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Critical Issues
                    </h4>
                    <div className="space-y-2">
                      {score.criticalIssues.map((issue, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="flex items-start gap-2 p-3 bg-red-50 rounded-lg"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-800">{issue}</p>
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
                  Actionable suggestions to enhance your resume's ATS performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {score.suggestions.slice(0, 6).map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Call to Action */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {score.overall >= 80 ? (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <span className="text-lg font-bold text-gray-800">ATS Optimized!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-bold text-gray-800">Improve Your Score</span>
                </div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-sm text-gray-600 max-w-md mx-auto"
            >
              {score.overall >= 80
                ? "Your resume is ready for ATS systems. Focus on tailoring it to specific job applications for best results."
                : "Implement the suggested improvements to significantly enhance your resume's performance with ATS systems."
              }
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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