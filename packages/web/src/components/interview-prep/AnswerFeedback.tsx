"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  MessageSquare,
  Lightbulb,
  Star,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface AnswerFeedbackProps {
  feedback: {
    overall_score: number;
    content_score: number;
    clarity_score: number;
    relevance_score: number;
    structure_score: number;
    strengths: string[];
    improvements: string[];
    detailed_feedback: string;
    suggestions: string[];
    estimated_response_quality: "Poor" | "Fair" | "Good" | "Excellent";
  };
  onClose: () => void;
}

export default function AnswerFeedback({ feedback, onClose }: AnswerFeedbackProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Excellent": return "bg-green-100 text-green-800 border-green-200";
      case "Good": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Fair": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Poor": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const scoreCategories = [
    { name: "Content", score: feedback.content_score, icon: MessageSquare },
    { name: "Clarity", score: feedback.clarity_score, icon: Lightbulb },
    { name: "Relevance", score: feedback.relevance_score, icon: Target },
    { name: "Structure", score: feedback.structure_score, icon: BarChart3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Overall Score Header */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Answer Evaluation
            </CardTitle>
            <Badge className={getQualityColor(feedback.estimated_response_quality)}>
              {feedback.estimated_response_quality}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-5xl font-bold mb-2" style={{ color: getScoreColor(feedback.overall_score) }}>
              {feedback.overall_score}/100
            </div>
            <p className="text-muted-foreground">Overall Score</p>
            <Progress value={feedback.overall_score} className="mt-4 h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoreCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`font-bold ${getScoreColor(category.score)}`}>
                      {category.score}%
                    </span>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.strengths.length > 0 ? (
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No specific strengths identified. Keep practicing!</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.improvements.length > 0 ? (
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Great job! No major improvements needed.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Detailed Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{feedback.detailed_feedback}</p>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {feedback.suggestions.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
              <Lightbulb className="h-5 w-5" />
              Suggestions for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Close Feedback
        </Button>
        <Button onClick={onClose}>
          Continue Practicing
        </Button>
      </div>
    </motion.div>
  );
}
