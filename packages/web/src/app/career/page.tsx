"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  DollarSign,
  Briefcase,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Mock career data - in real app, this would come from APIs
const careerStats = {
  applicationsSent: 45,
  interviewsScheduled: 8,
  offersReceived: 2,
  responseRate: 18, // percentage
  averageSalaryTarget: 120000,
  currentSalary: 95000,
  careerGoals: [
    {
      id: "1",
      title: "Land a Senior Developer Role",
      description: "Achieve senior-level position with leadership responsibilities",
      progress: 75,
      deadline: "2024-12-31",
      status: "in-progress",
    },
    {
      id: "2",
      title: "Increase Salary by 30%",
      description: "Negotiate salary increase to $120k+ annually",
      progress: 60,
      deadline: "2024-10-31",
      status: "in-progress",
    },
    {
      id: "3",
      title: "Complete 5 Technical Certifications",
      description: "AWS, React, Node.js, and database certifications",
      progress: 40,
      deadline: "2024-11-30",
      status: "in-progress",
    },
  ],
  monthlyProgress: [
    { month: "Jan", applications: 12, interviews: 2, offers: 0 },
    { month: "Feb", applications: 15, interviews: 3, offers: 1 },
    { month: "Mar", applications: 8, interviews: 1, offers: 0 },
    { month: "Apr", applications: 10, interviews: 2, offers: 1 },
  ],
  skillProgress: [
    { skill: "React", current: 85, target: 95 },
    { skill: "Node.js", current: 78, target: 90 },
    { skill: "TypeScript", current: 70, target: 85 },
    { skill: "AWS", current: 60, target: 80 },
    { skill: "System Design", current: 55, target: 75 },
  ],
  achievements: [
    {
      id: "1",
      title: "First Interview",
      description: "Scheduled your first technical interview",
      date: "2024-01-15",
      icon: "🎯",
    },
    {
      id: "2",
      title: "Offer Received",
      description: "Received your first job offer",
      date: "2024-02-20",
      icon: "🎉",
    },
    {
      id: "3",
      title: "Skill Milestone",
      description: "Reached 80% proficiency in React",
      date: "2024-03-10",
      icon: "🚀",
    },
  ],
};

const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Don't watch the clock; do what it does. Keep going.",
];

export default function CareerPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 10000); // Change quote every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access career overview.</p>
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
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Your Career Journey
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Track your progress, set goals, and achieve your career aspirations with comprehensive analytics and insights.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Motivational Quote */}
              <motion.div
                key={currentQuote}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6" />
                  <p className="text-lg italic">&ldquo;{motivationalQuotes[currentQuote]}&rdquo;</p>
                </div>
              </motion.div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Applications Sent
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{careerStats.applicationsSent}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Interviews Scheduled
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{careerStats.interviewsScheduled}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((careerStats.interviewsScheduled / careerStats.applicationsSent) * 100)}% response rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Offers Received
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{careerStats.offersReceived}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((careerStats.offersReceived / careerStats.applicationsSent) * 100)}% offer rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Salary Target
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(careerStats.averageSalaryTarget / 1000).toFixed(0)}k
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +26% from current salary
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Career Goals Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Career Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careerStats.careerGoals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                            {goal.progress}% Complete
                          </Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Career Goals
                    </CardTitle>
                    <CardDescription>
                      Track your progress toward career milestones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {careerStats.careerGoals.map((goal) => (
                        <div key={goal.id} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{goal.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {goal.description}
                              </p>
                            </div>
                            <Badge
                              variant={
                                goal.status === "completed"
                                  ? "default"
                                  : goal.status === "in-progress"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {goal.progress}%
                            </Badge>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                            <span>
                              {goal.status === "completed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <Clock className="h-4 w-4 inline" />
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Add New Goal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Set New Goal
                    </CardTitle>
                    <CardDescription>
                      Define a new career milestone to work towards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Goal Title</label>
                        <input
                          type="text"
                          placeholder="e.g., Get promoted to Senior Developer"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                          placeholder="Describe what you want to achieve..."
                          rows={3}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Target Date</label>
                        <input
                          type="date"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <Button className="w-full">
                        <Target className="h-4 w-4 mr-2" />
                        Create Goal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              {/* Monthly Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Job Search Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careerStats.monthlyProgress.map((month) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{month.month} 2024</span>
                          <div className="flex gap-4 text-sm">
                            <span>Apps: {month.applications}</span>
                            <span>Interviews: {month.interviews}</span>
                            <span>Offers: {month.offers}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-100 p-2 rounded text-center">
                            <div className="text-xs text-blue-700">Applications</div>
                            <div className="font-bold text-blue-900">{month.applications}</div>
                          </div>
                          <div className="bg-green-100 p-2 rounded text-center">
                            <div className="text-xs text-green-700">Interviews</div>
                            <div className="font-bold text-green-900">{month.interviews}</div>
                          </div>
                          <div className="bg-purple-100 p-2 rounded text-center">
                            <div className="text-xs text-purple-700">Offers</div>
                            <div className="font-bold text-purple-900">{month.offers}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skill Development */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                      Skill Development Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {careerStats.skillProgress.map((skill) => (
                        <div key={skill.skill} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill}</span>
                            <span className="text-sm text-muted-foreground">
                              {skill.current}% / {skill.target}%
                            </span>
                          </div>
                          <Progress value={(skill.current / skill.target) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Search Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Search Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Total Applications</span>
                        <span className="font-bold">{careerStats.applicationsSent}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Interview Rate</span>
                        <span className="font-bold">
                          {Math.round((careerStats.interviewsScheduled / careerStats.applicationsSent) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Offer Rate</span>
                        <span className="font-bold">
                          {Math.round((careerStats.offersReceived / careerStats.applicationsSent) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Average Response Time</span>
                        <span className="font-bold">7 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Salary Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          ${(careerStats.currentSalary / 1000).toFixed(0)}k
                        </div>
                        <p className="text-sm text-muted-foreground">Current Salary</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${(careerStats.averageSalaryTarget / 1000).toFixed(0)}k
                        </div>
                        <p className="text-sm text-muted-foreground">Target Salary</p>
                      </div>
                      <Progress
                        value={(careerStats.currentSalary / careerStats.averageSalaryTarget) * 100}
                        className="h-3"
                      />
                      <p className="text-center text-sm text-muted-foreground">
                        {Math.round(((careerStats.averageSalaryTarget - careerStats.currentSalary) / careerStats.currentSalary) * 100)}% increase needed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Career Achievements
                  </CardTitle>
                  <CardDescription>
                    Celebrate your milestones and accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {careerStats.achievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg text-center"
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h4 className="font-semibold text-yellow-900 mb-1">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-yellow-600">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {careerStats.achievements.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Achievements</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {careerStats.offersReceived}
                      </div>
                      <p className="text-sm text-muted-foreground">Job Offers</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {careerStats.interviewsScheduled}
                      </div>
                      <p className="text-sm text-muted-foreground">Interviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((careerStats.offersReceived / careerStats.applicationsSent) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
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
