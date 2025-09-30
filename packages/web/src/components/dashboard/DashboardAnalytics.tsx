"use client";

import React from "react";
import { motion } from "framer-motion";
import { Application } from "@/types/dashboard";
import { CvAnalysis } from "@/types/api";
import { JobStats } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/UpgradePrompt";
import { TrendingUp, MapPin, CheckCircle, BarChart3 } from "lucide-react";
import { CvAnalysisHistory } from "@/components/CvAnalysisHistory";
import {
  calculateSuccessRate,
  calculateInterviewRate,
  calculateResponseRate,
  getWeeklyApplications,
  getSponsoredJobsPercentage,
  getAgencyJobsPercentage,
  formatApplicationDate,
} from "@/utils/dashboard";
import { ANALYTICS_GOALS } from "@/constants/dashboard";
import { slideInUp } from "@/styles/animations";

interface DashboardAnalyticsProps {
  applications: Application[];
  cvAnalyses: CvAnalysis[];
  jobStats?: JobStats;
}

export function DashboardAnalytics({
  applications,
  cvAnalyses,
  jobStats,
}: DashboardAnalyticsProps) {
  const weeklyApplications = getWeeklyApplications(applications);
  const successRate = calculateSuccessRate(applications);
  const interviewRate = calculateInterviewRate(applications);
  const responseRate = calculateResponseRate(applications);
  const sponsoredPercentage = getSponsoredJobsPercentage(applications);
  const agencyPercentage = getAgencyJobsPercentage(applications);

  return (
    <FeatureGate feature="advancedAnalytics">
      <motion.div
        variants={slideInUp}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Analytics & Insights
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Premium Feature</span>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30"
            >
              Premium
            </Badge>
          </div>
        </div>

        {/* CV Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle>CV Analysis History</CardTitle>
          </CardHeader>
          <CardContent>
            <CvAnalysisHistory analyses={cvAnalyses || []} />
          </CardContent>
        </Card>

        {/* Application Timeline */}
        {applications && applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  .slice(0, 10)
                  .map((application, index) => {
                    const statusColor =
                      {
                        interested: "bg-muted text-muted-foreground",
                        applied: "bg-sky-100 text-sky-800",
                        interviewing: "bg-violet-100 text-violet-800",
                        offered: "bg-emerald-100 text-emerald-800",
                        rejected: "bg-red-100 text-red-800",
                        withdrawn: "bg-muted text-muted-foreground",
                      }[application.status] ||
                      "bg-muted text-muted-foreground";

                    return (
                      <div
                        key={application._id}
                        className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate">
                              {application.job?.title}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                            >
                              {application.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {application.job?.company} •{" "}
                            {application.job?.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatApplicationDate(application.createdAt || 0)}
                            {application.appliedDate && (
                              <span className="ml-2">
                                • Applied{" "}
                                {Math.floor(
                                  (Date.now() - application.appliedDate) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days later
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {applications.length > 10 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    View All Applications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-sky-100">
                      <BarChart3 className="h-4 w-4 text-sky-600" />
                    </div>
                    <span className="ml-3 font-medium">This Week</span>
                  </div>
                  <span className="text-lg font-bold text-sky-600">
                    {weeklyApplications}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-emerald-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="ml-3 font-medium">Success Rate</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {successRate}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-amber-100">
                      <span className="text-amber-600">⏱</span>
                    </div>
                    <span className="ml-3 font-medium">Avg Response</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    3.2 days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Applications per Job
                      </span>
                      <span className="font-medium">
                        {jobStats.totalJobs > 0
                          ? (
                              jobStats.totalApplications / jobStats.totalJobs
                            ).toFixed(1)
                          : 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Interview Rate
                      </span>
                      <span className="font-medium">{interviewRate}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Sponsored Jobs Applied
                      </span>
                      <span className="font-medium">{sponsoredPercentage}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Agency Jobs Applied
                      </span>
                      <span className="font-medium">{agencyPercentage}%</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Setting and Progress Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Job Search Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Weekly Application Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Applications</span>
                  <span className="text-sm text-muted-foreground">
                    {weeklyApplications} / {ANALYTICS_GOALS.weeklyApplications}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (weeklyApplications / ANALYTICS_GOALS.weeklyApplications) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {ANALYTICS_GOALS.weeklyApplications} applications per week
                </p>
              </div>

              {/* Interview Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Interviews This Month</span>
                  <span className="text-sm text-muted-foreground">
                    {applications?.filter((a) => a.status === "interviewing").length ||
                      0}{" "}
                    / {ANALYTICS_GOALS.monthlyInterviews}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((applications?.filter((a) => a.status === "interviewing")
                          .length || 0) /
                          ANALYTICS_GOALS.monthlyInterviews) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {ANALYTICS_GOALS.monthlyInterviews} interviews per month
                </p>
              </div>

              {/* Response Rate Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {responseRate}% / {ANALYTICS_GOALS.responseRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (responseRate / ANALYTICS_GOALS.responseRate) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {ANALYTICS_GOALS.responseRate}% response rate
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    Set Custom Goals
                  </Button>
                  <Button size="sm" variant="outline">
                    View Progress Report
                  </Button>
                  <Button size="sm" variant="outline">
                    Weekly Summary
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </FeatureGate>
  );
}