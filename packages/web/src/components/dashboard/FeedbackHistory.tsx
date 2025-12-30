"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ThumbsUp, ThumbsDown, Brain, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  sentiment: "positive" | "negative";
  comment?: string;
  contentType: string;
  createdAt: string;
  status: "new" | "reviewed" | "verified" | "archived";
}

export function FeedbackHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feedback", "history"],
    queryFn: async () => {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const json = await res.json();
      return json.data.feedback as FeedbackItem[];
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load feedback history. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const feedback = data || [];

  if (feedback.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No feedback yet</CardTitle>
          <CardDescription>
            Your feedback on AI suggestions helps us improve HireAll for everyone.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Your AI Feedback History</h3>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
          Last 50 entries
        </Badge>
      </div>

      <div className="grid gap-4">
        {feedback.map((item: FeedbackItem) => (
          <Card key={item.id} className="overflow-hidden border-muted/60 hover:border-primary/20 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.sentiment === "positive" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {item.sentiment === "positive" ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  </div>
                  <div>
                    <CardTitle className="text-base capitalize">
                      {item.contentType.replace(/_/g, " ")} Feedback
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                    </div>
                  </div>
                </div>
                <Badge variant={item.status === "verified" ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider">
                  {item.status === "verified" ? (
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" /> Verified Improvement
                    </span>
                  ) : item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {item.comment ? (
                <p className="text-sm text-foreground/80 mt-2 bg-muted/30 p-3 rounded-lg border border-muted/40 italic">
                  &quot;{item.comment}&quot;
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2 italic px-3">
                  No written comment provided.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
