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
    description: "Spend time learning about the company's culture, values, recent news, and products.",
    icon: "🏢",
  },
  {
    title: "Prepare Your Stories",
    description: "Have 3-5 stories ready that demonstrate your skills and experiences using the STAR method.",
    icon: "📚",
  },
  {
    title: "Practice Common Questions",
    description: "Prepare answers for behavioral, situational, and technical questions relevant to your role.",
    icon: "🎯",
  },
  {
    title: "Prepare Questions for Interviewer",
    description: "Have thoughtful questions ready that show your interest in the role and company.",
    icon: "❓",
  },
  {
    title: "Follow Up",
    description: "Send a thank-you email within 24 hours, reiterating your interest and key points.",
    icon: "📧",
  },
];

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
        const response = await fetch("/api/interview-questions");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Ace Your Next Interview
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Practice with AI-powered interview questions, get personalized feedback, and build confidence for your dream job.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Question Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(interviewQuestions).map(([category, questions]) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setCurrentQuestion(0);
                            setUserAnswer("");
                          }}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            selectedCategory === category
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-medium capitalize flex items-center gap-2">
                            {category === "behavioral" && <MessageSquare className="h-4 w-4" />}
                            {category === "technical" && <Lightbulb className="h-4 w-4" />}
                            {category === "situational" && <Users className="h-4 w-4" />}
                            {category === "leadership" && <Target className="h-4 w-4" />}
                            {category === "systemDesign" && <Briefcase className="h-4 w-4" />}
                            {category === "productSense" && <Star className="h-4 w-4" />}
                            {category.replace(/([A-Z])/g, ' $1').trim()} ({questions.length})
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {category === "behavioral" && "Past experiences and examples"}
                            {category === "technical" && "Coding and technical knowledge"}
                            {category === "situational" && "How you would handle scenarios"}
                            {category === "leadership" && "Management and team leadership"}
                            {category === "systemDesign" && "Architecture and scalability"}
                            {category === "productSense" && "Product thinking and strategy"}
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Questions Completed</span>
                          <span>{completedQuestions.length}/{getCurrentQuestions().length}</span>
                        </div>
                        <Progress value={(completedQuestions.length / getCurrentQuestions().length) * 100} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Practice Area */}
                <div className="lg:col-span-2 space-y-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading interview questions...</p>
                    </div>
                  ) : currentQuestionData ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{currentQuestionData.category}</Badge>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                currentQuestionData.difficulty === "Easy" ? "secondary" :
                                currentQuestionData.difficulty === "Medium" ? "default" : "destructive"
                              }
                            >
                              {currentQuestionData.difficulty}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Question {currentQuestion + 1} of {getCurrentQuestions().length}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-xl mt-4">
                          {currentQuestionData.question}
                        </CardTitle>
                      </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Answer Input */}
                      <div className="space-y-2">
                        <Label htmlFor="answer">Your Answer</Label>
                        <Textarea
                          id="answer"
                          placeholder="Type your answer here... Use the STAR method: Situation, Task, Action, Result"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          rows={6}
                          className="resize-none"
                        />
                      </div>

                      {/* Recording Controls */}
                      <div className="flex items-center gap-4">
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
                        <span className="text-sm text-muted-foreground">
                          Practice speaking your answer out loud
                        </span>
                      </div>

                          {/* Tips */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Tips for this question:
                            </h4>
                            <ul className="space-y-1 text-sm text-blue-800">
                              {currentQuestionData.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                            {currentQuestionData.tags && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {currentQuestionData.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setUserAnswer("")}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCompleteQuestion}
                          disabled={!userAnswer.trim()}
                        >
                          Mark Complete
                        </Button>
                            <Button
                              onClick={handleNextQuestion}
                              disabled={currentQuestion >= getCurrentQuestions().length - 1}
                            >
                              Next Question
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                      </div>
                    </CardFooter>
                  </Card>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No questions available
                      </h3>
                      <p className="text-gray-600">
                        Please select a question category to start practicing.
                      </p>
                    </div>
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
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="text-3xl mb-2">{tip.icon}</div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {tip.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mock" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Mock Interview Sessions
                  </CardTitle>
                  <CardDescription>
                    Practice with AI-powered mock interviews tailored to your target role.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Available Mock Interviews</h3>
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <h4 className="font-medium">Software Engineer Interview</h4>
                          <p className="text-sm text-muted-foreground">45 minutes • Technical + Behavioral</p>
                        </div>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <h4 className="font-medium">Product Manager Interview</h4>
                          <p className="text-sm text-muted-foreground">30 minutes • Strategy + Leadership</p>
                        </div>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <h4 className="font-medium">UX Designer Interview</h4>
                          <p className="text-sm text-muted-foreground">35 minutes • Design + Problem Solving</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">How it works</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <p>Select your target role and experience level</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            2
                          </div>
                          <p>AI interviewer asks relevant questions</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            3
                          </div>
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Questions Practiced
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedQuestions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of {Object.values(interviewQuestions).flat().length} available
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Practice Sessions
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      This week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Score
                    </CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.5</div>
                    <p className="text-xs text-muted-foreground">
                      Out of 10
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Practice Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Behavioral Interview Practice</h4>
                        <p className="text-sm text-muted-foreground">2 days ago • 45 minutes</p>
                      </div>
                      <Badge variant="secondary">Score: 8.7/10</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Technical Interview Practice</h4>
                        <p className="text-sm text-muted-foreground">5 days ago • 30 minutes</p>
                      </div>
                      <Badge variant="secondary">Score: 8.2/10</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </div>
  );
}
