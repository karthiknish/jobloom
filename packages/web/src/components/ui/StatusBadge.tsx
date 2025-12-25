"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // CV Score variants
        score_critical: "bg-destructive/10 text-destructive",
        score_low: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        score_good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        score_excellent: "bg-primary/10 text-primary",
        
        // Job Priority variants
        priority_high: "bg-destructive/10 text-destructive",
        priority_medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        priority_low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        
        // Application Status variants
        status_interested: "bg-secondary text-secondary-foreground",
        status_applied: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        status_interviewing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
        status_offer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status_rejected: "bg-destructive/10 text-destructive",
        status_withdrawn: "bg-muted text-muted-foreground",
        
        // Visa Sponsorship variants
        visa_sponsor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        visa_unknown: "bg-muted text-muted-foreground",
        visa_no: "bg-destructive/10 text-destructive",
        
        // General variants
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        error: "bg-destructive/10 text-destructive",
        info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        neutral: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

export function StatusBadge({ 
  className, 
  variant, 
  size, 
  icon, 
  pulse,
  children, 
  ...props 
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant, size }), className)} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

// Helper functions
export function getScoreBadgeVariant(score: number): StatusBadgeProps["variant"] {
  if (score < 50) return "score_critical";
  if (score < 75) return "score_low";
  if (score < 90) return "score_good";
  return "score_excellent";
}

export function getScoreBadgeLabel(score: number): string {
  if (score < 50) return "Needs Work";
  if (score < 75) return "Fair";
  if (score < 90) return "Good";
  return "Excellent";
}

export function getPriorityBadgeVariant(priority: string): StatusBadgeProps["variant"] {
  switch (priority.toLowerCase()) {
    case "high": return "priority_high";
    case "medium": return "priority_medium";
    case "low": return "priority_low";
    default: return "neutral";
  }
}

export function getApplicationStatusVariant(status: string): StatusBadgeProps["variant"] {
  switch (status.toLowerCase()) {
    case "interested": return "status_interested";
    case "applied": return "status_applied";
    case "interviewing":
    case "interview": return "status_interviewing";
    case "offer":
    case "offered": return "status_offer";
    case "rejected": return "status_rejected";
    case "withdrawn": return "status_withdrawn";
    default: return "neutral";
  }
}

export function getVisaSponsorshipVariant(sponsorship: boolean | null | undefined): StatusBadgeProps["variant"] {
  if (sponsorship === true) return "visa_sponsor";
  if (sponsorship === false) return "visa_no";
  return "visa_unknown";
}

// Compound components for common use cases
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <StatusBadge 
      variant={getScoreBadgeVariant(score)} 
      className={className}
    >
      {score}% - {getScoreBadgeLabel(score)}
    </StatusBadge>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <StatusBadge 
      variant={getPriorityBadgeVariant(priority)} 
      className={cn("capitalize", className)}
    >
      {priority}
    </StatusBadge>
  );
}

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <StatusBadge 
      variant={getApplicationStatusVariant(status)} 
      className={cn("capitalize", className)}
    >
      {status}
    </StatusBadge>
  );
}

export function VisaBadge({ 
  sponsors, 
  className 
}: { 
  sponsors: boolean | null | undefined; 
  className?: string;
}) {
  const label = sponsors === true ? "Sponsors Visa" : sponsors === false ? "No Sponsorship" : "Unknown";
  return (
    <StatusBadge 
      variant={getVisaSponsorshipVariant(sponsors)} 
      className={className}
    >
      {label}
    </StatusBadge>
  );
}
