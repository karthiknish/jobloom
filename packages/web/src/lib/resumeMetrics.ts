import { ResumeData, ValidationIssue } from "@/types/resume";
import { evaluateAtsCompatibilityFromResume } from "@/lib/ats";
import { calculateEnhancedATSScore } from "@/lib/enhancedAts";

export interface AtsEvaluationOptions {
  targetRole?: string | null;
  industry?: string | null;
}

export function calculateATSScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  // Use the enhanced ATS scoring system
  const enhancedScore = calculateEnhancedATSScore(resume, options);
  return enhancedScore.ats;
}

export function calculateResumeScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  // Use the enhanced ATS scoring system for comprehensive resume evaluation
  const enhancedScore = calculateEnhancedATSScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined
  });
  return enhancedScore.overall;
}

export function getAtsEvaluation(
  resume: ResumeData,
  options?: AtsEvaluationOptions
) {
  return evaluateAtsCompatibilityFromResume(resume, options);
}

export function suggestKeywords(
  resume: ResumeData,
  pool: string[] = defaultKeywords,
  options?: AtsEvaluationOptions
): string[] {
  const evaluation = evaluateAtsCompatibilityFromResume(resume, options);
  const missing = evaluation.missingKeywords.slice(0, 10);
  if (missing.length >= 6) {
    return missing;
  }

  const text = JSON.stringify(resume).toLowerCase();
  const fallback = pool.filter(k => !text.includes(k.toLowerCase()));
  return Array.from(new Set([...missing, ...fallback])).slice(0, 10);
}

const defaultKeywords = [
  'JavaScript','React','Node.js','Python','TypeScript','AWS','Docker','Leadership','Communication','Agile','Scrum','Data Analysis','Machine Learning'
];

export function getImprovementSuggestions(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): string[] {
  const suggestions: string[] = [];
  const evaluation = evaluateAtsCompatibilityFromResume(resume, options);
  const atsScore = Math.min(Math.max(Math.round(evaluation.score / 10), 0), 10);
  if (!resume.personalInfo.summary?.trim()) suggestions.push('Add a professional summary');
  if (resume.experience.length === 0) suggestions.push('Add at least one experience entry');
  if (resume.experience.some(e => !e.achievements.some(a => a.trim()))) suggestions.push('Provide quantified achievements for each experience');
  if (resume.skills.every(s => s.skills.length === 0)) suggestions.push('Add relevant skills');
  if (resume.projects.length === 0) suggestions.push('Add at least one project');
  if (atsScore < 7) suggestions.push('Improve ATS compatibility (contact info, sections, quantified achievements)');
  suggestions.push(...(evaluation.suggestions || []));
  return Array.from(new Set(suggestions));
}

export function validateResume(resume: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!resume.personalInfo.fullName.trim()) issues.push({ field: 'personalInfo.fullName', message: 'Full name required', severity: 'error' });
  if (resume.personalInfo.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resume.personalInfo.email)) issues.push({ field: 'personalInfo.email', message: 'Invalid email format', severity: 'warning' });
  resume.experience.forEach((exp, idx) => {
    if (exp.startDate && exp.endDate && !exp.current && exp.startDate > exp.endDate) {
      issues.push({ field: `experience.${idx}.dates`, message: 'Start date after end date', severity: 'warning' });
    }
  });
  return issues;
}
