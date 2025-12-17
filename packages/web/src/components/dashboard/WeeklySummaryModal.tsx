"use client";

import React from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  Briefcase,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Application } from "@/types/dashboard";

interface WeeklySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: Application[];
}

export function WeeklySummaryModal({
  open,
  onOpenChange,
  applications = [],
}: WeeklySummaryModalProps) {
  const safeApps = Array.isArray(applications) ? applications : [];
  const now = new Date();

  // This week and last week boundaries
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Filter applications by week
  const thisWeekApps = safeApps.filter((a) => {
    const date = new Date(a.createdAt || 0);
    return isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd });
  });

  const lastWeekApps = safeApps.filter((a) => {
    const date = new Date(a.createdAt || 0);
    return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
  });

  // Calculate week's activities
  const thisWeekStats = {
    added: thisWeekApps.length,
    applied: thisWeekApps.filter((a) => a.status === "applied").length,
    interviewing: thisWeekApps.filter((a) => a.status === "interviewing").length,
    offered: thisWeekApps.filter((a) => a.status === "offered").length,
    rejected: thisWeekApps.filter((a) => a.status === "rejected").length,
  };

  const lastWeekStats = {
    added: lastWeekApps.length,
    applied: lastWeekApps.filter((a) => a.status === "applied").length,
    interviewing: lastWeekApps.filter((a) => a.status === "interviewing").length,
    offered: lastWeekApps.filter((a) => a.status === "offered").length,
    rejected: lastWeekApps.filter((a) => a.status === "rejected").length,
  };

  // Calculate changes
  const change = thisWeekStats.added - lastWeekStats.added;
  const changePercent = lastWeekStats.added > 0 
    ? Math.round((change / lastWeekStats.added) * 100) 
    : thisWeekStats.added > 0 ? 100 : 0;

  // Activity highlights
  const highlights = [];
  if (thisWeekStats.offered > 0) {
    highlights.push({ icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, text: `${thisWeekStats.offered} offer${thisWeekStats.offered > 1 ? 's' : ''} received!`, type: "success" });
  }
  if (thisWeekStats.interviewing > 0) {
    highlights.push({ icon: <Star className="h-4 w-4 text-purple-600" />, text: `${thisWeekStats.interviewing} interview${thisWeekStats.interviewing > 1 ? 's' : ''} scheduled`, type: "info" });
  }
  if (thisWeekStats.added >= 10) {
    highlights.push({ icon: <Sparkles className="h-4 w-4 text-amber-600" />, text: `Great week! ${thisWeekStats.added} applications added`, type: "highlight" });
  }
  if (change > 0) {
    highlights.push({ icon: <TrendingUp className="h-4 w-4 text-green-600" />, text: `Activity up ${changePercent}% from last week`, type: "positive" });
  }

  // Top companies applied to this week
  const companyCount: Record<string, number> = {};
  thisWeekApps.forEach((app) => {
    const company = app.job?.company || "Unknown";
    companyCount[company] = (companyCount[company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getTrendIcon = (curr: number, prev: number) => {
    if (curr > prev) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (curr < prev) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getChangeText = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (diff === 0) return "Same as last week";
    return diff > 0 ? `+${diff} from last week` : `${diff} from last week`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Weekly Summary
          </DialogTitle>
          <DialogDescription>
            {format(thisWeekStart, "MMM d")} - {format(thisWeekEnd, "MMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Week at a Glance */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-4xl font-bold">{thisWeekStats.added}</p>
                    <p className="text-sm text-muted-foreground">applications</p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 justify-end ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {getTrendIcon(thisWeekStats.added, lastWeekStats.added)}
                      <span className="text-sm font-medium">
                        {change >= 0 ? "+" : ""}{changePercent}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">vs last week ({lastWeekStats.added})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Highlights</h4>
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        highlight.type === "success" ? "bg-green-50 dark:bg-green-900/20" :
                        highlight.type === "highlight" ? "bg-amber-50 dark:bg-amber-900/20" :
                        "bg-muted/50"
                      }`}
                    >
                      {highlight.icon}
                      <span className="text-sm">{highlight.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Added", curr: thisWeekStats.added, prev: lastWeekStats.added, icon: <Briefcase className="h-4 w-4" />, color: "text-primary" },
                  { label: "Applied", curr: thisWeekStats.applied, prev: lastWeekStats.applied, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Interviewing", curr: thisWeekStats.interviewing, prev: lastWeekStats.interviewing, icon: <Star className="h-4 w-4" />, color: "text-purple-600 dark:text-purple-400" },
                  { label: "Offered", curr: thisWeekStats.offered, prev: lastWeekStats.offered, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600 dark:text-green-400" },
                  { label: "Rejected", curr: thisWeekStats.rejected, prev: lastWeekStats.rejected, icon: <XCircle className="h-4 w-4" />, color: "text-red-500 dark:text-red-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={item.color}>{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.curr}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {getTrendIcon(item.curr, item.prev)}
                        {getChangeText(item.curr, item.prev)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Companies */}
            {topCompanies.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Companies This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topCompanies.map(([company, count], index) => (
                      <div key={company} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm truncate max-w-[200px]">{company}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motivation */}
            <div className="text-center py-4 text-sm text-muted-foreground">
              {thisWeekStats.added === 0 ? (
                <p>No applications this week yet. Keep pushing!</p>
              ) : thisWeekStats.added >= 10 ? (
                <p>Amazing progress! Keep the momentum going!</p>
              ) : (
                <p>Good work! Stay consistent for best results.</p>
              )}
            </div>
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
