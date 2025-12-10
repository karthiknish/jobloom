/**
 * ATS Scorer Module
 * 
 * Core scoring logic for ATS evaluation.
 */

import { ResumeData } from '@/types/resume';
import {
  AtsEvaluation,
  AtsScoreBreakdown,
  AtsDetailedMetrics,
  AtsRecommendations,
  AtsEvaluationOptions,
  ResumeScore,
} from './types';
import {
  ACTION_VERBS,
  SOFT_SKILLS,
  IMPACT_PATTERNS,
  getKeywordsForRole,
  getKeywordsForIndustry,
  normalizeKeyword,
} from './keywords';

// Standard resume sections
const EXPECTED_SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills'];

/**
 * Calculate comprehensive ATS score from resume data
 */
export function calculateAtsScore(
  resume: ResumeData,
  options: AtsEvaluationOptions = {}
): AtsEvaluation {
  const fullText = extractResumeText(resume);
  const words = tokenize(fullText);
  
  const metrics = calculateDetailedMetrics(resume, fullText, words);
  const breakdown = calculateBreakdown(resume, metrics, options);
  
  // Calculate overall score (weighted average)
  const weights = { structure: 0.2, content: 0.25, keywords: 0.25, formatting: 0.1, readability: 0.1, impact: 0.1 };
  const score = Math.round(
    breakdown.structure * weights.structure +
    breakdown.content * weights.content +
    breakdown.keywords * weights.keywords +
    breakdown.formatting * weights.formatting +
    breakdown.readability * weights.readability +
    breakdown.impact * weights.impact
  );
  
  const targetKeywords = getTargetKeywords(options);
  const { matched, missing } = analyzeKeywords(fullText, targetKeywords);
  
  const strengths = generateStrengths(resume, metrics, breakdown);
  const issues = generateCriticalIssues(resume, metrics, breakdown);
  const improvements = generateImprovements(resume, metrics, breakdown);
  const recommendations = prioritizeRecommendations(issues, improvements);
  
  return {
    score,
    breakdown,
    detailedMetrics: metrics,
    matchedKeywords: matched,
    missingKeywords: missing,
    strengths,
    criticalIssues: issues,
    improvements,
    recommendations,
  };
}

/**
 * Calculate quick resume score (for UI display)
 */
export function calculateResumeScore(
  resume: ResumeData,
  options: AtsEvaluationOptions = {}
): ResumeScore {
  const evaluation = calculateAtsScore(resume, options);
  
  return {
    overall: evaluation.score,
    completeness: calculateCompleteness(resume),
    ats: evaluation.score,
    impact: evaluation.breakdown.impact,
    suggestions: evaluation.recommendations.high.slice(0, 5),
    breakdown: evaluation.breakdown,
    detailedMetrics: evaluation.detailedMetrics,
    strengths: evaluation.strengths,
    criticalIssues: evaluation.criticalIssues,
    recommendations: evaluation.recommendations,
  };
}

function extractResumeText(resume: ResumeData): string {
  const parts: string[] = [];
  
  const { personalInfo } = resume;
  if (personalInfo.fullName) parts.push(personalInfo.fullName);
  if (personalInfo.summary) parts.push(personalInfo.summary);
  
  resume.experience.forEach(exp => {
    parts.push(exp.company, exp.position, exp.description);
    parts.push(...exp.achievements);
  });
  
  resume.education.forEach(edu => {
    parts.push(edu.institution, edu.degree, edu.field);
  });
  
  resume.skills.forEach(group => {
    parts.push(...group.skills);
  });
  
  resume.projects.forEach(proj => {
    parts.push(proj.name, proj.description);
    parts.push(...proj.technologies);
  });
  
  resume.certifications?.forEach(cert => {
    parts.push(cert.name, cert.issuer);
  });
  
  return parts.filter(Boolean).join(' ');
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function calculateDetailedMetrics(
  resume: ResumeData,
  fullText: string,
  words: string[]
): AtsDetailedMetrics {
  const lowerText = fullText.toLowerCase();
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  const actionVerbList = Object.values(ACTION_VERBS).flat();
  const actionVerbCount = actionVerbList.filter(verb => 
    lowerText.includes(verb.toLowerCase())
  ).length;
  
  const softSkillCount = SOFT_SKILLS.filter(skill => 
    lowerText.includes(skill.toLowerCase())
  ).length;
  
  let impactStatementCount = 0;
  IMPACT_PATTERNS.forEach(pattern => {
    const matches = fullText.match(pattern);
    if (matches) impactStatementCount += matches.length;
  });
  
  const sectionsFound = EXPECTED_SECTIONS.filter(section => 
    hasSection(resume, section)
  );
  const sectionsMissing = EXPECTED_SECTIONS.filter(section => 
    !hasSection(resume, section)
  );
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    actionVerbCount,
    technicalKeywordCount: countTechnicalKeywords(words),
    softSkillCount,
    impactStatementCount,
    quantifiedAchievements: countQuantifiedAchievements(resume),
    sectionsFound,
    sectionsMissing,
    keywordDensity: calculateKeywordDensity(words),
    readabilityGrade: calculateReadabilityGrade(fullText, sentences, words),
  };
}

