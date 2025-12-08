"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Lightbulb,
  Target,
  Star,
  Briefcase,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/loading-skeleton";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string[];
  difficulty: string;
  tags: string[];
}

interface InterviewQuestions {
  [key: string]: InterviewQuestion[];
}

interface QuestionTypesSidebarProps {
  interviewQuestions: InterviewQuestions;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  completedQuestions: string[];
  loading: boolean;
}

export default function QuestionTypesSidebar({
  interviewQuestions,
  selectedCategory,
  setSelectedCategory,
  completedQuestions,
  loading,
}: QuestionTypesSidebarProps) {
  const getCurrentQuestions = () => {
    return interviewQuestions[selectedCategory as keyof typeof interviewQuestions] || [];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="card-depth-2 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Question Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(interviewQuestions).map(([category, questions]) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-4 rounded-lg border interactive-depth depth-transition ${selectedCategory === category
                  ? "border-primary bg-primary/5 card-depth-2 shadow-glow"
                  : "border-border hover:border-border/50 card-depth-1 hover-depth"
                }`}
            >
              <div className="font-medium capitalize flex items-center gap-2">
                {category === "behavioral" && (
                  <MessageSquare className="h-4 w-4" />
                )}
                {category === "technical" && (
                  <Lightbulb className="h-4 w-4" />
                )}
                {category === "situational" && (
                  <Users className="h-4 w-4" />
                )}
                {category === "leadership" && (
                  <Target className="h-4 w-4" />
                )}
                {category === "systemDesign" && (
                  <Briefcase className="h-4 w-4" />
                )}
                {category === "productSense" && (
                  <Star className="h-4 w-4" />
                )}
                {category.replace(/([A-Z])/g, " $1").trim()} ({questions.length})
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {category === "behavioral" && "Past experiences and examples"}
                {category === "technical" && "Coding and technical knowledge"}
                {category === "situational" && "How you would handle scenarios"}
                {category === "leadership" && "Management and team leadership"}
                {category === "systemDesign" && "Architecture and scalability"}
                {category === "productSense" && "Product thinking and strategy"}
              </div>
            </motion.button>
          ))}
        </CardContent>
      </Card>

      <Card className="card-depth-2 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Questions Completed</span>
              <span className="font-semibold">
                {completedQuestions.length}/{getCurrentQuestions().length}
              </span>
            </div>
            <Progress
              value={getCurrentQuestions().length > 0
                ? (completedQuestions.length / getCurrentQuestions().length) * 100
                : 0}
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {getCurrentQuestions().length > 0
                ? Math.round((completedQuestions.length / getCurrentQuestions().length) * 100)
                : 0}% complete
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
