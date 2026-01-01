"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isWithinInterval } from "date-fns";
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
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { Application } from "@/types/dashboard";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { ANALYTICS_GOALS } from "@hireall/shared";

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
  useRestoreFocus(open);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const safeApps = Array.isArray(applications) ? applications : [];
  const now = new Date();

  const toValidDate = (value: unknown): Date | null => {
    try {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      if (typeof value === "number") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (typeof value === "string") {
        const normalized = /^\d+$/.test(value) ? Number(value) : value;
        const d = new Date(normalized as any);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (value && typeof value === "object") {
        const anyVal = value as any;
        if (typeof anyVal.toDate === "function") {
          const d = anyVal.toDate();
          return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
        }
        if (typeof anyVal.toMillis === "function") {
          const d = new Date(anyVal.toMillis());
          return Number.isNaN(d.getTime()) ? null : d;
        }
        const seconds =
          typeof anyVal.seconds === "number"
            ? anyVal.seconds
            : typeof anyVal._seconds === "number"
              ? anyVal._seconds
              : null;
        const nanos =
          typeof anyVal.nanoseconds === "number"
            ? anyVal.nanoseconds
            : typeof anyVal._nanoseconds === "number"
              ? anyVal._nanoseconds
              : 0;
        if (typeof seconds === "number") {
          const millis = seconds * 1000 + Math.floor(nanos / 1_000_000);
          const d = new Date(millis);
          return Number.isNaN(d.getTime()) ? null : d;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // This week and last week boundaries (relative to weekOffset)
  const baseDate = weekOffset === 0 ? now : (weekOffset > 0 ? addWeeks(now, weekOffset) : subWeeks(now, Math.abs(weekOffset)));
  const thisWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
  const thisWeekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 });

  // Filter applications by week
  const thisWeekApps = safeApps.filter((a) => {
    const date = toValidDate((a as any).createdAt);
    if (!date) return false;
    return isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd });
  });

  const lastWeekApps = safeApps.filter((a) => {
    const date = toValidDate((a as any).createdAt);
    if (!date) return false;
    return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
  });

  // Calculate week's activities
  const thisWeekStats = {
    added: thisWeekApps.length,
    applied: thisWeekApps.filter((a) => a.status === "applied").length,
    offered: thisWeekApps.filter((a) => a.status === "offered").length,
    rejected: thisWeekApps.filter((a) => a.status === "rejected").length,
  };

  const lastWeekStats = {
    added: lastWeekApps.length,
    applied: lastWeekApps.filter((a) => a.status === "applied").length,
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
  if (thisWeekStats.added >= ANALYTICS_GOALS.weeklyApplications) {
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Weekly Summary
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset(prev => prev - 1)} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWeekOffset(0)} 
                disabled={weekOffset === 0}
                className="text-xs h-8"
              >
                This Week
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setWeekOffset(prev => prev + 1)} 
                disabled={weekOffset >= 0}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                        highlight.type === "success" ? "bg-green-50 " :
                        highlight.type === "highlight" ? "bg-amber-50 " :
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
                  { label: "Applied", curr: thisWeekStats.applied, prev: lastWeekStats.applied, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 " },
                  { label: "Offered", curr: thisWeekStats.offered, prev: lastWeekStats.offered, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600 " },
                  { label: "Rejected", curr: thisWeekStats.rejected, prev: lastWeekStats.rejected, icon: <XCircle className="h-4 w-4" />, color: "text-red-500 " },
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
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Top Companies This Week</span>
                    {topCompanies.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllCompanies(!showAllCompanies)}
                        className="h-7 text-xs gap-1"
                      >
                        <ChevronsUpDown className="h-3 w-3" />
                        {showAllCompanies ? "Show Less" : `+${topCompanies.length - 5} more`}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(showAllCompanies ? topCompanies : topCompanies.slice(0, 5)).map(([company, count], index) => (
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
              ) : thisWeekStats.added >= ANALYTICS_GOALS.weeklyApplications ? (
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