function hasSection(resume: ResumeData, section: string): boolean {
  switch (section) {
    case 'contact':
      return !!(resume.personalInfo.email || resume.personalInfo.phone);
    case 'summary':
      return !!(resume.personalInfo.summary && resume.personalInfo.summary.length > 30);
    case 'experience':
      return resume.experience.length > 0;
    case 'education':
      return resume.education.length > 0;
    case 'skills':
      return resume.skills.length > 0 && resume.skills.some(g => g.skills.length > 0);
    default:
      return false;
  }
}

function countTechnicalKeywords(words: string[]): number {
  const techWords = new Set([
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
    'kubernetes', 'typescript', 'api', 'rest', 'graphql', 'git', 'agile',
    'scrum', 'ci', 'cd', 'database', 'cloud', 'microservices', 'html', 'css'
  ]);
  return words.filter(w => techWords.has(w)).length;
}

function countQuantifiedAchievements(resume: ResumeData): number {
  let count = 0;
  const numberPattern = /\d+/;
  resume.experience.forEach(exp => {
    exp.achievements.forEach(achievement => {
      if (numberPattern.test(achievement)) count++;
    });
  });
  return count;
}

function calculateKeywordDensity(words: string[]): number {
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return Math.round((uniqueWords.size / words.length) * 100);
}

function calculateReadabilityGrade(
  text: string,
  sentences: string[],
  words: string[]
): number {
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  let totalSyllables = 0;
  words.forEach(word => {
    const vowels = word.match(/[aeiouy]/gi);
    totalSyllables += vowels ? Math.max(1, vowels.length) : 1;
  });
  const avgSyllables = totalSyllables / words.length;
  
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllables - 15.59;
  return Math.max(0, Math.min(20, Math.round(grade)));
}

function calculateBreakdown(
  resume: ResumeData,
  metrics: AtsDetailedMetrics,
  options: AtsEvaluationOptions
): AtsScoreBreakdown {
  return {
    structure: calculateStructureScore(metrics),
    content: calculateContentScore(resume, metrics),
    keywords: calculateKeywordScore(resume, metrics, options),
    formatting: calculateFormattingScore(resume),
    readability: calculateReadabilityScore(metrics),
    impact: calculateImpactScore(metrics),
  };
}

function calculateStructureScore(metrics: AtsDetailedMetrics): number {
  let score = 50;
  if (metrics.sectionsFound.includes('contact')) score += 10;
  if (metrics.sectionsFound.includes('experience')) score += 15;
  if (metrics.sectionsFound.includes('education')) score += 10;
  if (metrics.sectionsFound.includes('skills')) score += 10;
  if (metrics.sectionsFound.includes('summary')) score += 5;
  return Math.min(100, score);
}

function calculateContentScore(resume: ResumeData, metrics: AtsDetailedMetrics): number {
  let score = 40;
  if (metrics.wordCount >= 200) score += 10;
  if (metrics.wordCount >= 400) score += 10;
  if (metrics.actionVerbCount >= 5) score += 10;
  if (metrics.actionVerbCount >= 10) score += 10;
  const totalAchievements = resume.experience.reduce((sum, exp) => sum + exp.achievements.length, 0);
  if (totalAchievements >= 5) score += 10;
  if (totalAchievements >= 10) score += 10;
  return Math.min(100, score);
}

function calculateKeywordScore(
  resume: ResumeData,
  metrics: AtsDetailedMetrics,
  options: AtsEvaluationOptions
): number {
  let score = 40;
  if (metrics.technicalKeywordCount >= 5) score += 15;
  if (metrics.technicalKeywordCount >= 10) score += 15;
  if (metrics.softSkillCount >= 3) score += 10;
  if (metrics.softSkillCount >= 6) score += 10;
  
  if (options.targetRole) {
    const fullText = extractResumeText(resume).toLowerCase();
    const roleKeywords = getKeywordsForRole(options.targetRole);
    const matchCount = roleKeywords.filter(kw => fullText.includes(kw.toLowerCase())).length;
    score += Math.min(10, matchCount * 2);
  }
  return Math.min(100, score);
}

