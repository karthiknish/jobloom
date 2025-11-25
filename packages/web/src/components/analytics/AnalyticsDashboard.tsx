"use client";

import React, { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalytics } from "@/providers/analytics-provider";
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: React.ElementType;
  colorClass: string;
}

interface AnalyticsSummary {
  pageViews: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  userActions: Array<{ action: string; count: number }>;
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

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track dashboard view
    trackPageView('/admin/analytics', 'Analytics Dashboard');
    
    // Load analytics data (mock data for now - would fetch from analytics service)
    const loadAnalyticsData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockData: AnalyticsSummary = {
          pageViews: 15420,
          uniqueUsers: 3204,
          avgSessionDuration: 185, // seconds
          bounceRate: 42.3, // percentage
          conversionRate: 12.7, // percentage
          topPages: [
            { page: '/', views: 5234 },
            { page: '/dashboard', views: 2134 },
            { page: '/cv-evaluator', views: 1892 },
            { page: '/application', views: 875 },
            { page: '/jobs', views: 654 },
          ],
          userActions: [
            { action: 'job_applied', count: 234 },
            { action: 'cv_uploaded', count: 189 },
            { action: 'premium_upgraded', count: 67 },
            { action: 'interview_completed', count: 45 },
          ],
        };

        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [trackPageView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Failed to load analytics data</p>
        </div>
      </div>
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

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Monitor your application's performance and user engagement metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Page Views"
          value={formatNumber(analyticsData.pageViews)}
          description="Total page views"
          trend="up"
          trendValue={12.3}
          icon={Globe}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <MetricCard
          label="Unique Users"
          value={formatNumber(analyticsData.uniqueUsers)}
          description="Unique visitors"
          trend="up"
          trendValue={8.7}
          icon={Users}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <MetricCard
          label="Avg. Session"
          value={formatDuration(analyticsData.avgSessionDuration)}
          description="Average session duration"
          trend="up"
          trendValue={15.2}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${analyticsData.conversionRate}%`}
          description="User conversion rate"
          trend="up"
          trendValue={3.8}
          icon={Zap}
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Top Pages
                </CardTitle>
                <CardDescription>Most visited pages in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between group hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 rounded-full">
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-sm">{page.page}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatNumber(page.views)}</div>
                        <div className="text-xs text-muted-foreground">
                          {((page.views / analyticsData.pageViews) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Bounce Rate
                </CardTitle>
                <CardDescription>Percentage of single-page sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 py-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold tracking-tighter text-primary">
                        {analyticsData.bounceRate.toFixed(1)}%
                      </div>
                      <Badge 
                        variant={analyticsData.bounceRate < 50 ? "default" : "secondary"}
                        className="mt-3"
                      >
                        {analyticsData.bounceRate < 50 ? 'Good Performance' : analyticsData.bounceRate < 70 ? 'Average' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>Target: &lt;40%</span>
                      <span>100%</span>
                    </div>
                    <Progress 
                      value={analyticsData.bounceRate} 
                      className="h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-primary" />
                  User Actions
                </CardTitle>
                <CardDescription>Most common user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.userActions.map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="capitalize font-medium">{action.action.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(action.count)}</div>
                        <div className="text-xs text-muted-foreground">
                          {((action.count / analyticsData.pageViews) * 100).toFixed(2)}% of pages
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>User journey through key conversion points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 relative">
                  {/* Vertical line connecting steps */}
                  <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border -z-10" />
                  
                  <div className="flex items-center space-x-4 bg-card p-2 rounded-lg">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-bold shadow-sm z-10">
                      100%
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Page Views</div>
                      <div className="text-sm text-muted-foreground">Users visit the site</div>
                      <div className="text-xs mt-1 font-medium text-primary">
                        {formatNumber(analyticsData.pageViews)} users
                      </div>
                    </div>
                  </div>
                  
                  {[
                    { step: 'Engagement', rate: 85, description: 'Users interact with content', count: Math.floor(analyticsData.pageViews * 0.85) },
                    { step: 'Registration', rate: 25, description: 'Users sign up or log in', count: Math.floor(analyticsData.pageViews * 0.25) },
                    { step: 'Core Actions', rate: 18, description: 'Users perform key actions', count: Math.floor(analyticsData.pageViews * 0.18) },
                    { step: 'Conversions', rate: Math.floor(analyticsData.conversionRate), description: 'Users complete goals', count: Math.floor(analyticsData.pageViews * (analyticsData.conversionRate / 100)) },
                  ].map((stage, index) => (
                    <div key={stage.step} className="flex items-center space-x-4 bg-card p-2 rounded-lg">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm z-10 border-4 border-background",
                        index === 0 ? "bg-blue-400" : 
                        index === 1 ? "bg-blue-500" : 
                        index === 2 ? "bg-blue-600" : 
                        "bg-green-600"
                      )}>
                        {stage.rate}%
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{stage.step}</div>
                        <div className="text-sm text-muted-foreground">{stage.description}</div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Page Load Times
                </CardTitle>
                <CardDescription>Average page load performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: 'Average Load Time', value: '2.1s', target: '< 3s', status: 'good' },
                    { metric: 'First Contentful Paint', value: '1.2s', target: '< 1.8s', status: 'good' },
                    { metric: 'Largest Contentful Paint', value: '2.8s', target: '< 2.5s', status: 'warning' },
                    { metric: 'Time to Interactive', value: '3.2s', target: '< 3.8s', status: 'good' },
                  ].map((item) => (
                    <div key={item.metric} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{item.metric}</div>
                        <div className="text-xs text-muted-foreground">Target: {item.target}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{item.value}</span>
                        <Badge variant={item.status === 'good' ? 'default' : 'destructive'}>
                          {item.status === 'good' ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Device Distribution
                </CardTitle>
                <CardDescription>Users by device type</CardDescription>
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
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.percentage}%</span>
                          <Badge variant="outline" className={cn(
                            "text-xs px-1 py-0 h-5",
                            item.trend === 'up' ? "text-green-600 border-green-200 bg-green-50" : 
                            item.trend === 'down' ? "text-red-600 border-red-200 bg-red-50" : 
                            "text-gray-600"
                          )}>
                            {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
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
      case 'up': return "text-green-600 dark:text-green-400";
      case 'down': return "text-red-600 dark:text-red-400";
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
