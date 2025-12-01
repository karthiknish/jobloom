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
  FileText,
  Sparkles,
  ArrowUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ResumeScore } from "@/lib/enhancedAts";
import { cn } from "@/lib/utils";

interface EnhancedAtsScoreProps {
  score: ResumeScore;
  showDetailed?: boolean;
  animated?: boolean;
  size?: 'compact' | 'default' | 'expanded';
}

export function EnhancedAtsScore({
  score,
  showDetailed = true,
  animated = true,
  size = 'default'
}: EnhancedAtsScoreProps) {
  const getScoreGradient = (value: number) => {
    if (value >= 80) return "from-emerald-500 to-green-600";
    if (value >= 60) return "from-amber-400 to-yellow-500";
    if (value >= 40) return "from-orange-400 to-orange-500";
    return "from-red-400 to-red-500";
  };

  const getScoreRingColor = (value: number) => {
    if (value >= 80) return "stroke-emerald-500";
    if (value >= 60) return "stroke-amber-400";
    if (value >= 40) return "stroke-orange-400";
    return "stroke-red-400";
  };

  const getScoreLabel = (value: number) => {
    if (value >= 90) return { text: "Outstanding", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (value >= 80) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (value >= 70) return { text: "Good", color: "text-green-600", bg: "bg-green-50" };
    if (value >= 60) return { text: "Fair", color: "text-amber-600", bg: "bg-amber-50" };
    if (value >= 50) return { text: "Needs Work", color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "Critical", color: "text-red-600", bg: "bg-red-50" };
  };

  const getBarColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-amber-400";
    if (percentage >= 40) return "bg-orange-400";
    return "bg-red-400";
  };

  const scoreLabel = getScoreLabel(score.overall);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  // Compact view for sidebar
  if (size === 'compact') {
    return (
      <div className="space-y-4">
        {/* Compact Score Circle */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={getScoreRingColor(score.overall)}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{score.overall}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("text-xs font-medium", scoreLabel.bg, scoreLabel.color)}>
                {scoreLabel.text}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {score.overall >= 80 ? "ATS optimized!" : score.overall >= 60 ? "Almost there" : "Keep improving"}
            </p>
          </div>
        </div>

        {/* Mini Breakdown */}
        {score.breakdown && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Structure", value: score.breakdown.structure, max: 50 },
              { label: "Content", value: score.breakdown.content, max: 50 },
              { label: "Keywords", value: score.breakdown.keywords, max: 35 },
              { label: "Readability", value: score.breakdown.readability, max: 45 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{Math.round((item.value / item.max) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getBarColor(item.value, item.max))}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / item.max) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Suggestion */}
        {score.suggestions && score.suggestions.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {score.suggestions[0]}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default/Expanded view
  const MetricRow = ({
    label,
    value,
    max,
    icon: Icon,
    delay = 0
  }: {
    label: string;
    value: number;
    max: number;
    icon: React.ElementType;
    delay?: number;
  }) => {
    const percentage = Math.round((value / max) * 100);
    return (
      <motion.div
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          percentage >= 80 ? "bg-emerald-100 text-emerald-600" :
          percentage >= 60 ? "bg-amber-100 text-amber-600" :
          percentage >= 40 ? "bg-orange-100 text-orange-600" :
          "bg-red-100 text-red-600"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <span className="text-sm font-semibold tabular-nums">{percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", getBarColor(value, max))}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <motion.div
        initial={animated ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Score Circle - Centered */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28 mb-4">
            {/* Background ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={getScoreRingColor(score.overall)}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            {/* Score number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={animated ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                className={cn(
                  "text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                  getScoreGradient(score.overall)
                )}
              >
                {score.overall}
              </motion.span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={cn("px-3 py-1 text-sm font-medium", scoreLabel.bg, scoreLabel.color)}>
            {score.overall >= 80 && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
            {score.overall >= 60 && score.overall < 80 && <ArrowUp className="w-3.5 h-3.5 mr-1.5" />}
            {score.overall < 60 && <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />}
            {scoreLabel.text}
          </Badge>

          {/* Brief message */}
          <p className="text-sm text-muted-foreground text-center mt-3 max-w-xs">
            {score.overall >= 80 && "Your resume is highly optimized for ATS systems."}
            {score.overall >= 60 && score.overall < 80 && "Good progress! A few improvements will boost your score."}
            {score.overall >= 40 && score.overall < 60 && "Consider the suggestions below to improve ATS compatibility."}
            {score.overall < 40 && "Your resume needs attention to pass ATS filters effectively."}
          </p>
        </div>
      </motion.div>

      {showDetailed && score.breakdown && (
        <>
          {/* Score Breakdown */}
          <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Structure & Format" value={score.breakdown.structure} max={50} icon={FileText} delay={0.1} />
              <MetricRow label="Content Quality" value={score.breakdown.content} max={50} icon={Sparkles} delay={0.2} />
              <MetricRow label="Keyword Match" value={score.breakdown.keywords} max={35} icon={Zap} delay={0.3} />
              <MetricRow label="Readability" value={score.breakdown.readability} max={45} icon={Target} delay={0.4} />
            </CardContent>
          </Card>

          {/* Strengths & Issues - Combined compact view */}
          {((score.strengths && score.strengths.length > 0) || (score.criticalIssues && score.criticalIssues.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {score.strengths && score.strengths.length > 0 && (
                <Card className="border-0 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {score.strengths.slice(0, 3).map((strength: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={animated ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">{strength}</p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Critical Issues */}
              {score.criticalIssues && score.criticalIssues.length > 0 && (
                <Card className="border-0 shadow-sm bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      To Fix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {score.criticalIssues.slice(0, 3).map((issue: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={animated ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">{issue}</p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recommendations */}
          {score.suggestions && score.suggestions.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Quick Wins
                </CardTitle>
                <CardDescription className="text-xs">
                  Top actions to improve your score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {score.suggestions.slice(0, 4).map((suggestion: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={animated ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">{suggestion}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}