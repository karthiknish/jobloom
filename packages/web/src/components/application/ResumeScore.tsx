"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Lightbulb, Crown, TrendingUp, Target, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnhancedAtsScore } from "@/components/EnhancedAtsScore";
import { useSubscription } from "@/providers/subscription-provider";
import type { ResumeScore } from "./types";
import { cn } from "@/lib/utils";

interface ResumeScoreProps {
  score: ResumeScore;
  enhanced?: boolean;
  compact?: boolean;
}

export function ResumeScore({ score, enhanced = true, compact = false }: ResumeScoreProps) {
  const { plan } = useSubscription();
  
  // If enhanced mode is available and the score has enhanced data, use the enhanced component
  if (enhanced && score.breakdown) {
    return <EnhancedAtsScore score={score} size={compact ? 'compact' : 'default'} />;
  }

  const getScoreLabel = (value: number) => {
    if (value >= 80) return { text: "Excellent", color: "text-primary", bg: "bg-primary/10" };
    if (value >= 60) return { text: "Good", color: "text-amber-600", bg: "bg-amber-50" };
    if (value >= 40) return { text: "Fair", color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "Needs Work", color: "text-red-600", bg: "bg-red-50" };
  };

  const getScoreRingColor = (value: number) => {
    if (value >= 80) return "stroke-emerald-500";
    if (value >= 60) return "stroke-amber-400";
    if (value >= 40) return "stroke-orange-400";
    return "stroke-red-400";
  };

  const getBarColor = (value: number) => {
    if (value >= 80) return "bg-primary";
    if (value >= 60) return "bg-amber-400";
    if (value >= 40) return "bg-orange-400";
    return "bg-red-400";
  };

  const scoreLabel = getScoreLabel(score.overall);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Score Circle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-100"
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
            <span className="text-lg font-bold text-gray-900">{score.overall}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-xs font-medium", scoreLabel.bg, scoreLabel.color)}>
              {scoreLabel.text}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {score.overall >= 80 ? "ATS optimized!" : score.overall >= 60 ? "Almost there" : "Keep improving"}
          </p>
        </div>
      </motion.div>

      {/* Score Breakdown Mini */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Complete", value: score.completeness, icon: Target },
          { label: "ATS", value: score.ats, icon: Zap },
          { label: "Impact", value: score.impact, icon: TrendingUp },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className={cn(
              "w-10 h-10 mx-auto mb-1.5 rounded-lg flex items-center justify-center",
              item.value >= 80 ? "bg-primary/20 text-primary" :
              item.value >= 60 ? "bg-amber-100 text-amber-600" :
              item.value >= 40 ? "bg-orange-100 text-orange-600" :
              "bg-red-100 text-red-600"
            )}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold">{item.value}%</div>
            <div className="text-xxs text-muted-foreground">{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Top Suggestions */}
      {score.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-3 border-t border-gray-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Top Tips</span>
          </div>
          <div className="space-y-1.5">
            {score.suggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className={cn(
                  "w-1 h-1 rounded-full mt-1.5 flex-shrink-0",
                  score.overall >= 70 ? "bg-primary" : "bg-amber-500"
                )} />
                <p className="text-xs text-muted-foreground line-clamp-2">{suggestion}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upgrade Prompt for Low Scores */}
      {plan === "free" && score.overall < 70 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex-shrink-0">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-900">
                    Boost score by 30+ points
                  </p>
                  <p className="text-xxs text-amber-700">
                    AI optimization & expert tips
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="text-xs h-7 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}