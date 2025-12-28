"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  FileText,
  BarChart3,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Application } from "@/types/dashboard";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";

interface JobIntegrationActionsProps {
  application: Application;
  onCheckSponsor?: (company: string) => Promise<SponsorCheckResult>;
  onGenerateCoverLetter?: (application: Application) => void;
  onGetMatchScore?: (application: Application) => Promise<MatchScoreResult>;
  compact?: boolean;
  className?: string;
}

export interface SponsorCheckResult {
  isSponsored: boolean;
  sponsorType?: string;
  confidence: number;
  lastUpdated?: string;
}

export interface MatchScoreResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
  };
  suggestions: string[];
}

export function JobIntegrationActions({
  application,
  onCheckSponsor,
  onGenerateCoverLetter,
  onGetMatchScore,
  compact = false,
  className,
}: JobIntegrationActionsProps) {
  const [sponsorResult, setSponsorResult] = useState<SponsorCheckResult | null>(null);
  const [matchScore, setMatchScore] = useState<MatchScoreResult | null>(null);
  const [isCheckingSponsor, setIsCheckingSponsor] = useState(false);
  const [isGettingScore, setIsGettingScore] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  useRestoreFocus(showMatchDialog);

  const handleCheckSponsor = async () => {
    if (!onCheckSponsor || !application.job?.company) return;
    
    setIsCheckingSponsor(true);
    try {
      const result = await onCheckSponsor(application.job.company);
      setSponsorResult(result);
    } catch (error) {
      console.error("Sponsor check failed:", error);
    } finally {
      setIsCheckingSponsor(false);
    }
  };

  const handleGetMatchScore = async () => {
    if (!onGetMatchScore) return;
    
    setIsGettingScore(true);
    try {
      const result = await onGetMatchScore(application);
      setMatchScore(result);
      setShowMatchDialog(true);
    } catch (error) {
      console.error("Match score failed:", error);
    } finally {
      setIsGettingScore(false);
    }
  };

  const handleGenerateCoverLetter = () => {
    if (onGenerateCoverLetter) {
      onGenerateCoverLetter(application);
    }
  };

  // Show sponsor status badge
  const getSponsorBadge = () => {
    if (application.job?.isSponsored) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          Sponsor
        </Badge>
      );
    }
    
    if (sponsorResult) {
      return sponsorResult.isSponsored ? (
        <Badge variant="default" className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          Sponsor Verified
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <ShieldX className="h-3 w-3" />
          Not Sponsor
        </Badge>
      );
    }
    
    return null;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-1", className)}>
          {/* Sponsor Badge/Button */}
          {getSponsorBadge() || (
            onCheckSponsor && application.job?.company && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCheckSponsor}
                    disabled={isCheckingSponsor}
                  >
                    {isCheckingSponsor ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Check visa sponsorship</TooltipContent>
              </Tooltip>
            )
          )}

          {/* Cover Letter Button */}
          {onGenerateCoverLetter && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleGenerateCoverLetter}
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Generate cover letter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate cover letter</TooltipContent>
            </Tooltip>
          )}

          {/* Match Score Button */}
          {onGetMatchScore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleGetMatchScore}
                  disabled={isGettingScore}
                >
                  {isGettingScore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get Resume match score</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Sponsor Status */}
        {getSponsorBadge()}
        
        {!application.job?.isSponsored && !sponsorResult && onCheckSponsor && application.job?.company && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCheckSponsor}
            disabled={isCheckingSponsor}
          >
            {isCheckingSponsor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Check Sponsor
          </Button>
        )}

        {/* Cover Letter */}
        {onGenerateCoverLetter && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleGenerateCoverLetter}
          >
            <FileText className="h-4 w-4" />
            Cover Letter
          </Button>
        )}

        {/* Match Score */}
        {onGetMatchScore && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleGetMatchScore}
            disabled={isGettingScore}
          >
            {isGettingScore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Match Score
          </Button>
        )}
      </div>

      {/* Match Score Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>CV Match Score</DialogTitle>
            <DialogDescription>
              How well your Resume matches {application.job?.title} at {application.job?.company}
            </DialogDescription>
          </DialogHeader>

          {matchScore && (
            <div className="space-y-6 py-4">
              {/* Overall Score */}
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {matchScore.score}%
                </div>
                <div className="flex items-center justify-center gap-2">
                  {matchScore.score >= 80 ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : matchScore.score >= 60 ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {matchScore.score >= 80
                      ? "Great match!"
                      : matchScore.score >= 60
                      ? "Good match with room to improve"
                      : "Consider improving your resume"}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Breakdown</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Skills Match</span>
                    <span className="font-medium">{matchScore.breakdown.skills}%</span>
                  </div>
                  <Progress value={matchScore.breakdown.skills} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Experience</span>
                    <span className="font-medium">{matchScore.breakdown.experience}%</span>
                  </div>
                  <Progress value={matchScore.breakdown.experience} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Location</span>
                    <span className="font-medium">{matchScore.breakdown.location}%</span>
                  </div>
                  <Progress value={matchScore.breakdown.location} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Salary Fit</span>
                    <span className="font-medium">{matchScore.breakdown.salary}%</span>
                  </div>
                  <Progress value={matchScore.breakdown.salary} className="h-2" />
                </div>
              </div>

              {/* Suggestions */}
              {matchScore.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Suggestions</h4>
                  <ul className="space-y-1">
                    {matchScore.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
