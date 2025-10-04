"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleDashed, ExternalLink } from "lucide-react";
import type { ChecklistItem } from "@/types/portfolio";

interface PortfolioChecklistProps {
  checklist: ChecklistItem[];
  portfolioProgress: number;
}

export function PortfolioChecklist({ checklist, portfolioProgress }: PortfolioChecklistProps) {
  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Portfolio Completion Checklist</CardTitle>
        <CardDescription className="text-base">Track your portfolio setup progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                item.completed
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <CircleDashed className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium text-base ${item.completed ? "text-green-700 dark:text-green-300" : "text-foreground"}`}>
                  {item.label}
                </div>
                {item.helper && (
                  <div className={`text-sm mt-1 ${item.completed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {item.helper}
                  </div>
                )}
                {item.actionHint && !item.completed && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                    <span>{item.actionHint}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Overall Progress</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{portfolioProgress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
