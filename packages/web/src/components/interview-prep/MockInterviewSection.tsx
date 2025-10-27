"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Clock,
  Users,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MockInterviewTemplate {
  id: string;
  name: string;
  role: string;
  experience: string;
  duration: number;
  description: string;
  focus: string[];
  questionCount: number;
}

interface MockInterviewQuestion {
  id: string;
  question: string;
  type: "behavioral" | "technical" | "situational" | "leadership";
  category: string;
  difficulty: string;
  timeLimit: number;
  followUpQuestions?: string[];
}

interface MockInterviewSession {
  id: string;
  role: string;
  experience: string;
  duration: number;
  questions: MockInterviewQuestion[];
  startedAt: Date;
  status: "created" | "in_progress" | "completed";
}

export default function MockInterviewSection() {
  const [templates, setTemplates] = useState<MockInterviewTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MockInterviewTemplate | null>(null);
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/mock-interviews");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const startMockInterview = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const response = await fetch("/api/mock-interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedTemplate.role,
          experience: selectedTemplate.experience,
          duration: selectedTemplate.duration,
          focus: selectedTemplate.focus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.data);
        setIsSessionActive(true);
        setCurrentQuestionIndex(0);
        setTimeRemaining(data.data.questions[0]?.timeLimit * 60 || 480); // Convert to seconds
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error("Error starting mock interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    if (session?.questions[currentQuestionIndex]) {
      setUserAnswers({
        ...userAnswers,
        [session.questions[currentQuestionIndex].id]: answer,
      });
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeRemaining(session.questions[currentQuestionIndex + 1].timeLimit * 60);
      setIsTimerRunning(true);
    } else {
      completeSession();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsTimerRunning(false);
    }
  };

  const handleTimeUp = () => {
    // Auto-advance to next question when time is up
    if (session && currentQuestionIndex < session.questions.length - 1) {
      handleNextQuestion();
    } else {
      completeSession();
    }
  };

  const completeSession = () => {
    setIsSessionActive(false);
    setIsTimerRunning(false);
    setShowResults(true);
  };

  const resetSession = () => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSessionActive(false);
    setTimeRemaining(0);
    setIsTimerRunning(false);
    setShowResults(false);
    setSelectedTemplate(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "behavioral": return <Users className="h-4 w-4" />;
      case "technical": return <Brain className="h-4 w-4" />;
      case "situational": return <Target className="h-4 w-4" />;
      case "leadership": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (showResults && session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Interview Completed!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <h3 className="text-2xl font-bold mb-2">Great job!</h3>
              <p className="text-muted-foreground mb-4">
                You've completed the {session.role} mock interview
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{session.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Object.keys(userAnswers).length}</div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{session.duration}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{session.experience}</div>
                  <div className="text-sm text-muted-foreground">Level</div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={resetSession}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start New Interview
                </Button>
                <Button>
                  Review Answers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isSessionActive && session) {
    const currentQuestion = session.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Progress Bar */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {session.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Current Question */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(currentQuestion.type)}
                <Badge variant="secondary">{currentQuestion.category}</Badge>
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`font-mono ${timeRemaining < 60 ? "text-red-600" : ""}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold leading-relaxed">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="Type your answer here..."
                  value={userAnswers[currentQuestion.id] || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {currentQuestion.followUpQuestions && currentQuestion.followUpQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Potential Follow-up Questions:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {currentQuestion.followUpQuestions.map((fq, index) => (
                      <li key={index}>• {fq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Timer
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Timer
                </>
              )}
            </Button>
            
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex === session.questions.length - 1 ? "Complete" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Mock Interview Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-3">
              <Label>Select Interview Type</Label>
              <Select onValueChange={(value: string) => {
                const template = templates.find(t => t.id === value);
                setSelectedTemplate(template || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an interview type..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {template.duration} minutes • {template.questionCount} questions
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Details */}
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.focus.map((f, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Duration:</span> {selectedTemplate.duration} min
                  </div>
                  <div>
                    <span className="font-medium">Questions:</span> {selectedTemplate.questionCount}
                  </div>
                  <div>
                    <span className="font-medium">Level:</span> {selectedTemplate.experience}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Start Button */}
            <Button
              onClick={startMockInterview}
              disabled={!selectedTemplate || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing Interview...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Mock Interview
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
