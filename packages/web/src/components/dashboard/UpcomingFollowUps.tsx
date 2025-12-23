"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, type Application } from "@/utils/api/dashboard";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { showSuccess, showError } from "@/components/ui/Toast";
import { CheckCircle, Clock, AlertCircle, Calendar, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UpcomingFollowUps({ applications, onChanged }: { applications: Application[]; onChanged?: () => void }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayTimestamp = now.getTime();
  
  const followUps = applications
    .filter((a) => typeof a.followUpDate === "number")
    .sort((a, b) => (a.followUpDate! - b.followUpDate!));

  const overdue = followUps.filter(a => a.followUpDate! < todayTimestamp);
  const today = followUps.filter(a => isToday(new Date(a.followUpDate!)));
  const upcoming = followUps.filter(a => a.followUpDate! > todayTimestamp && !isToday(new Date(a.followUpDate!)));

  const markDone = async (id: string) => {
    try {
      await dashboardApi.updateApplication(id, { followUpDate: undefined });
      showSuccess("Follow-up cleared");
      onChanged?.();
    } catch (e: any) {
      showError(e?.message || "Failed to clear follow-up");
    }
  };

  const getDueDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `Overdue (${format(date, "MMM d")})`;
    return format(date, "MMM d, yyyy");
  };

  const renderFollowUpItem = (a: Application, type: 'overdue' | 'today' | 'upcoming') => (
    <motion.li
      key={a._id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
        type === 'overdue' 
          ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
          : type === 'today'
          ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
          : 'bg-muted/30 border-border/50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm truncate">
            {a.job?.title || "Untitled"}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            at {a.job?.company || "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs font-medium ${
            type === 'overdue' ? 'text-red-600 dark:text-red-400' : 
            type === 'today' ? 'text-amber-600 dark:text-amber-400' : 
            'text-muted-foreground'
          }`}>
            {type === 'overdue' ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {getDueDateLabel(a.followUpDate!)}
          </div>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
            {a.status}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0 rounded-full hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30"
          onClick={() => markDone(a._id)}
          title="Mark as done"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </motion.li>
  );

  const totalCount = overdue.length + today.length + upcoming.length;

  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Application Reminders
            </CardTitle>
            <CardDescription>
              {totalCount > 0 
                ? `You have ${totalCount} pending follow-up${totalCount === 1 ? '' : 's'}`
                : "Stay on top of your job search"}
            </CardDescription>
          </div>
          {totalCount > 0 && (
            <Badge variant={overdue.length > 0 ? "destructive" : "secondary"} className="animate-pulse">
              {totalCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {totalCount > 0 ? (
              <ul className="space-y-3">
                {overdue.map(a => renderFollowUpItem(a, 'overdue'))}
                {today.map(a => renderFollowUpItem(a, 'today'))}
                {upcoming.slice(0, 3).map(a => renderFollowUpItem(a, 'upcoming'))}
                
                {upcoming.length > 3 && (
                  <li className="text-center pt-1">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                      View {upcoming.length - 3} more upcoming <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </li>
                )}
              </ul>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  All caught up!
                </h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  No pending follow-ups. We'll remind you when it's time to reach out.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
