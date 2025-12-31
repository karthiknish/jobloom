"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Target,
  Users,
  DollarSign,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/providers/subscription-provider";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { generateContentHash, getCachedAIResponse, setCachedAIResponse } from "@/utils/ai-cache";

interface JobAISummaryProps {
  jobDescription: string;
  jobId: string;
}

interface AISummaryData {
  summary: string;
  keyRequirements: string[];
  cultureInsights: string[];
  atsKeywords: string[];
  salaryEstimate?: string;
}

export function JobAISummary({ jobDescription, jobId }: JobAISummaryProps) {
  const { plan } = useSubscription();
  const { user } = useFirebaseAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<AISummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    if (plan === "free") {
      setError("Premium subscription required for AI features.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const payloadHash = await generateContentHash(jobDescription);
      const cachedData = getCachedAIResponse<AISummaryData>(payloadHash);
      
      if (cachedData) {
        setSummary(cachedData);
        setIsExpanded(true);
        setIsLoading(false);
        return;
      }

      const token = await user?.getIdToken();
      const response = await fetch("/api/ai/job-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobDescription }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to generate summary");
      }

      // Store in cache
      setCachedAIResponse(payloadHash, result.data);
      
      setSummary(result.data);
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the summary");
    } finally {
      setIsLoading(false);
    }
  };

  if (!jobDescription || jobDescription.length < 50) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            AI Job Insights
          </h4>
        </div>
        
        {!summary && !isLoading && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateSummary}
            className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 h-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Generate Insights
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-muted/30 rounded-xl border border-dashed border-border">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Analyzing job description...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            {plan === "free" && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-destructive underline"
                onClick={() => window.location.href = '/upgrade'}
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>
      )}

      {summary && (
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="p-0">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Quick Summary</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-6 border-t border-primary/10">
                    {/* Summary Text */}
                    <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                      {summary.summary}
                    </p>

                    {/* Key Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tighter">
                        <Target className="h-3.5 w-3.5" />
                        Critical Requirements
                      </div>
                      <ul className="grid grid-cols-1 gap-2">
                        {summary.keyRequirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Culture & Salary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tighter">
                          <Users className="h-3.5 w-3.5" />
                          Culture Insights
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {summary.cultureInsights.map((insight, i) => (
                            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-none">
                              {insight}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {summary.salaryEstimate && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tighter">
                            <DollarSign className="h-3.5 w-3.5" />
                            AI Salary Estimate
                          </div>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {summary.salaryEstimate}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ATS Keywords */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tighter">
                        <Sparkles className="h-3.5 w-3.5" />
                        ATS Keywords to Include
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.atsKeywords.map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-normal">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
