"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  Brain,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { useState } from "react";
import AnswerFeedback from "./AnswerFeedback";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string[];
  difficulty: string;
  tags: string[];
}

interface QuestionPracticeAreaProps {
  currentQuestionData: InterviewQuestion | null;
  currentQuestion: number;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  handleCompleteQuestion: () => void;
  handleNextQuestion: () => void;
  getCurrentQuestions: () => InterviewQuestion[];
  loading: boolean;
}

export default function QuestionPracticeArea({
  currentQuestionData,
  currentQuestion,
  userAnswer,
  setUserAnswer,
  isRecording,
  toggleRecording,
  handleCompleteQuestion,
  handleNextQuestion,
  getCurrentQuestions,
  loading,
}: QuestionPracticeAreaProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestionData) return;

    setIsEvaluating(true);
    try {
      const response = await fetch("/api/interview-questions/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestionData.question,
          answer: userAnswer,
          category: currentQuestionData.category,
          difficulty: currentQuestionData.difficulty,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluationResult(data.data);
        setShowFeedback(true);
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    setEvaluationResult(null);
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-3 w-3 mt-0.5" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-3 w-3 mt-0.5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-3 w-3 mt-0.5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Skeleton className="h-10 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No questions available
        </h3>
        <p className="text-muted-foreground">
          Please select a question category to start practicing.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6">
      <Card className="card-depth-3 border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {currentQuestionData.category}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                currentQuestionData.difficulty === "Easy"
                  ? "secondary"
                  : currentQuestionData.difficulty === "Medium"
                  ? "default"
                  : "destructive"
              }
              className="text-xs"
            >
              {currentQuestionData.difficulty}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {getCurrentQuestions().length}
            </span>
          </div>
        </div>
        <CardTitle className="text-xl mt-4 leading-relaxed">
          {currentQuestionData.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="answer" className="text-sm font-medium">
            Your Answer
          </Label>
          <Textarea
            id="answer"
            placeholder="Type your answer here... Use the STAR method: Situation, Task, Action, Result"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            rows={6}
            className="resize-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </motion.div>
          <span className="text-sm text-muted-foreground">
            Practice speaking your answer out loud
          </span>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for this question:
          </h4>
          <ul className="space-y-1 text-sm text-foreground/80">
            {currentQuestionData.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
          {currentQuestionData.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {currentQuestionData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-primary/30"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" onClick={() => setUserAnswer("")}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </motion.div>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={handleEvaluateAnswer}
              disabled={!userAnswer.trim() || isEvaluating}
              className="flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  AI Feedback
                </>
              )}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={handleCompleteQuestion}
              disabled={!userAnswer.trim()}
            >
              Mark Complete
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestion >= getCurrentQuestions().length - 1}
            >
              Next Question
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </CardFooter>
    </Card>

    {/* AI Feedback Section */}
    {showFeedback && evaluationResult && (
      <AnswerFeedback feedback={evaluationResult} onClose={handleCloseFeedback} />
    )}
  </motion.div>
  );
}
