"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Job } from "@/types/dashboard";

interface UkVisaBadgeProps {
  job: Job;
  userCriteria?: {
    minimumSalary?: number;
    ageCategory?: string;
    educationStatus?: string;
    phdStatus?: string;
  };
  compact?: boolean;
}

// UK Skilled Worker visa minimum salary thresholds (as of 2024)
const UK_VISA_THRESHOLDS = {
  general: 38700,    // General threshold
  newEntrant: 30960, // New entrant (under 26 or recent graduate)
  healthCare: 29000, // Health & Care Worker route
  phd: 34830,        // PhD discount rate
};

type EligibilityStatus = "eligible" | "partial" | "ineligible" | "unknown";

interface EligibilityResult {
  status: EligibilityStatus;
  reasons: string[];
  threshold?: number;
  salary?: number;
}

function assessUkVisaEligibility(
  job: Job,
  userCriteria?: UkVisaBadgeProps["userCriteria"]
): EligibilityResult {
  const reasons: string[] = [];
  let status: EligibilityStatus = "unknown";

  // Check if job is sponsored
  if (!job.isSponsored) {
    return {
      status: "ineligible",
      reasons: ["Company not on UK sponsor register"],
    };
  }

  // Check SOC code
  const socCode = job.likelySocCode;
  if (socCode) {
    reasons.push(`SOC: ${socCode}`);
  }

  // Determine salary threshold based on user criteria
  let applicableThreshold = UK_VISA_THRESHOLDS.general;
  
  if (userCriteria?.ageCategory === "youngAdult" || userCriteria?.ageCategory === "student") {
    applicableThreshold = UK_VISA_THRESHOLDS.newEntrant;
    reasons.push("New entrant rate applies");
  } else if (userCriteria?.phdStatus === "completed") {
    applicableThreshold = UK_VISA_THRESHOLDS.phd;
    reasons.push("PhD discount applies");
  }

  // Check salary
  const salaryVal = job.salary;
  const salaryStr = typeof salaryVal === 'string' ? salaryVal : (salaryVal ? salaryVal.original : '');
  const salary = job.salaryRange?.min || (salaryStr ? parseSalary(salaryStr) : undefined);
  
  if (salary !== undefined) {
    if (salary >= applicableThreshold) {
      status = "eligible";
      reasons.push(`Salary £${salary.toLocaleString()} meets threshold`);
    } else if (salary >= applicableThreshold * 0.8) {
      status = "partial";
      reasons.push(`Salary £${salary.toLocaleString()} below £${applicableThreshold.toLocaleString()}`);
    } else {
      status = "ineligible";
      reasons.push(`Salary £${salary.toLocaleString()} below minimum`);
    }

    return { status, reasons, threshold: applicableThreshold, salary };
  }

  // If sponsored but no salary info, consider partial
  if (job.isSponsored) {
    status = "partial";
    reasons.push("Salary unknown - verify manually");
  }

  return { status, reasons, threshold: applicableThreshold };
}

// Parse salary string like "£50,000 - £60,000" or "£55k"
function parseSalary(salaryStr: string): number | undefined {
  if (!salaryStr) return undefined;
  
  // Remove currency symbols and commas
  const cleaned = salaryStr.replace(/[£$,]/g, "").toLowerCase();
  
  // Check for "k" notation
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }
  
  // Find first number
  const numMatch = cleaned.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1].replace(/,/g, ""));
  }
  
  return undefined;
}

export function UkVisaBadge({ job, userCriteria, compact = false }: UkVisaBadgeProps) {
  const eligibility = assessUkVisaEligibility(job, userCriteria);

  if (eligibility.status === "unknown") {
    return null;
  }

  const config = {
    eligible: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "UK Visa Eligible",
    },
    partial: {
      variant: "outline" as const,
      className: "border-amber-300 text-amber-700 dark:text-amber-400",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Verify Eligibility",
    },
    ineligible: {
      variant: "outline" as const,
      className: "border-red-300 text-red-600 dark:text-red-400",
      icon: <Shield className="h-3 w-3" />,
      label: "Not Eligible",
    },
  };

  const { className, icon, label } = config[eligibility.status as keyof typeof config] || config.partial;

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={`gap-1 ${className}`}
        title={eligibility.reasons.join(" • ")}
      >
        {icon}
        {eligibility.status === "eligible" ? "UK ✓" : eligibility.status === "partial" ? "UK ?" : "UK ✗"}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${className}`}
      title={eligibility.reasons.join(" • ")}
    >
      {icon}
      {label}
    </Badge>
  );
}

export { assessUkVisaEligibility, type EligibilityResult, type EligibilityStatus };
