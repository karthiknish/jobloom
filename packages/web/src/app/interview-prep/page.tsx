"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import InterviewPrepHero from "@/components/interview-prep/InterviewPrepHero";
import QuestionTypesSidebar from "@/components/interview-prep/QuestionTypesSidebar";
import QuestionPracticeArea from "@/components/interview-prep/QuestionPracticeArea";
import InterviewTipsGrid from "@/components/interview-prep/InterviewTipsGrid";
import MockInterviewSection from "@/components/interview-prep/MockInterviewSection";
import ProgressDashboard from "@/components/interview-prep/ProgressDashboard";

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
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [industries, setIndustries] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Industry display names
  const industryLabels: Record<string, string> = {
    all: "All Industries",
    general: "General",
    technology: "Technology / Software",
    finance: "Finance / Banking",
    healthcare: "Healthcare",
    marketing: "Marketing / Sales",
    consulting: "Consulting",
    "data-science": "Data Science / Analytics",
  };

  // Fetch interview questions when industry changes
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const industryParam = selectedIndustry !== "all" ? `?industry=${selectedIndustry}` : "";
        const response = await fetch(`/api/interview-questions/authenticated${industryParam}`);
        if (response.ok) {
          const data = await response.json();
          setInterviewQuestions(data.data);
          if (data.industries) {
            setIndustries(data.industries);
          }
          if (data.totalQuestions !== undefined) {
            setTotalQuestions(data.totalQuestions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch interview questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedIndustry]);


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

      <InterviewPrepHero />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
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
              {/* Industry Selector */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label htmlFor="industry-select" className="text-sm font-medium text-muted-foreground">
                    Filter by Industry:
                  </label>
                  <select
                    id="industry-select"
                    value={selectedIndustry}
                    onChange={(e) => {
                      setSelectedIndustry(e.target.value);
                      setCurrentQuestion(0);
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px]"
                  >
                    <option value="all">All Industries</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industryLabels[industry] || industry}
                      </option>
                    ))}
                  </select>
                </div>
                {totalQuestions > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {totalQuestions} questions available
                  </span>
                )}
              </div>

              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="practice">Practice Questions</TabsTrigger>
                <TabsTrigger value="tips">Interview Tips</TabsTrigger>
                <TabsTrigger value="mock">Mock Interviews</TabsTrigger>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionTypesSidebar
                    interviewQuestions={interviewQuestions}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={(category) => {
                      setSelectedCategory(category);
                      setCurrentQuestion(0);
                      setUserAnswer("");
                    }}
                    completedQuestions={completedQuestions}
                    loading={loading}
                  />

                  <div className="lg:col-span-2 space-y-6">
                    <QuestionPracticeArea
                      currentQuestionData={currentQuestionData}
                      currentQuestion={currentQuestion}
                      userAnswer={userAnswer}
                      setUserAnswer={setUserAnswer}
                      isRecording={isRecording}
                      toggleRecording={toggleRecording}
                      handleCompleteQuestion={handleCompleteQuestion}
                      handleNextQuestion={handleNextQuestion}
                      getCurrentQuestions={getCurrentQuestions}
                      loading={loading}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="space-y-6">
                <InterviewTipsGrid />
              </TabsContent>

              <TabsContent value="mock" className="space-y-6">
                <MockInterviewSection />
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <ProgressDashboard
                  completedQuestions={completedQuestions}
                  interviewQuestions={interviewQuestions}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
          </motion.div>
        </FeatureGate>
      </div>
    </div>
  );
}
