"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  Star,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Users,
  TrendingUp,
  Briefcase,
  Mail,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Skeleton } from "@/components/ui/loading-skeleton";

// Interview questions will be fetched from API
interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string[];
  difficulty: string;
  tags: string[];
}

const defaultQuestions: Record<string, InterviewQuestion[]> = {
  behavioral: [],
  technical: [],
  situational: [],
  leadership: [],
  systemDesign: [],
  productSense: [],
};

const interviewTips = [
  {
    title: "Research the Company",
    description:
      "Spend time learning about the company's culture, values, recent news, and products.",
    icon: "🏢",
  },
  {
    title: "Prepare Your Stories",
    description:
      "Have 3-5 stories ready that demonstrate your skills and experiences using the STAR method.",
    icon: "book-open",
  },
  {
    title: "Practice Common Questions",
    description:
      "Prepare answers for behavioral, situational, and technical questions relevant to your role.",
    icon: "target",
  },
  {
    title: "Prepare Questions for Interviewer",
    description:
      "Have thoughtful questions ready that show your interest in the role and company.",
    icon: "help-circle",
  },
  {
    title: "Follow Up",
    description:
      "Send a thank-you email within 24 hours, reiterating your interest and key points.",
    icon: "mail",
  },
];

// Helper to get icon component by name
const getInterviewTipIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    briefcase: Briefcase,
    target: Target,
    "book-open": BookOpen,
    clock: Clock,
    mail: Mail,
    "help-circle": HelpCircle,
  };
  return icons[iconName] || MessageSquare;
};

