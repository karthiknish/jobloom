import { ResumeData, ValidationIssue } from "@/types/resume";
import { evaluateAtsCompatibilityFromResume } from "@/lib/ats";

export interface AtsEvaluationOptions {
  targetRole?: string | null;
  industry?: string | null;
}

export function calculateATSScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  const evaluation = evaluateAtsCompatibilityFromResume(resume, options);
  const normalizedScore = Math.round(evaluation.score / 10);
  return Math.min(Math.max(normalizedScore, 0), 10);
}

export function calculateResumeScore(
  resume: ResumeData,
  options?: AtsEvaluationOptions
): number {
  let score = 0;
  const atsEvaluation = evaluateAtsCompatibilityFromResume(resume, options);
  const atsScore = Math.min(Math.max(Math.round(atsEvaluation.score / 10), 0), 10);

  // Personal info (15%)
  const personalFields = ['fullName', 'email', 'phone', 'location', 'summary'] as const;
  personalFields.forEach(f => {
    if ((resume.personalInfo as any)[f]?.trim()) {
      score += 15 / personalFields.length;
    }
  });
  // Experience (25%)
  if (resume.experience.length > 0) {
    score += 10;
    if (resume.experience.length >= 2) score += 5;
    if (resume.experience.some(e => e.description.trim().length > 50)) score += 5;
    if (resume.experience.some(e => e.achievements.some(a => a.trim().length > 20))) score += 5;
  }
  // Education (15%)
  if (resume.education.length > 0) {
    score += 8;
    if (resume.education.some(e => e.degree.trim() && e.field.trim())) score += 4;
    if (resume.education.some(e => e.graduationDate)) score += 3;
  }
  // Skills (20%)
  const skillCount = resume.skills.reduce((acc, s) => acc + s.skills.length, 0);
  if (skillCount > 0) {
    score += 10;
    if (skillCount >= 5) score += 5;
    if (skillCount >= 10) score += 5;
  }
  // Projects (15%)
  if (resume.projects.length > 0) {
    score += 8;
    if (resume.projects.some(p => p.description.trim().length > 30)) score += 4;
    if (resume.projects.some(p => p.technologies.length > 0)) score += 3;
  }
  // ATS (10%)
  score += atsScore;
  return Math.round(score);
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
