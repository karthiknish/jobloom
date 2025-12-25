"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string | React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg";
}

/**
 * A small "?" icon that shows a tooltip with help text on hover
 */
export function HelpTooltip({ 
  content, 
  className, 
  side = "top",
  size = "sm" 
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 transition-colors p-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              className
            )}
            aria-label="Help information"
          >
            <HelpCircle className={sizeClasses[size]} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs text-sm leading-relaxed"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Common help text definitions for reuse
 */
export const helpTexts = {
  // UK Visa & Sponsorship
  ukVisaChecker: "Shows if this employer is on the UK Home Office's approved sponsor list for Skilled Worker visas.",
  socCode: "Standard Occupational Classification code. Used by UK immigration to categorize job roles for visa eligibility.",
  sponsorshipType: "The type of visa sponsorship offered: Skilled Worker, Global Talent, or other routes.",
  
  // ATS Analysis
  atsScore: "Application Tracking System compatibility score. Higher scores mean your CV is more likely to pass automated screening.",
  keywordMatch: "Keywords from job descriptions that match your CV. More matches = better visibility to recruiters.",
  formatScore: "How well your CV format works with ATS parsers. Clean, simple formats score higher.",
  
  // Resume Builder
  resumeScore: "Overall quality score based on completeness, content strength, and ATS compatibility.",
  actionVerbs: "Strong action verbs (e.g., 'Led', 'Developed', 'Achieved') make your experience more impactful.",
  quantifiableResults: "Including numbers and metrics (e.g., 'increased sales by 25%') strengthens your achievements.",
  
  // Dashboard
  applicationStatus: "Track your job applications: Applied → Interviewing → Offer/Rejected",
  kanbanView: "Drag and drop jobs between columns to update their status.",
  bulkActions: "Select multiple jobs using checkboxes to change status, export, or delete them at once.",
  
  // Cover Letter
  coverLetterTone: "Choose how formal or casual your cover letter should sound.",
  jobDescription: "Paste the job posting here. We'll analyze it to tailor your cover letter.",
};
