import { ResumeData, ValidationIssue } from "@/types/resume";

export function calculateATSScore(resume: ResumeData): number {
  let score = 0;
  if (resume.experience.length > 0 || resume.education.length > 0) score += 3;
  if (resume.personalInfo.email && resume.personalInfo.phone) score += 2;
  if (resume.skills.some(s => s.skills.length > 0)) score += 2;
  const quantified = resume.experience.some(exp => exp.achievements.some(a => /\d/.test(a)));
  if (quantified) score += 3;
  return score;
}

export function calculateResumeScore(resume: ResumeData): number {
  let score = 0;
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
  score += calculateATSScore(resume);
  return Math.round(score);
}

export function suggestKeywords(resume: ResumeData, pool: string[] = defaultKeywords): string[] {
  const text = JSON.stringify(resume).toLowerCase();
  return pool.filter(k => !text.includes(k.toLowerCase())).slice(0, 8);
}

const defaultKeywords = [
  'JavaScript','React','Node.js','Python','TypeScript','AWS','Docker','Leadership','Communication','Agile','Scrum','Data Analysis','Machine Learning'
];

export function getImprovementSuggestions(resume: ResumeData): string[] {
  const suggestions: string[] = [];
  if (!resume.personalInfo.summary?.trim()) suggestions.push('Add a professional summary');
  if (resume.experience.length === 0) suggestions.push('Add at least one experience entry');
  if (resume.experience.some(e => !e.achievements.some(a => a.trim()))) suggestions.push('Provide quantified achievements for each experience');
  if (resume.skills.every(s => s.skills.length === 0)) suggestions.push('Add relevant skills');
  if (resume.projects.length === 0) suggestions.push('Add at least one project');
  if (calculateATSScore(resume) < 7) suggestions.push('Improve ATS compatibility (contact info, sections, quantified achievements)');
  return suggestions;
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
