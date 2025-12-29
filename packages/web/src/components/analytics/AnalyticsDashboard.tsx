"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Users, 
  Clock, 
  MousePointerClick, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Zap,
  FileText,
  Building2,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/providers/analytics-provider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { analyticsApi } from "@/utils/api/analytics";

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[400px] gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: React.ElementType;
  colorClass: string;
}

interface AnalyticsData {
  users: {
    total: number;
    newLast30Days: number;
    activeLast7Days: number;
    premium: number;
    free: number;
    conversionRate: number;
    activeRate: number;
  };
  content: {
    blogPosts: number;
    publishedPosts: number;
    blogViews: number;
  };
  platform: {
    sponsors: number;
    contactSubmissions: number;
    cvAnalyses: number;
    jobsSaved: number;
  };
  engagement: {
    bounceRate: number;
    avgSessionDuration: number;
  };
  aiFeedback: {
    total: number;
    positive: number;
    negative: number;
    sentimentScore: number;
    thisWeek: number;
    byType: Record<string, { total: number; positive: number; negative: number }>;
  };
  topPages: Array<{ page: string; views: number }>;
  userActions: Array<{ action: string; count: number }>;
  timestamp: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const ANALYTICS_TABS = [
  { id: "overview", label: "Overview" },
  { id: "engagement", label: "Engagement" },
  { id: "conversions", label: "Conversions" },
  { id: "ai-feedback", label: "AI Feedback" },
  { id: "performance", label: "Performance" },
];

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { trackPageView } = useAnalytics();
  const { toast } = useToast();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rawData = await analyticsApi.getAdminAnalytics();
      
      // Transform new API response to existing interface
      const data: AnalyticsData = {
        users: {
          total: rawData.users?.total ?? 0,
          newLast30Days: rawData.users?.newThisMonth ?? 0,
          activeLast7Days: rawData.activeUsers?.weekly ?? 0,
          premium: rawData.users?.premium ?? 0,
          free: rawData.users?.free ?? 0,
          conversionRate: (rawData.users?.total ?? 0) > 0 
            ? Math.round(((rawData.users?.premium ?? 0) / (rawData.users?.total ?? 1)) * 10000) / 100 
            : 0,
          activeRate: (rawData.users?.total ?? 0) > 0 
            ? Math.round(((rawData.activeUsers?.weekly ?? 0) / (rawData.users?.total ?? 1)) * 10000) / 100 
            : 0,
        },
        content: {
          blogPosts: 0, // Not included in new API
          publishedPosts: 0,
          blogViews: 0,
        },
        platform: {
          sponsors: 0,
          contactSubmissions: 0,
          cvAnalyses: rawData.features?.cvAnalyses || 0,
          jobsSaved: rawData.applications?.total || 0,
        },
        engagement: {
          bounceRate: 0,
          avgSessionDuration: 0,
        },
        aiFeedback: {
          total: rawData.aiFeedback?.total ?? 0,
          positive: rawData.aiFeedback?.positive ?? 0,
          negative: rawData.aiFeedback?.negative ?? 0,
          sentimentScore: rawData.aiFeedback?.sentimentScore ?? 0,
          thisWeek: rawData.aiFeedback?.thisWeek ?? 0,
          byType: rawData.aiFeedback?.byType ?? {},
        },
        topPages: [],
        userActions: rawData.events?.top?.map((e: any) => ({
          action: e.event,
          count: e.count,
        })) || [],
        timestamp: Date.now(),
      };
      
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast({
        variant: "destructive",
        title: "Analytics error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Track dashboard view
    trackPageView('/admin/analytics', 'Analytics Dashboard');
    
    // Load analytics data
    fetchAnalyticsData();
  }, [trackPageView, fetchAnalyticsData]);

  if (isLoading) {
    return <AnalyticsDashboardSkeleton />;
  }