export default function InterviewPrepPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("practice");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState(defaultQuestions);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("behavioral");

  // Fetch interview questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/interview-questions/authenticated");
        if (response.ok) {
          const data = await response.json();
          setInterviewQuestions(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch interview questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const getCurrentQuestions = () => {
    return interviewQuestions[selectedCategory as keyof typeof interviewQuestions] || [];
  };

  const currentQuestionData = getCurrentQuestions()[currentQuestion];

  const handleNextQuestion = () => {
    const currentQuestions = getCurrentQuestions();
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer("");
    }
  };

  const handleCompleteQuestion = () => {
    if (currentQuestionData) {
      setCompletedQuestions([...completedQuestions, currentQuestionData.id]);
      handleNextQuestion();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="mb-4">Please sign in to access interview preparation.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="gradient-primary shadow-premium-xl relative overflow-hidden"
      >
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full filter blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold text-white tracking-tight">Interview Preparation</h1>
            <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-3xl leading-relaxed">
              Master your interview skills with AI-powered practice and comprehensive preparation tools
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-8"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="practice">Practice Questions</TabsTrigger>
                <TabsTrigger value="tips">Interview Tips</TabsTrigger>
                <TabsTrigger value="mock">Mock Interviews</TabsTrigger>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
              </TabsList>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-8"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="practice">Practice Questions</TabsTrigger>
                <TabsTrigger value="tips">Interview Tips</TabsTrigger>
                <TabsTrigger value="mock">Mock Interviews</TabsTrigger>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Question Categories */}
                  <div className="space-y-4">
                    {loading ? (
                      <>
                        {/* Question Types Skeleton */}
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

                        {/* Progress Skeleton */}
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
                      </>
                    ) : (
                      <>
                       <Card className="card-depth-2 border-border">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-lg">
                             <Target className="h-5 w-5 text-primary" />
                             Question Types
                           </CardTitle>
                         </CardHeader>
                          <CardContent className="space-y-3">
                            {Object.entries(interviewQuestions).map(
                              ([category, questions]) => (
                                <motion.button
                                  key={category}
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setCurrentQuestion(0);
                                    setUserAnswer("");
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`w-full text-left p-4 rounded-lg border interactive-depth depth-transition ${
                                    selectedCategory === category
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
                                    {category.replace(/([A-Z])/g, " $1").trim()}{" "}
                                    ({questions.length})
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {category === "behavioral" &&
                                      "Past experiences and examples"}
                                    {category === "technical" &&
                                      "Coding and technical knowledge"}
                                    {category === "situational" &&
                                      "How you would handle scenarios"}
                                    {category === "leadership" &&
                                      "Management and team leadership"}
                                    {category === "systemDesign" &&
                                      "Architecture and scalability"}
                                    {category === "productSense" &&
                                      "Product thinking and strategy"}
                                  </div>
                                </motion.button>
                              )
                            )}
                          </CardContent>
                        </Card>

                        {/* Progress */}
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
                                <span className="font-medium">
                                  Questions Completed
                                </span>
                                <span className="font-semibold">
                                  {completedQuestions.length}/
                                  {getCurrentQuestions().length}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (completedQuestions.length /
                                    getCurrentQuestions().length) *
                                  100
                                }
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {Math.round(
                                  (completedQuestions.length /
                                    getCurrentQuestions().length) *
                                    100
                                )}
                                % complete
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Main Practice Area */}
                  <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                      <div className="space-y-6">
                        {/* Main Question Area Skeleton */}
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
                            {/* Answer Input Skeleton */}
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <div className="space-y-2">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                              </div>
                            </div>

                            {/* Recording Controls Skeleton */}
                            <div className="flex items-center gap-4">
                              <Skeleton className="h-10 w-32" />
                              <Skeleton className="h-4 w-48" />
                            </div>

                            {/* Tips Skeleton */}
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
                    ) : currentQuestionData ? (
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
                                    : currentQuestionData.difficulty ===
                                      "Medium"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {currentQuestionData.difficulty}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Question {currentQuestion + 1} of{" "}
                                {getCurrentQuestions().length}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-xl mt-4 leading-relaxed">
                            {currentQuestionData.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Answer Input */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="answer"
                              className="text-sm font-medium"
                            >
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

                          {/* Recording Controls */}
                          <div className="flex items-center gap-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant={
                                  isRecording ? "destructive" : "outline"
                                }
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

                          {/* Tips */}
                          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Tips for this question:
                            </h4>
                            <ul className="space-y-1 text-sm text-foreground/80">
                              {currentQuestionData.tips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
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
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => setUserAnswer("")}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset
                            </Button>
                          </motion.div>
                          <div className="flex gap-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                onClick={handleCompleteQuestion}
                                disabled={!userAnswer.trim()}
                              >
                                Mark Complete
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={handleNextQuestion}
                                disabled={
                                  currentQuestion >=
                                  getCurrentQuestions().length - 1
                                }
                              >
                                Next Question
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </motion.div>
                          </div>
                        </CardFooter>
                      </Card>
                    ) : (
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
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {interviewTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <Card className="h-full hover-depth interactive-depth depth-transition cursor-pointer card-depth-2 border-border">
                        <CardHeader className="text-center">
                          <motion.div
                            className="mb-3 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                          >
                            {(() => {
                              const Icon = getInterviewTipIcon(tip.icon);
                              return <Icon className="h-12 w-12" />;
                            })()}
                          </motion.div>
                          <CardTitle className="text-lg">{tip.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <CardDescription className="text-sm leading-relaxed">
                            {tip.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mock" className="space-y-6">
                <Card className="card-depth-2 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-primary" />
                      Mock Interview Sessions
                    </CardTitle>
                    <CardDescription className="text-base">
                      Practice with AI-powered mock interviews tailored to your
                      target role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">
                          Available Mock Interviews
                        </h3>
                        <div className="space-y-3">
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
                          >
                            <h4 className="font-medium">
                              Software Engineer Interview
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              45 minutes • Technical + Behavioral
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
                          >
                            <h4 className="font-medium">
                              Product Manager Interview
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              30 minutes • Strategy + Leadership
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
                          >
                            <h4 className="font-medium">
                              UX Designer Interview
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              35 minutes • Design + Problem Solving
                            </p>
                          </motion.div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">How it works</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                            >
                              1
                            </motion.div>
                            <p>Select your target role and experience level</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                            >
                              2
                            </motion.div>
                            <p>AI interviewer asks relevant questions</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                            >
                              3
                            </motion.div>
                            <p>Get detailed feedback and improvement tips</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Card className="card-depth-2 border-border">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Questions Practiced
                        </CardTitle>
                        <div className="bg-primary/10 rounded-lg w-8 h-8 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {completedQuestions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Out of{" "}
                          {Object.values(interviewQuestions).flat().length}{" "}
                          available
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Card className="card-depth-2 border-border">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Practice Sessions
                        </CardTitle>
                        <div className="bg-secondary/20 rounded-lg w-8 h-8 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-secondary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                          This week
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Card className="card-depth-2 border-border">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Average Score
                        </CardTitle>
                        <div className="bg-yellow-100 rounded-lg w-8 h-8 flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">8.5</div>
                        <p className="text-xs text-muted-foreground">
                          Out of 10
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <Card className="card-depth-2 border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Recent Practice Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">
                            Behavioral Interview Practice
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            2 days ago • 45 minutes
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Score: 8.7/10
                        </Badge>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">
                            Technical Interview Practice
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            5 days ago • 30 minutes
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Score: 8.2/10
                        </Badge>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </FeatureGate>
      </div>
    </div>
  );
}
