"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  Plus, 
  Edit, 
  Trash, 
  RotateCcw, 
  ArrowRight, 
  StickyNote, 
  FileText, 
  Award,
  RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activityLogService } from "@/services/api/ActivityLogService";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { ActivityLog } from "@hireall/shared";

interface ActivityTimelineProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: Plus, label: "Created", color: "text-green-600 bg-green-100" },
  updated: { icon: Edit, label: "Updated", color: "text-blue-600 bg-blue-100" },
  deleted: { icon: Trash, label: "Deleted", color: "text-red-600 bg-red-100" },
  restored: { icon: RotateCcw, label: "Restored", color: "text-purple-600 bg-purple-100" },
  status_changed: { icon: ArrowRight, label: "Status Changed", color: "text-amber-600 bg-amber-100" },
  note_added: { icon: StickyNote, label: "Note Added", color: "text-cyan-600 bg-cyan-100" },
  cv_analyzed: { icon: FileText, label: "CV Analyzed", color: "text-indigo-600 bg-indigo-100" },
  cover_letter_generated: { icon: Award, label: "Cover Letter", color: "text-pink-600 bg-pink-100" },
};

const ENTITY_LABELS: Record<string, string> = {
  application: "Application",
  job: "Job",
  cv: "CV",
  cover_letter: "Cover Letter",
  resume: "Resume",
};

export function ActivityTimeline({ className, limit = 20, showFilters = true }: ActivityTimelineProps) {
  const { user } = useFirebaseAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const fetchActivities = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const logs = await activityLogService.getByUser(user.uid, {
        limit,
        entityType: entityFilter !== "all" ? entityFilter as ActivityLog["entityType"] : undefined,
      });
      setActivities(logs);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user?.uid, entityFilter]);

  const getActionConfig = (action: string) => {
    return ACTION_CONFIG[action] || ACTION_CONFIG.updated;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Activity Timeline</CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="application">Applications</SelectItem>
                  <SelectItem value="cv">CV Analysis</SelectItem>
                  <SelectItem value="cover_letter">Cover Letters</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="icon" onClick={fetchActivities} className="h-8 w-8">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm">Your actions will appear here as you use the app.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              <AnimatePresence mode="popLayout">
                {activities.map((activity, index) => {
                  const config = getActionConfig(activity.action);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-10 pb-4 group"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${config.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{config.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {ENTITY_LABELS[activity.entityType] || activity.entityType}
                              </Badge>
                            </div>
                            {activity.entityTitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {activity.entityTitle}
                              </p>
                            )}
                            {activity.metadata && activity.action === "status_changed" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {(activity.metadata as any).oldStatus} → {(activity.metadata as any).newStatus}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
