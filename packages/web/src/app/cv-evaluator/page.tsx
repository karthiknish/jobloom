"use client";

import React, { useState, useCallback } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "../../components/UpgradePrompt";
import { EnhancedAtsScore } from "../../components/EnhancedAtsScore";
import { RealTimeAtsFeedback } from "../../components/RealTimeAtsFeedback";
import { CvAnalysisHistory } from "../../components/CvAnalysisHistory";
import { CvImprovementTracker } from "../../components/CvImprovementTracker";
import { CvUploadForm } from "../../components/CvUploadForm";
import { motion, AnimatePresence } from "framer-motion";
import { useApiQuery } from "../../hooks/useApi";
import { cvEvaluatorApi } from "../../utils/api/cvEvaluator";
import { ensureFirebaseApp } from "@/firebase/client";
import {
  FileText,
  BarChart3,
  Star,
  Search,
  Target,
  Upload,
  History,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Users,
  Shield,
  Award,
  Rocket,
  Lightbulb,
  ArrowRight,
  Play,
  RefreshCw,
  Eye,
  Download,
  Settings,
  Globe,
  Briefcase,
  BookOpen,
  GraduationCap,
  Code,
  Palette,
  FileCheck,
  FileSearch,
  Brain,
  LineChart,
  PieChart,
  Timer,
  TrendingUp as TrendingUpIcon,
  Activity,
  Filter,
  ChevronRight,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { PreConfiguredTabs, TabContent } from "@/lib/tabs-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CvEvaluatorPage() {
  // Ensure Firebase initialized
  ensureFirebaseApp();

  const { user, loading: authLoading } = useFirebaseAuth();
  const { plan } = useSubscription();
  const [activeTab, setActiveTab] = useState("upload");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const userRecordQueryFn = useCallback(
    () =>
      user && user.uid
        ? cvEvaluatorApi.getUserByFirebaseUid(user.uid)
        : Promise.reject(new Error("No user")),
    [user?.uid]
  );

  const userRecordQuery = useApiQuery(
    userRecordQueryFn,
    [user?.uid],
    { enabled: !!user?.uid }
  );
  const userRecord = userRecordQuery.data;

  const cvAnalysesQueryFn = useCallback(
    () =>
      userRecord
        ? cvEvaluatorApi.getUserCvAnalyses(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  const cvAnalysesQuery = useApiQuery(
    cvAnalysesQueryFn,
    [userRecord?._id],
    { enabled: !!userRecord }
  );
  const cvAnalyses = cvAnalysesQuery.data;

  const cvStatsQueryFn = useCallback(
    () =>
      userRecord
        ? cvEvaluatorApi.getCvAnalysisStats(userRecord._id)
        : Promise.reject(new Error("No user record")),
    [userRecord?._id]
  );

  const cvStatsQuery = useApiQuery(
    cvStatsQueryFn,
    [userRecord?._id],
    { enabled: !!userRecord }
  );
  const cvStats = cvStatsQuery.data;

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                CV Evaluator Pro
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Get AI-powered insights to improve your CV and increase your chances of landing interviews
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
              >
                <a href="/sign-in" className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Show enhanced error handling
  if (userRecordQuery.error) {
    const rawMessage = userRecordQuery.error.message;
    const isProd = process.env.NODE_ENV === 'production';
    const friendlyMessage = isProd
      ? 'We could not load your profile right now. Please retry shortly.'
      : (rawMessage === 'Unknown error'
          ? 'An unexpected issue occurred while contacting Firestore.'
          : rawMessage);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Unable to Load Profile
            </h1>
            <p className="text-gray-600 mb-6">{friendlyMessage}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => userRecordQuery.refetch()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUploadStarted = () => {
    setActiveTab('history');
    // Additional upload handling can be added here
  };

  const handleUploadSuccess = (analysisId: string) => {
    // Handle successful upload
    cvAnalysesQuery.refetch();
    cvStatsQuery.refetch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-lime-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-emerald-100";
    if (score >= 80) return "bg-green-100";
    if (score >= 70) return "bg-lime-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 50) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Enhanced Header */}
          <div className="surface-premium-elevated border-b border-border/50 bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-between"
                >
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <FileText className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    CV Evaluator Pro
                  </h1>
                  <p className="text-sm text-gray-600">
                    AI-powered CV analysis and optimization
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className={showAdvanced ? "bg-blue-50 text-blue-600" : ""}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advanced features</p>
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Premium Upgrade Banner */}
      {plan === "free" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4"
        >
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Unlock Advanced CV Analysis</h3>
                    <p className="text-sm text-amber-700">Get unlimited CV scans, detailed feedback, and AI-powered optimization</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeatureGate>
          {/* Enhanced Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {cvStatsQuery.loading ? (
              // Enhanced loading skeletons
              <>
                {[1, 2, 3, 4].map((index) => (
                  <Card key={index} className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : cvStats ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          Total Analyses
                        </CardTitle>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {cvStats.total}
                      </div>
                      <p className="text-xs text-gray-600">
                        CVs analyzed
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          {cvStats.total > 0 && (
                            <div className="w-16 h-1 bg-gray-200 rounded-full">
                              <div className="w-full h-1 bg-blue-500 rounded-full" />
                            </div>
                          )}
                          <span className="text-xs text-green-600">Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          Average Score
                        </CardTitle>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getScoreColor(cvStats.averageScore)}`}>
                        {cvStats.averageScore}%
                      </div>
                      <p className="text-xs text-gray-600">
                        Overall improvement
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={cvStats.averageScore >= 80 ? "default" : "secondary"}>
                            {cvStats.averageScore >= 80 ? "Excellent" : "Good"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          Keywords Found
                        </CardTitle>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Search className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {cvStats.averageKeywords}
                      </div>
                      <p className="text-xs text-gray-600">
                        Avg. per analysis
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1 bg-gray-200 rounded-full">
                            <div
                              className="h-1 bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(cvStats.averageKeywords * 5, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-purple-600">Keywords</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          Success Rate
                        </CardTitle>
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {cvStats.successRate}%
                      </div>
                      <p className="text-xs text-gray-600">
                        Improvement potential
                      </p>
                      <div className="mt-2">
                        <Progress value={cvStats.successRate} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : null}
          </motion.div>

          {/* Enhanced Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <PreConfiguredTabs
              configKey="CV_MANAGER"
              initialTab="upload"
              onTabChange={setActiveTab}
              variant="pills"
              showIcons={true}
              showDescriptions={true}
            />
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <TabContent key="upload" value="upload" activeTab={activeTab}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  {/* Upload Section */}
                  <Card className="bg-white shadow-sm border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            Upload Your CV
                          </CardTitle>
                          <CardDescription>
                            Upload your CV to get instant AI-powered analysis and optimization suggestions
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            ATS Optimized
                          </Badge>
                          <Badge variant="secondary">
                            <Zap className="w-3 h-3 mr-1" />
                            Real-time Feedback
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CvUploadForm
                        userId={user?.uid || ""}
                        onUploadStarted={handleUploadStarted}
                        onUploadSuccess={handleUploadSuccess}
                      />
                    </CardContent>
                  </Card>

                  {/* Enhanced ATS Score Demo */}
                  <Card className="bg-white shadow-sm border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            Enhanced ATS Scoring Demo
                          </CardTitle>
                          <CardDescription>
                            Experience our advanced ATS analysis system with real-time feedback
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 px-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Advanced ATS Analysis
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Our enhanced ATS scoring system provides detailed analysis with real-time feedback,
                          industry-specific keyword matching, and actionable improvement suggestions.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-lg font-semibold text-blue-600">7 Metrics</div>
                            <p className="text-sm text-blue-700">Detailed scoring breakdown</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="text-lg font-semibold text-green-600">Real-time</div>
                            <p className="text-sm text-green-700">Live feedback as you type</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-lg font-semibold text-purple-600">Industry-Specific</div>
                            <p className="text-sm text-purple-700">Tailored keyword analysis</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = '/ats-demo'}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Try Live Demo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Tips */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Lightbulb className="w-5 h-5" />
                        Pro Tips for Better Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-blue-900">Upload PDF</h4>
                            <p className="text-xs text-blue-700">
                              PDF files work best with our ATS analysis system
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-blue-900">Be Specific</h4>
                            <p className="text-xs text-blue-700">
                              Provide target role and industry for personalized feedback
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-blue-900">Update Regularly</h4>
                            <p className="text-xs text-blue-700">
                              Re-analyze after implementing improvements
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabContent>

            <TabContent key="history" value="history" activeTab={activeTab}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-600" />
                          Analysis History
                        </CardTitle>
                        <CardDescription>
                          Track your CV improvement over time
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cvAnalysesQuery.loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-48 mb-4" />
                            <div className="flex justify-between items-center">
                              <Skeleton className="h-8 w-20 rounded" />
                              <Skeleton className="h-2 w-24 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <CvAnalysisHistory analyses={cvAnalyses || []} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabContent>

            <TabContent key="tracking" value="tracking" activeTab={activeTab}>
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Progress Tracking
                    </CardTitle>
                    <CardDescription>
                      Monitor your CV improvement journey and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cvAnalysesQuery.loading ? (
                      <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading progress data...</p>
                      </div>
                    ) : (
                      <CvImprovementTracker analyses={cvAnalyses || []} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabContent>

            <TabContent key="insights" value="insights" activeTab={activeTab}>
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  {/* Insights Overview */}
                  <Card className="bg-white shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        AI-Powered Insights
                      </CardTitle>
                      <CardDescription>
                        Deep analysis of your CV performance and improvement areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">
                            {cvStats?.total || 0}
                          </div>
                          <p className="text-sm text-blue-700">Total Analyses</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Rocket className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            +{(cvStats?.averageScore || 0) - 50}%
                          </div>
                          <p className="text-sm text-green-700">Avg. Improvement</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">
                            {cvStats?.averageKeywords || 0}
                          </div>
                          <p className="text-sm text-purple-700">Keywords Found</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">
                            {cvStats?.successRate || 0}%
                          </div>
                          <p className="text-sm text-orange-700">Success Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Award className="w-5 h-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <Sparkles className="h-4 w-4" />
                          <AlertDescription>
                            Based on your analysis history, we recommend focusing on action verbs and quantifiable achievements to improve your CV scores by an average of 15-20%.
                          </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Top Improvements</h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Add quantifiable achievements</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Use strong action verbs</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Optimize for ATS parsing</span>
                              </li>
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Next Steps</h4>
                            <div className="space-y-2">
                              <Button className="w-full justify-start" variant="outline">
                                <Play className="w-4 h-4 mr-2" />
                                Analyze another CV
                              </Button>
                              <Button className="w-full justify-start" variant="outline">
                                <FileSearch className="w-4 h-4 mr-2" />
                                Compare with previous analysis
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabContent>
            </AnimatePresence>
        </FeatureGate>
      </div>
      </div>
    </div>
    </TooltipProvider>
  );
}