function calculateFormattingScore(resume: ResumeData): number {
  let score = 70;
  if (resume.personalInfo.email && resume.personalInfo.phone) score += 10;
  if (resume.personalInfo.linkedin) score += 5;
  const hasProperDates = resume.experience.every(exp => exp.startDate);
  if (hasProperDates) score += 15;
  return Math.min(100, score);
}

function calculateReadabilityScore(metrics: AtsDetailedMetrics): number {
  let score = 60;
  const ideal = metrics.avgWordsPerSentence >= 12 && metrics.avgWordsPerSentence <= 25;
  if (ideal) score += 20;
  if (metrics.keywordDensity >= 30 && metrics.keywordDensity <= 70) score += 20;
  return Math.min(100, score);
}

function calculateImpactScore(metrics: AtsDetailedMetrics): number {
  let score = 30;
  if (metrics.quantifiedAchievements >= 3) score += 25;
  if (metrics.quantifiedAchievements >= 6) score += 25;
  if (metrics.impactStatementCount >= 2) score += 10;
  if (metrics.impactStatementCount >= 5) score += 10;
  return Math.min(100, score);
}

function getTargetKeywords(options: AtsEvaluationOptions): string[] {
  const keywords: string[] = [];
  if (options.targetRole) keywords.push(...getKeywordsForRole(options.targetRole));
  if (options.industry) keywords.push(...getKeywordsForIndustry(options.industry));
  if (keywords.length === 0) {
    keywords.push(...SOFT_SKILLS.slice(0, 10));
    keywords.push(...Object.values(ACTION_VERBS).flat().slice(0, 20));
  }
  return [...new Set(keywords)];
}

function analyzeKeywords(text: string, keywords: string[]): { matched: string[]; missing: string[] } {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  keywords.forEach(keyword => {
    if (lowerText.includes(normalizeKeyword(keyword))) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  return { matched, missing: missing.slice(0, 10) };
}

function generateStrengths(
  resume: ResumeData,
  metrics: AtsDetailedMetrics,
  breakdown: AtsScoreBreakdown
): string[] {
  const strengths: string[] = [];
  if (breakdown.structure >= 80) strengths.push('Well-structured resume with all key sections');
  if (breakdown.keywords >= 80) strengths.push('Strong keyword optimization');
  if (breakdown.impact >= 70) strengths.push('Good use of quantified achievements');
  if (metrics.actionVerbCount >= 10) strengths.push('Effective use of action verbs');
  if (resume.experience.length >= 3) strengths.push('Solid work experience history');
  return strengths.slice(0, 5);
}

function generateCriticalIssues(
  resume: ResumeData,
  metrics: AtsDetailedMetrics,
  breakdown: AtsScoreBreakdown
): string[] {
  const issues: string[] = [];
  if (breakdown.structure < 50) issues.push('Missing essential resume sections');
  if (!resume.personalInfo.email) issues.push('No email address provided');
  if (!resume.personalInfo.phone) issues.push('No phone number provided');
  if (resume.experience.length === 0) issues.push('No work experience listed');
  if (metrics.wordCount < 150) issues.push('Resume content is too sparse');
  return issues;
}

function generateImprovements(
  resume: ResumeData,
  metrics: AtsDetailedMetrics,
  breakdown: AtsScoreBreakdown
): string[] {
  const improvements: string[] = [];
  if (breakdown.impact < 60) improvements.push('Add more quantified achievements (numbers, percentages, dollar amounts)');
  if (breakdown.keywords < 60) improvements.push('Include more industry-relevant keywords');
  if (metrics.actionVerbCount < 8) improvements.push('Start bullet points with strong action verbs');
  if (!resume.personalInfo.summary) improvements.push('Add a professional summary at the top');
  if (resume.skills.length === 0) improvements.push('Add a dedicated skills section');
  return improvements;
}

function prioritizeRecommendations(issues: string[], improvements: string[]): AtsRecommendations {
  return {
    high: issues.slice(0, 3),
    medium: improvements.slice(0, 3),
    low: improvements.slice(3, 6),
  };
}

function calculateCompleteness(resume: ResumeData): number {
  let score = 0;
  const weights = { name: 10, email: 10, phone: 5, summary: 10, experience: 25, education: 15, skills: 15, projects: 5, certifications: 5 };
  if (resume.personalInfo.fullName) score += weights.name;
  if (resume.personalInfo.email) score += weights.email;
  if (resume.personalInfo.phone) score += weights.phone;
  if (resume.personalInfo.summary && resume.personalInfo.summary.length > 50) score += weights.summary;
  if (resume.experience.length > 0) score += weights.experience;
  if (resume.education.length > 0) score += weights.education;
  if (resume.skills.length > 0) score += weights.skills;
  if (resume.projects.length > 0) score += weights.projects;
  if ((resume.certifications?.length || 0) > 0) score += weights.certifications;
  return Math.min(100, score);
}
