"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsProvider, useAnalytics } from "@/providers/analytics-provider";
import { analyticsService } from "@/firebase/analytics";
import { useJobAnalytics } from "@/providers/analytics-provider";
import { useCvAnalytics } from "@/providers/analytics-provider";
import { useDashboardAnalytics } from "@/providers/analytics-provider";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
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
        // In a real implementation, this would fetch from Firebase Analytics API
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load analytics data</p>
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

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your application&apos;s performance and user engagement</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Page Views"
            value={formatNumber(analyticsData.pageViews)}
            description="Total page views"
            trend="up"
            trendValue={12.3}
          />
          <MetricCard
            label="Unique Users"
            value={formatNumber(analyticsData.uniqueUsers)}
            description="Unique visitors"
            trend="up"
            trendValue={8.7}
          />
          <MetricCard
            label="Avg. Session"
            value={formatDuration(analyticsData.avgSessionDuration)}
            description="Average session duration"
            trend="up"
            trendValue={15.2}
          />
          <MetricCard
            label="Conversion Rate"
            value={`${analyticsData.conversionRate}%`}
            description="User conversion rate"
            trend="up"
            trendValue={3.8}
          />
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Most visited pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topPages.map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-8">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{page.page}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatNumber(page.views)}</div>
                          <div className="text-sm text-gray-500">
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
                  <CardTitle>Bounce Rate</CardTitle>
                  <CardDescription>Percentage of single-page sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {analyticsData.bounceRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          {analyticsData.bounceRate < 50 ? 'Good' : analyticsData.bounceRate < 70 ? 'Average' : 'Poor'}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={analyticsData.bounceRate} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Actions</CardTitle>
                <CardDescription>Most common user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.userActions.map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8">
                          {index + 1}
                        </Badge>
                        <span className="capitalize font-medium">{action.action.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(action.count)}</div>
                        <div className="text-sm text-gray-500">
                          {((action.count / analyticsData.pageViews) * 100).toFixed(2)}% of pages
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey through key conversion points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      100%
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Page Views</div>
                      <div className="text-sm text-gray-600">Users visit the site</div>
                      <div className="text-xs text-green-600 mt-1">{formatNumber(analyticsData.pageViews)} users</div>
                    </div>
                  </div>
                  
                  <div className="border-l-8 border-blue-300 pl-4 ml-8 space-y-8">
                    {[
                      { step: 'Engagement', rate: 85, description: 'Users interact with content', count: Math.floor(analyticsData.pageViews * 0.85) },
                      { step: 'Registration', rate: 25, description: 'Users sign up or log in', count: Math.floor(analyticsData.pageViews * 0.25) },
                      { step: 'Core Actions', rate: 18, description: 'Users perform key actions', count: Math.floor(analyticsData.pageViews * 0.18) },
                      { step: 'Conversions', rate: Math.floor(analyticsData.conversionRate), description: 'Users complete goals', count: Math.floor(analyticsData.pageViews * (analyticsData.conversionRate / 100)) },
                    ].map((stage, index) => (
                      <div key={stage.step} className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-blue-300' : index === 1 ? 'bg-blue-400' : index === 2 ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {stage.rate}%
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{stage.step}</div>
                          <div className="text-sm text-gray-600">{stage.description}</div>
                          <div className="text-xs text-blue-600 mt-1">{formatNumber(stage.count)} users</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Load Times</CardTitle>
                  <CardDescription>Average page load performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { metric: 'Average Load Time', value: '2.1s', target: '< 3s', status: 'good' },
                      { metric: 'First Contentful Paint', value: '1.2s', target: '< 1.8s', status: 'good' },
                      { metric: 'Largest Contentful Paint', value: '2.8s', target: '< 2.5s', status: 'warning' },
                      { metric: 'Time to Interactive', value: '3.2s', target: '< 3.8s', status: 'good' },
                    ].map((item) => (
                      <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.metric}</div>
                          <div className="text-sm text-gray-500">Target: {item.target}</div>
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
                  <CardTitle>Device Distribution</CardTitle>
                  <CardDescription>Users by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { device: 'Desktop', percentage: 65, trend: 'down' },
                      { device: 'Mobile', percentage: 28, trend: 'up' },
                      { device: 'Tablet', percentage: 7, trend: 'neutral' },
                    ].map((item) => (
                      <div key={item.device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.device}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{item.percentage}%</span>
                            <Badge variant={item.trend === 'up' ? 'default' : item.trend === 'down' ? 'destructive' : 'secondary'}>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricCard({ label, value, description, trend, trendValue }: AnalyticsMetric) {
  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          {trend && trendValue && (
            <div className={`text-sm font-medium ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)} {trendValue}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