  if (error || !analyticsData) {
    return (
      <EmptyState
        title="Analytics unavailable"
        description="We couldn't load analytics data. Please try again."
        actions={[{
          label: "Retry",
          onClick: fetchAnalyticsData,
          variant: "outline",
          icon: RefreshCw,
        }]}
      />
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate total page views from topPages
  const totalPageViews = analyticsData.topPages.reduce((sum, page) => sum + page.views, 0);

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Monitor your application's performance and user engagement metrics.
          </p>
        </div>
        <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Users"
          value={formatNumber(analyticsData.users.total)}
          description={`${analyticsData.users.newLast30Days} new this month`}
          trend="up"
          trendValue={analyticsData.users.newLast30Days > 0 ? Math.round((analyticsData.users.newLast30Days / analyticsData.users.total) * 100) : 0}
          icon={Users}
          colorClass="bg-purple-100 text-purple-600"
        />
        <MetricCard
          label="Active Users"
          value={formatNumber(analyticsData.users.activeLast7Days)}
          description="Active in last 7 days"
          trend={analyticsData.users.activeRate > 20 ? "up" : "neutral"}
          trendValue={analyticsData.users.activeRate}
          icon={Activity}
          colorClass="bg-blue-100 text-blue-600"
        />
        <MetricCard
          label="Premium Users"
          value={formatNumber(analyticsData.users.premium)}
          description="Paid subscriptions"
          trend="up"
          trendValue={analyticsData.users.conversionRate}
          icon={Zap}
          colorClass="bg-amber-100 text-amber-600"
        />
        <MetricCard
          label="Resume Analyses"
          value={formatNumber(analyticsData.platform.cvAnalyses)}
          description="Total Resume evaluations"
          trend="up"
          trendValue={0}
          icon={FileText}
          colorClass="bg-green-100 text-green-600"
        />
      </div>

      {/* Platform Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sponsors</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.platform.sponsors)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blog Posts</p>
                <p className="text-2xl font-bold">{analyticsData.content.publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <MessageSquare className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Forms</p>
                <p className="text-2xl font-bold">{analyticsData.platform.contactSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jobs Saved</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.platform.jobsSaved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-12 bg-white border-border/50 shadow-md rounded-xl px-4">
              <span className="text-sm font-bold text-foreground">
                {ANALYTICS_TABS.find(t => t.id === activeTab)?.label || "Select Tab"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-2xl">
              {ANALYTICS_TABS.map((tab) => (
                <SelectItem key={tab.id} value={tab.id} className="py-3">
                  <span className="font-medium">{tab.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop Tabs */}
        <TabsList className="hidden sm:grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary" />
                  Top Pages
                </CardTitle>
                <CardDescription className="text-gray-500">Most visited pages in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 rounded-full border-gray-200 text-gray-600">
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-sm text-gray-700">{page.page}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-gray-900">{formatNumber(page.views)}</div>
                        <div className="text-xs text-gray-500">
                          {totalPageViews > 0 ? ((page.views / totalPageViews) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary" />
                  User Engagement
                </CardTitle>
                <CardDescription className="text-gray-500">Active users vs total users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 py-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold tracking-tighter text-primary">
                        {analyticsData.users.activeRate.toFixed(1)}%
                      </div>
                      <Badge 
                        variant={analyticsData.users.activeRate > 20 ? "default" : "secondary"}
                        className="mt-3"
                      >
                        {analyticsData.users.activeRate > 30 ? 'Excellent Engagement' : analyticsData.users.activeRate > 15 ? 'Good Engagement' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>Target: &gt;25%</span>
                      <span>100%</span>
                    </div>
                    <Progress 
                      value={analyticsData.users.activeRate} 
                      className="h-3 bg-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <MousePointerClick className="h-5 w-5 text-primary" />
                  User Actions
                </CardTitle>
                <CardDescription className="text-gray-500">Most common user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.userActions.map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="capitalize font-medium text-gray-700">{action.action.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatNumber(action.count)}</div>
                        <div className="text-xs text-gray-500">
                          {analyticsData.users.total > 0 ? ((action.count / analyticsData.users.total) * 100).toFixed(2) : 0}% of users
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ai-feedback" className="space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary" />
                  Sentiment Breakdown
                </CardTitle>
                <CardDescription className="text-gray-500">Overall user sentiment for AI suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 py-4">
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">{analyticsData.aiFeedback.positive}</div>
                      <div className="text-sm font-medium text-gray-500">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">{analyticsData.aiFeedback.sentimentScore}%</div>
                      <div className="text-sm font-medium text-gray-500 italic">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-600">{analyticsData.aiFeedback.negative}</div>
                      <div className="text-sm font-medium text-gray-500">Negative</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span className="text-red-500">Negative ({analyticsData.aiFeedback.negative})</span>
                      <span className="text-green-500">Positive ({analyticsData.aiFeedback.positive})</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-red-100 overflow-hidden flex">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${analyticsData.aiFeedback.sentimentScore}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="h-5 w-5 text-primary" />
                  Problematic Areas
                </CardTitle>
                <CardDescription className="text-gray-500">Content types with highest negative feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.aiFeedback.byType)
                    .sort(([, a], [, b]) => b.negative - a.negative)
                    .map(([type, stats]) => (
                    <div key={type} className="space-y-2">
                       <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-gray-700">{type.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{stats.total} total</span>
                          <span className="text-red-600 font-bold">{stats.negative} negative</span>
                        </div>
                      </div>
                      <Progress 
                        value={(stats.negative / Math.max(stats.total, 1)) * 100} 
                        className="h-1.5 bg-gray-100" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="h-5 w-5 text-primary" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription className="text-gray-500">User journey through key conversion points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 relative">
                  {/* Vertical line connecting steps */}
                  <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gray-200 -z-10" />
                  
                  <div className="flex items-center space-x-4 bg-white p-2 rounded-lg border border-gray-100">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-bold shadow-sm z-10">
                      100%
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Total Users</div>
                      <div className="text-sm text-gray-500">Registered on platform</div>
                      <div className="text-xs mt-1 font-medium text-primary">
                        {formatNumber(analyticsData.users.total)} users
                      </div>
                    </div>
                  </div>
                  
                  {[
                    { step: 'Active Users', rate: analyticsData.users.activeRate, description: 'Active in last 7 days', count: analyticsData.users.activeLast7Days },
                    { step: 'CV Analyzed', rate: analyticsData.users.total > 0 ? Math.round((analyticsData.platform.cvAnalyses / analyticsData.users.total) * 100) : 0, description: 'Used Resume evaluator', count: analyticsData.platform.cvAnalyses },
                    { step: 'Jobs Saved', rate: analyticsData.users.total > 0 ? Math.round((analyticsData.platform.jobsSaved / analyticsData.users.total) * 100) : 0, description: 'Saved job listings', count: analyticsData.platform.jobsSaved },
                    { step: 'Premium', rate: analyticsData.users.conversionRate, description: 'Upgraded to premium', count: analyticsData.users.premium },
                  ].map((stage, index) => (
                    <div key={stage.step} className="flex items-center space-x-4 bg-white p-2 rounded-lg border border-gray-100">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm z-10 border-4 border-white",
                        index === 0 ? "bg-blue-400" : 
                        index === 1 ? "bg-blue-500" : 
                        index === 2 ? "bg-blue-600" : 
                        "bg-green-600"
                      )}>
                        {Math.round(stage.rate)}%
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{stage.step}</div>
                        <div className="text-sm text-gray-500">{stage.description}</div>
                        <div className="text-xs mt-1 font-medium text-primary">
                          {formatNumber(stage.count)} users
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="h-5 w-5 text-primary" />
                  Page Load Times
                </CardTitle>
                <CardDescription className="text-gray-500">Average page load performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: 'Average Load Time', value: '2.1s', target: '< 3s', status: 'good' },
                    { metric: 'First Contentful Paint', value: '1.2s', target: '< 1.8s', status: 'good' },
                    { metric: 'Largest Contentful Paint', value: '2.8s', target: '< 2.5s', status: 'warning' },
                    { metric: 'Time to Interactive', value: '3.2s', target: '< 3.8s', status: 'good' },
                  ].map((item) => (
                    <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-gray-700">{item.metric}</div>
                        <div className="text-xs text-gray-500">Target: {item.target}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{item.value}</span>
                        <Badge variant={item.status === 'good' ? 'default' : 'destructive'}>
                          {item.status === 'good' ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Monitor className="h-5 w-5 text-primary" />
                  Device Distribution
                </CardTitle>
                <CardDescription className="text-gray-500">Users by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { device: 'Desktop', percentage: 65, trend: 'down', icon: Monitor },
                    { device: 'Mobile', percentage: 28, trend: 'up', icon: Smartphone },
                    { device: 'Tablet', percentage: 7, trend: 'neutral', icon: Tablet },
                  ].map((item) => (
                    <div key={item.device} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">{item.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                          <Badge variant="outline" className={cn(
                            "text-xs px-1 py-0 h-5",
                            item.trend === 'up' ? "text-green-600 border-green-200 bg-green-50" : 
                            item.trend === 'down' ? "text-red-600 border-red-200 bg-red-50" : 
                            "text-gray-600 border-gray-200 bg-gray-50"
                          )}>
                            {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2 bg-gray-100" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function MetricCard({ label, value, description, trend, trendValue, icon: Icon, colorClass }: AnalyticsMetric) {
  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return "text-green-600";
      case 'down': return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4" />;
      case 'down': return <ArrowDownRight className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-lg", colorClass)}>
              <Icon className="h-6 w-6" />
            </div>
            {trend && trendValue && (
              <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor(trend))}>
                {getTrendIcon(trend)}
                {trendValue}%
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <h3 className="text-2xl font-semibold mt-1 text-gray-900">{value}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
