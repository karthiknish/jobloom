"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle2,
  Clock,
  Briefcase,
  Star,
  Calendar,
  Download,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Application } from "@/types/dashboard";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { ANALYTICS_GOALS } from "@hireall/shared";

interface ProgressReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: Application[];
  goals?: {
    weeklyApplications: number;
    responseRate: number;
  };
}

export function ProgressReportModal({
  open,
  onOpenChange,
  applications = [],
  goals = { 
    weeklyApplications: ANALYTICS_GOALS.weeklyApplications, 
    responseRate: ANALYTICS_GOALS.responseRate 
  },
}: ProgressReportModalProps) {
  useRestoreFocus(open);
  const [editableGoals, setEditableGoals] = useState(goals);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const safeApps = Array.isArray(applications) ? applications : [];

  // Calculate metrics
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const thisWeekApps = safeApps.filter((a) => (a.createdAt || 0) >= oneWeekAgo);
  const lastWeekApps = safeApps.filter(
    (a) => (a.createdAt || 0) >= twoWeeksAgo && (a.createdAt || 0) < oneWeekAgo
  );
  const thisMonthApps = safeApps.filter((a) => (a.createdAt || 0) >= oneMonthAgo);

  const statusBreakdown = {
    interested: safeApps.filter((a) => a.status === "interested").length,
    applied: safeApps.filter((a) => a.status === "applied").length,
    offered: safeApps.filter((a) => a.status === "offered").length,
    rejected: safeApps.filter((a) => a.status === "rejected").length,
    withdrawn: safeApps.filter((a) => a.status === "withdrawn").length,
  };

  const totalApplications = safeApps.length;
  const successRate = totalApplications > 0 
    ? Math.round(((statusBreakdown.offered) / totalApplications) * 100) 
    : 0;
  const responseRate = totalApplications > 0 
    ? Math.round(((statusBreakdown.offered + statusBreakdown.rejected) / totalApplications) * 100) 
    : 0;

  // Week-over-week change
  const weeklyChange = thisWeekApps.length - lastWeekApps.length;
  const weeklyChangePercent = lastWeekApps.length > 0 
    ? Math.round(((thisWeekApps.length - lastWeekApps.length) / lastWeekApps.length) * 100) 
    : thisWeekApps.length > 0 ? 100 : 0;

  // Goal progress
  const weeklyGoalProgress = Math.min(100, (thisWeekApps.length / editableGoals.weeklyApplications) * 100);
  const responseGoalProgress = Math.min(100, (responseRate / editableGoals.responseRate) * 100);

  // Export report
  const exportReport = () => {
    const reportText = `
PROGRESS REPORT - ${new Date().toLocaleDateString()}
====================================
Total Applications: ${totalApplications}
Offers: ${statusBreakdown.offered}
Response Rate: ${responseRate}%
This Week: ${thisWeekApps.length} applications
Weekly Change: ${weeklyChange >= 0 ? "+" : ""}${weeklyChange} (${weeklyChangePercent}%)

GOAL PROGRESS
- Weekly Applications: ${thisWeekApps.length}/${editableGoals.weeklyApplications} (${weeklyGoalProgress.toFixed(0)}%)
- Response Rate: ${responseRate}%/${editableGoals.responseRate}% (${responseGoalProgress.toFixed(0)}%)

STATUS BREAKDOWN
- Interested: ${statusBreakdown.interested}
- Applied: ${statusBreakdown.applied}
- Offered: ${statusBreakdown.offered}
- Rejected: ${statusBreakdown.rejected}
- Withdrawn: ${statusBreakdown.withdrawn}
    `.trim();
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progress_report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Progress Report
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={exportReport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <DialogDescription>
            Your job search performance metrics and goal progress.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4 border border-primary/20"
              >
                <Briefcase className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-500/10 dark:bg-green-500/20 rounded-xl p-4 border border-green-500/20"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{statusBreakdown.offered}</p>
                <p className="text-xs text-muted-foreground">Offers</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-500/10 dark:bg-amber-500/20 rounded-xl p-4 border border-amber-500/20"
              >
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{responseRate}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </motion.div>
            </div>

            {/* Weekly Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Week&apos;s Performance
                  </span>
                  <div className={`flex items-center gap-1 ${getTrendColor(weeklyChange)}`}>
                    {getTrendIcon(weeklyChange)}
                    <span className="text-sm font-medium">
                      {weeklyChange >= 0 ? "+" : ""}{weeklyChange} ({weeklyChangePercent >= 0 ? "+" : ""}{weeklyChangePercent}%)
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Applications this week</span>
                      <span className="font-medium">{thisWeekApps.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Last week</span>
                      <span>{lastWeekApps.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goal Progress
                  </span>
                  {isEditingGoals ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingGoals(false)}>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditableGoals(goals); setIsEditingGoals(false); }}>
                        <X className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingGoals(true)} className="h-7 text-xs gap-1">
                      <Edit2 className="h-3 w-3" />
                      Set Custom
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2 items-center">
                    <span>Weekly Applications</span>
                    {isEditingGoals ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{thisWeekApps.length} /</span>
                        <Input 
                          type="number" 
                          value={editableGoals.weeklyApplications} 
                          onChange={(e) => setEditableGoals(prev => ({ ...prev, weeklyApplications: parseInt(e.target.value) || 1 }))}
                          className="w-16 h-7 text-sm text-right"
                        />
                      </div>
                    ) : (
                      <span className="font-medium">{thisWeekApps.length} / {editableGoals.weeklyApplications}</span>
                    )}
                  </div>
                  <Progress value={weeklyGoalProgress} className="h-2" />
                  {weeklyGoalProgress >= 100 && (
                    <Badge variant="green" className="mt-2">Goal Achieved!</Badge>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 items-center">
                    <span>Response Rate</span>
                    {isEditingGoals ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{responseRate}% /</span>
                        <Input 
                          type="number" 
                          value={editableGoals.responseRate} 
                          onChange={(e) => setEditableGoals(prev => ({ ...prev, responseRate: parseInt(e.target.value) || 1 }))}
                          className="w-16 h-7 text-sm text-right"
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      <span className="font-medium">{responseRate}% / {editableGoals.responseRate}%</span>
                    )}
                  </div>
                  <Progress value={responseGoalProgress} className="h-2" />
                  {responseGoalProgress >= 100 && (
                    <Badge variant="green" className="mt-2">Goal Achieved!</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(statusBreakdown).map(([status, count]) => {
                    const styles: Record<string, { border: string; icon: string }> = {
                      interested: { border: "border-l-4 border-l-blue-500", icon: "text-blue-500" },
                      applied: { border: "border-l-4 border-l-amber-500", icon: "text-amber-500" },
                      offered: { border: "border-l-4 border-l-green-500", icon: "text-green-500" },
                      rejected: { border: "border-l-4 border-l-red-500", icon: "text-red-500" },
                      withdrawn: { border: "border-l-4 border-l-gray-500", icon: "text-gray-500" },
                    };
                    const style = styles[status] || { border: "", icon: "" };
                    return (
                      <div
                        key={status}
                        className={`rounded-lg p-3 bg-muted/50 ${style.border}`}
                      >
                        <p className={`text-lg font-bold ${style.icon}`}>{count}</p>
                        <p className="text-xs capitalize text-muted-foreground">{status}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
