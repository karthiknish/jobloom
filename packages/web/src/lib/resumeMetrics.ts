/**
 * Resume Metrics
 * 
 * Helper functions for evaluating resume quality using the ATS scoring system.
 */

import { ResumeData, ValidationIssue } from "@/types/resume";
import { calculateAtsScore, calculateResumeScore as getResumeScore } from "@/lib/ats";

export interface AtsEvaluationOptions {
  targetRole?: string | null;
  industry?: string | null;
}

/**
 * Get ATS score (0-100)
 */
export function calculateATSScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  const result = calculateAtsScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined,
  });
  return result.score;
}

/**
 * Get overall resume score (0-100)
 */
export function calculateResumeScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  const result = getResumeScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined,
  });
  return result.overall;
}

/**
 * Get full ATS evaluation
 */
export function getAtsEvaluation(
  resume: ResumeData,
  options?: AtsEvaluationOptions
) {
  return calculateAtsScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined,
  });
}

const defaultKeywords = [
  'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker',
  'Leadership', 'Communication', 'Agile', 'Scrum', 'Data Analysis', 'Machine Learning'
];

/**
 * Suggest keywords to add to resume
 */
export function suggestKeywords(
  resume: ResumeData,
  pool: string[] = defaultKeywords,
  options?: AtsEvaluationOptions
): string[] {
  const evaluation = calculateAtsScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined,
  });
  const missing = evaluation.missingKeywords.slice(0, 10);
  if (missing.length >= 6) return missing;

  const text = JSON.stringify(resume).toLowerCase();
  const fallback = pool.filter(k => !text.includes(k.toLowerCase()));
  return Array.from(new Set([...missing, ...fallback])).slice(0, 10);
}

/**
 * Get improvement suggestions
 */
export function getImprovementSuggestions(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): string[] {
  const suggestions: string[] = [];
  const evaluation = calculateAtsScore(resume, {
    targetRole: options?.targetRole || undefined,
    industry: options?.industry || undefined,
  });
  
  if (!resume.personalInfo.summary?.trim()) suggestions.push('Add a professional summary');
  if (resume.experience.length === 0) suggestions.push('Add at least one experience entry');
  if (resume.experience.some(e => !e.achievements.some(a => a.trim()))) {
    suggestions.push('Provide quantified achievements for each experience');
  }
  if (resume.skills.every(s => s.skills.length === 0)) suggestions.push('Add relevant skills');
  if (resume.projects.length === 0) suggestions.push('Add at least one project');
  if (evaluation.score < 70) suggestions.push('Improve ATS compatibility');
  
  suggestions.push(...evaluation.improvements.map(imp => typeof imp === 'string' ? imp : imp.text));
  return Array.from(new Set(suggestions));
}

/**
 * Validate resume data
 */
export function validateResume(resume: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!resume.personalInfo.fullName.trim()) {
    issues.push({ field: 'personalInfo.fullName', message: 'Full name required', severity: 'error' });
  }
  if (resume.personalInfo.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resume.personalInfo.email)) {
    issues.push({ field: 'personalInfo.email', message: 'Invalid email format', severity: 'warning' });
  }
  
  resume.experience.forEach((exp, idx) => {
    if (exp.startDate && exp.endDate && !exp.current && exp.startDate > exp.endDate) {
      issues.push({ field: `experience.${idx}.dates`, message: 'Start date after end date', severity: 'warning' });
    }
  });
  
  return issues;
}
