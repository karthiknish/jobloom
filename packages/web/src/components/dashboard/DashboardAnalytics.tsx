"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Application } from "@/types/dashboard";
import { CvAnalysis } from "@/types/api";
import { JobStats } from "@/types/dashboard";
import { ANALYTICS_GOALS } from "@hireall/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/UpgradePrompt";
import { useSubscription } from "@/providers/subscription-provider";
import { TrendingUp, MapPin, CheckCircle, BarChart3, DollarSign } from "lucide-react";
import { CvAnalysisHistory } from "@/components/CvAnalysisHistory";
import { EmptyState, EmptyStateInline } from "@/components/ui/EmptyState";
import { GoalsSettingsModal } from "@/components/dashboard/GoalsSettingsModal";
import { ProgressReportModal } from "@/components/dashboard/ProgressReportModal";
import { WeeklySummaryModal } from "@/components/dashboard/WeeklySummaryModal";
import {
  calculateSuccessRate,
  calculateResponseRate,
  getWeeklyApplications,
  getSponsoredJobsPercentage,
  getAgencyJobsPercentage,
  formatApplicationDate,
  calculateFunnelData,
  calculateTimeToOffer,
  getResponseRateByCompany,
  getSuccessRateByJobType,
  calculateSalaryGrowth,
  calculateSalaryMetrics,
} from "@/utils/dashboard";
import { slideInUp } from "@/styles/animations";
import { settingsApi } from "@/utils/api/settings";
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from "@/constants/storageKeys";
import { showError, showSuccess } from "@/components/ui/Toast";

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
  const { isAdmin } = useSubscription();

  // Modal states
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);
  
  // Goals state
  const [goals, setGoals] = useState<{
    weeklyApplications: number;
    responseRate: number;
  }>({
    weeklyApplications: ANALYTICS_GOALS.weeklyApplications,
    responseRate: ANALYTICS_GOALS.responseRate,
  });

  // Load goals from Firestore-backed preferences, with localStorage fallback + migration
  useEffect(() => {
    let cancelled = false;

    const loadGoals = async () => {
      const localGoals = readAndMigrateJsonFromStorage<typeof goals>(
        STORAGE_KEYS.goals,
        LEGACY_STORAGE_KEYS.goals
      );

      try {
        const result = await settingsApi.getPreferences();
        const remoteGoals = (result as any)?.preferences?.goals;

        const isValidRemoteGoals =
          remoteGoals &&
          typeof remoteGoals.weeklyApplications === "number" &&
          typeof remoteGoals.responseRate === "number";

        if (cancelled) return;

        if (isValidRemoteGoals) {
          setGoals(remoteGoals);
          writeJsonToStorage(STORAGE_KEYS.goals, remoteGoals, LEGACY_STORAGE_KEYS.goals);
          return;
        }

        if (localGoals) {
          setGoals(localGoals);
          // Best-effort push local goals up to Firestore so they sync cross-device.
          void settingsApi.updatePreferences({
            preferences: { goals: localGoals },
          });
        }
      } catch {
        if (cancelled) return;
        if (localGoals) setGoals(localGoals);
      }
    };

    void loadGoals();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveGoals = async (nextGoals: typeof goals) => {
    setGoals(nextGoals);
    writeJsonToStorage(STORAGE_KEYS.goals, nextGoals, LEGACY_STORAGE_KEYS.goals);
    try {
      await settingsApi.updatePreferences({ preferences: { goals: nextGoals } });
      showSuccess("Goals saved", "Your job search goals have been updated.");
    } catch (e: any) {
      showError(e?.message || "Failed to save", "Could not sync your goals. They are saved locally.");
    }
  };

  // Ensure applications is always an array
  const safeApplications = Array.isArray(applications) ? applications : [];
  const safeCvAnalyses = Array.isArray(cvAnalyses) ? cvAnalyses : [];
  
  const weeklyApplications = getWeeklyApplications(safeApplications);
  const successRate = calculateSuccessRate(safeApplications);
  const responseRate = calculateResponseRate(safeApplications);
  const sponsoredPercentage = getSponsoredJobsPercentage(safeApplications);
  const agencyPercentage = getAgencyJobsPercentage(safeApplications);

  const funnelData = calculateFunnelData(safeApplications);
  const timeToOffer = calculateTimeToOffer(safeApplications);
  const companyResponseRates = getResponseRateByCompany(safeApplications);
  const jobTypeSuccess = getSuccessRateByJobType(safeApplications);
  const salaryGrowth = calculateSalaryGrowth(safeApplications);
  const salaryMetrics = calculateSalaryMetrics(safeApplications);

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
          {isAdmin ? (
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-700 border-emerald-500/30"
            >
              Admin Access
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Premium Feature</span>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30"
              >
                Premium
              </Badge>
            </div>
          )}
        </div>

        {/* CV Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle>CV Analysis History</CardTitle>
          </CardHeader>
          <CardContent>
            <CvAnalysisHistory analyses={safeCvAnalyses} />
          </CardContent>
        </Card>

        {/* Application Timeline */}
        {safeApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeApplications
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  .slice(0, 10)
                  .map((application, index) => {
                    const statusColor =
                      {
                        interested: "bg-muted text-muted-foreground",
                        applied: "bg-sky-100 text-sky-800",
                        interviewing: "bg-purple-100 text-purple-800",
                        offered: "bg-primary/20 text-primary",
                        rejected: "bg-red-100 text-red-800",
                        withdrawn: "bg-muted text-muted-foreground",
                      }[application.status as string] ||
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
              {safeApplications.length > 10 && (
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

                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-primary/20">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span className="ml-3 font-medium">Success Rate</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
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

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Funnel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Application Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4">
                {funnelData.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div 
                      className="h-12 rounded-lg bg-primary/10 flex items-center justify-between px-4 relative z-10"
                      style={{ 
                        width: `${Math.max(40, 100 - (index * 15))}%`,
                        margin: '0 auto'
                      }}
                    >
                      <span className="font-medium text-sm">{stage.stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{stage.count}</span>
                        {index > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {stage.percentage}% conv.
                          </Badge>
                        )}
                      </div>
                    </div>
                    {index < funnelData.length - 1 && (
                      <div className="flex justify-center my-1">
                        <div className="w-px h-4 bg-border border-dashed border-l" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Success Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Time to Offer</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {timeToOffer !== null ? `${timeToOffer} days` : "N/A"}
                  </span>
                  {timeToOffer !== null && (
                    <span className="text-xs text-emerald-600 font-medium">
                      -12% vs avg
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Salary Growth</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {salaryGrowth ? `+${salaryGrowth.growth}%` : "N/A"}
                  </span>
                  {salaryGrowth && (
                    <span className="text-xs text-muted-foreground">
                      from {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(salaryGrowth.first)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Top Responding Companies</h4>
                <div className="space-y-3">
                  {companyResponseRates.map((company) => (
                    <div key={company.name} className="flex items-center justify-between">
                      <span className="text-xs truncate max-w-[120px]">{company.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${company.rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium w-6">{company.rate}%</span>
                      </div>
                    </div>
                  ))}
                  {companyResponseRates.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No data yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Type Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Job Type Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {jobTypeSuccess.map((type) => (
                <div key={type.type} className="p-4 rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{type.type}</Badge>
                    <span className="text-xs text-muted-foreground">{type.total} apps</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{type.rate}%</span>
                    <span className="text-[10px] text-muted-foreground">success rate</span>
                  </div>
                  <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      style={{ width: `${type.rate}%` }}
                    />
                  </div>
                </div>
              ))}
              {jobTypeSuccess.length === 0 && (
                <div className="col-span-full">
                  <EmptyStateInline 
                    icon={BarChart3} 
                    message="Apply to more jobs to see performance by type." 
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Salary Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Salary Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salaryMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-sm text-emerald-700 mb-1">Average Salary</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(salaryMetrics.avg)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                      <p className="text-sm font-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(salaryMetrics.min)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                      <p className="text-sm font-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(salaryMetrics.max)}</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium mb-4">Salary Distribution</h4>
                  <div className="h-32 flex items-end gap-1">
                    {/* Simple distribution chart */}
                    {Array.from({ length: 10 }).map((_, i) => {
                      const rangeMin = salaryMetrics.min + (i * (salaryMetrics.max - salaryMetrics.min) / 10);
                      const rangeMax = salaryMetrics.min + ((i + 1) * (salaryMetrics.max - salaryMetrics.min) / 10);
                      const count = salaryMetrics.all.filter(s => s >= rangeMin && s < rangeMax).length;
                      const height = salaryMetrics.all.length > 0 ? (count / salaryMetrics.all.length) * 100 : 0;
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div 
                            className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all rounded-t-sm relative"
                            style={{ height: `${Math.max(5, height)}%` }}
                          >
                            {count > 0 && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                {count} jobs
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-muted-foreground rotate-45 origin-left mt-1">
                            {Math.round(rangeMin / 1000)}k
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyStateInline 
                icon={DollarSign} 
                message="Add salary information to your jobs to see analytics." 
                action={{
                  label: "Go to Jobs",
                  onClick: () => window.location.href = '#jobs'
                }}
              />
            )}
          </CardContent>
        </Card>

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
                    {weeklyApplications} / {goals.weeklyApplications}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-sky-600 h-2 rounded-full motion-progress"
                    style={{
                      width: `${Math.min(
                        100,
                        (weeklyApplications / goals.weeklyApplications) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {goals.weeklyApplications} applications per week
                </p>
              </div>

              {/* Response Rate Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {responseRate}% / {goals.responseRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full motion-progress"
                    style={{
                      width: `${Math.min(
                        100,
                        (responseRate / goals.responseRate) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {goals.responseRate}% response rate
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowGoalsModal(true)}
                  >
                    Set Custom Goals
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowProgressModal(true)}
                  >
                    View Progress Report
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowWeeklySummaryModal(true)}
                  >
                    Weekly Summary
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <GoalsSettingsModal
        open={showGoalsModal}
        onOpenChange={setShowGoalsModal}
        currentGoals={goals}
        onSaveGoals={handleSaveGoals}
      />
      <ProgressReportModal
        open={showProgressModal}
        onOpenChange={setShowProgressModal}
        applications={safeApplications}
        goals={goals}
      />
      <WeeklySummaryModal
        open={showWeeklySummaryModal}
        onOpenChange={setShowWeeklySummaryModal}
        applications={safeApplications}
      />
    </FeatureGate>
  );
}