/**
 * Unified ATS Scoring Service
 * 
 * Single entry point for all ATS scoring needs.
 * Handles both resumes and cover letters using the existing lib/ats modules.
 */

import {
  AtsScoreBreakdown,
  AtsDetailedMetrics,
  AtsRecommendations,
  AtsEvaluationOptions,
} from '@/lib/ats/types';

import {
  ACTION_VERBS,
  SOFT_SKILLS,
  IMPACT_PATTERNS,
  getKeywordsForRole,
  getKeywordsForIndustry,
  normalizeKeyword,
} from '@/lib/ats/keywords';

// ============================================================================
// TYPES
// ============================================================================

export interface TextScoringOptions extends AtsEvaluationOptions {
  type?: 'resume' | 'cover-letter';
  keywords?: string[];
  skills?: string[];
}

export interface TextScoringResult {
  score: number;
  breakdown: AtsScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  recommendations: AtsRecommendations;
  detailedMetrics?: AtsDetailedMetrics;
}

// ============================================================================
// MAIN SCORING FUNCTIONS
// ============================================================================

/**
 * Score resume content with comprehensive ATS analysis
 */
export function scoreResume(
  content: string,
  options: TextScoringOptions = {}
): TextScoringResult {
  return scoreUnified(content, 'resume', options);
}

/**
 * Score cover letter content with ATS analysis
 */
export function scoreCoverLetter(
  content: string,
  options: TextScoringOptions = {}
): TextScoringResult {
  return scoreUnified(content, 'cover-letter', options);
}

/**
 * Unified scoring logic for any text type
 */
export function scoreUnified(
  text: string,
  type: 'resume' | 'cover-letter',
  options: TextScoringOptions = {}
): TextScoringResult {
  if (!text || text.trim().length < 50) {
    return getEmptyResult('Content too short for analysis');
  }

  const normalizedText = text.replace(/\n{3,}/g, '\n\n').trim();
  const words = tokenize(normalizedText);
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Calculate detailed metrics
  const metrics = calculateDetailedMetrics(normalizedText, words, sentences, type);

  // Calculate score breakdown
  const breakdown = calculateBreakdown(normalizedText, metrics, options, type);

  // Analyze keywords
  const targetKeywords = getTargetKeywords(options);
  const { matched, missing } = analyzeKeywords(normalizedText, targetKeywords, options.skills || []);

  // Generate actionable feedback
  const strengths = generateStrengths(metrics, breakdown, type);
  const improvements = generateImprovements(metrics, breakdown, type);
  const recommendations = prioritizeRecommendations(improvements);

  // Calculate overall score (weighted average of breakdown categories)
  const score = calculateOverallScore(breakdown, type);

  return {
    score,
    breakdown,
    matchedKeywords: matched,
    missingKeywords: missing,
    strengths,
    improvements,
    recommendations,
    detailedMetrics: metrics,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function getEmptyResult(message: string): TextScoringResult {
  return {
    score: 0,
    breakdown: { structure: 0, content: 0, keywords: 0, formatting: 0, readability: 0, impact: 0 },
    matchedKeywords: [],
    missingKeywords: [],
    strengths: [],
    improvements: [message],
    recommendations: { high: [message], medium: [], low: [] },
  };
}

function calculateDetailedMetrics(
  text: string,
  words: string[],
  sentences: string[],
  type: 'resume' | 'cover-letter'
): AtsDetailedMetrics {
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Flatten action verbs from the object categories
  const actionVerbList = Object.values(ACTION_VERBS).flat();
  const actionVerbCount = words.filter(w => 
    actionVerbList.some((verb: string) => normalizeKeyword(verb) === w)
  ).length;

  // Count technical keywords
  const technicalKeywordCount = countTechnicalKeywords(words);

  // Count soft skills
  const softSkillCount = words.filter(w =>
    SOFT_SKILLS.some(skill => normalizeKeyword(skill) === w)
  ).length;

  // Count impact statements (numbers, percentages, metrics)
  const impactStatementCount = countImpactStatements(text);
  const quantifiedAchievements = countQuantifiedAchievements(text);

  // Sections analysis
  const { found, missing } = analyzeSections(text, type);

  // Keyword density
  const keywordDensity = calculateKeywordDensity(words);

  // Readability grade (Flesch-Kincaid approximation)
  const readabilityGrade = calculateReadabilityGrade(text, sentences, words);

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    actionVerbCount,
    technicalKeywordCount,
    softSkillCount,
    impactStatementCount,
    quantifiedAchievements,
    sectionsFound: found,
    sectionsMissing: missing,
    keywordDensity,
    readabilityGrade,
  };
}

function countTechnicalKeywords(words: string[]): number {
  const techKeywords = new Set([
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'aws',
    'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api', 'rest', 'graphql',
    'database', 'html', 'css', 'cloud', 'devops', 'ci/cd', 'testing', 'analytics'
  ]);
  return words.filter(w => techKeywords.has(w)).length;
}

function countImpactStatements(text: string): number {
  let count = 0;
  IMPACT_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  return count;
}

function countQuantifiedAchievements(text: string): number {
  let count = 0;
  IMPACT_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  return count;
}

function analyzeSections(text: string, type: 'resume' | 'cover-letter'): { found: string[]; missing: string[] } {
  const textLower = text.toLowerCase();
  
  if (type === 'resume') {
    const resumeSections = [
      { id: 'contact', patterns: ['email', 'phone', '@', 'linkedin'] },
      { id: 'summary', patterns: ['summary', 'objective', 'profile', 'about'] },
      { id: 'experience', patterns: ['experience', 'work history', 'employment'] },
      { id: 'education', patterns: ['education', 'degree', 'university', 'college'] },
      { id: 'skills', patterns: ['skills', 'technologies', 'proficiencies', 'expertise'] },
    ];
    
    const found = resumeSections
      .filter(s => s.patterns.some(p => textLower.includes(p)))
      .map(s => s.id);
    const missing = resumeSections
      .filter(s => !s.patterns.some(p => textLower.includes(p)))
      .map(s => s.id);
    
    return { found, missing };
  }
  
  // Cover letter sections
  const clSections = [
    { id: 'greeting', patterns: ['dear', 'hi ', 'hello', 'to whom'] },
    { id: 'opener', patterns: ['i am writing', 'i\'m writing', 'i am excited', 'i\'m excited'] },
    { id: 'body', patterns: ['experience', 'skills', 'achieved', 'led', 'managed'] },
    { id: 'closing', patterns: ['sincerely', 'regards', 'thank you', 'best'] },
  ];
  
  const found = clSections
    .filter(s => s.patterns.some(p => textLower.includes(p)))
    .map(s => s.id);
  const missing = clSections
    .filter(s => !s.patterns.some(p => textLower.includes(p)))
    .map(s => s.id);
  
  return { found, missing };
}

function calculateKeywordDensity(words: string[]): number {
  if (words.length === 0) return 0;
  const uniqueKeywords = new Set(words);
  return Math.round((uniqueKeywords.size / words.length) * 100);
}

function calculateReadabilityGrade(text: string, sentences: string[], words: string[]): number {
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  let totalSyllables = 0;
  words.forEach(word => {
    const vowels = word.match(/[aeiouy]/gi);
    totalSyllables += vowels ? Math.max(1, vowels.length) : 1;
  });
  const avgSyllables = totalSyllables / words.length;
  
  const grade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllables) - 15.59;
  return Math.max(0, Math.min(20, Math.round(grade)));
}

function calculateBreakdown(
  text: string,
  metrics: AtsDetailedMetrics,
  options: TextScoringOptions,
  type: 'resume' | 'cover-letter'
): AtsScoreBreakdown {
  return {
    structure: calculateStructureScore(metrics, type),
    content: calculateContentScore(metrics),
    keywords: calculateKeywordScore(text, options),
    formatting: calculateFormattingScore(text),
    readability: calculateReadabilityScore(metrics),
    impact: calculateImpactScore(metrics),
  };
}

function calculateStructureScore(metrics: AtsDetailedMetrics, type: 'resume' | 'cover-letter'): number {
  const expectedSections = type === 'resume' ? 5 : 4;
  const sectionScore = (metrics.sectionsFound.length / expectedSections) * 100;
  
  // Word count scoring
  let lengthScore = 50;
  if (type === 'resume') {
    if (metrics.wordCount >= 300 && metrics.wordCount <= 700) lengthScore = 100;
    else if (metrics.wordCount >= 200 && metrics.wordCount <= 900) lengthScore = 75;
  } else {
    if (metrics.wordCount >= 200 && metrics.wordCount <= 400) lengthScore = 100;
    else if (metrics.wordCount >= 150 && metrics.wordCount <= 500) lengthScore = 75;
  }
  
  return Math.min(100, Math.round((sectionScore + lengthScore) / 2));
}

function calculateContentScore(metrics: AtsDetailedMetrics): number {
  let score = 50;
  
  // Action verbs (very important)
  if (metrics.actionVerbCount >= 10) score += 25;
  else if (metrics.actionVerbCount >= 5) score += 15;
  else if (metrics.actionVerbCount >= 2) score += 8;
  
  // Technical keywords
  if (metrics.technicalKeywordCount >= 8) score += 15;
  else if (metrics.technicalKeywordCount >= 4) score += 10;
  
  // Soft skills
  if (metrics.softSkillCount >= 3) score += 10;
  
  return Math.min(100, score);
}

function calculateKeywordScore(text: string, options: TextScoringOptions): number {
  const targetKeywords = getTargetKeywords(options);
  if (targetKeywords.length === 0) return 70; // No target, assume decent
  
  const textLower = text.toLowerCase();
  const matchCount = targetKeywords.filter(kw => 
    textLower.includes(normalizeKeyword(kw))
  ).length;
  
  return Math.min(100, Math.round((matchCount / targetKeywords.length) * 100));
}

function calculateFormattingScore(text: string): number {
  let score = 60;
  
  // Check for proper line breaks (not too dense, not too sparse)
  const lineCount = text.split('\n').length;
  const wordCount = text.split(/\s+/).length;
  const avgWordsPerLine = wordCount / lineCount;
  
  if (avgWordsPerLine >= 8 && avgWordsPerLine <= 20) score += 20;
  else if (avgWordsPerLine >= 5 && avgWordsPerLine <= 25) score += 10;
  
  // Check for proper capitalization (section headers)
  const hasUppercaseHeaders = /^[A-Z][A-Z\s]+$/m.test(text);
  if (hasUppercaseHeaders) score += 10;
  
  // Avoid excessive special characters
  const specialCharRatio = (text.match(/[^\w\s.,!?;:'-]/g) || []).length / text.length;
  if (specialCharRatio < 0.05) score += 10;
  
  return Math.min(100, score);
}

function calculateReadabilityScore(metrics: AtsDetailedMetrics): number {
  // Target reading grade 8-12 for professional documents
  const grade = metrics.readabilityGrade;
  if (grade >= 8 && grade <= 12) return 100;
  if (grade >= 6 && grade <= 14) return 80;
  if (grade >= 4 && grade <= 16) return 60;
  return 40;
}

function calculateImpactScore(metrics: AtsDetailedMetrics): number {
  let score = 40;
  
  // Quantified achievements are key
  if (metrics.quantifiedAchievements >= 3) score += 30;
  if (metrics.quantifiedAchievements >= 6) score += 20;
  
  // Impact statements
  if (metrics.impactStatementCount >= 3) score += 10;
  
  return Math.min(100, score);
}

function calculateOverallScore(breakdown: AtsScoreBreakdown, type: 'resume' | 'cover-letter'): number {
  // Weight categories differently for resume vs cover letter
  if (type === 'resume') {
    return Math.round(
      breakdown.structure * 0.15 +
      breakdown.content * 0.20 +
      breakdown.keywords * 0.25 +
      breakdown.formatting * 0.10 +
      breakdown.readability * 0.10 +
      breakdown.impact * 0.20
    );
  }
  
  // Cover letter weights
  return Math.round(
    breakdown.structure * 0.15 +
    breakdown.content * 0.25 +
    breakdown.keywords * 0.20 +
    breakdown.formatting * 0.10 +
    breakdown.readability * 0.15 +
    breakdown.impact * 0.15
  );
}

function getTargetKeywords(options: TextScoringOptions): string[] {
  const keywords: string[] = [];
  
  if (options.targetRole) {
    keywords.push(...getKeywordsForRole(options.targetRole));
  }
  if (options.industry) {
    keywords.push(...getKeywordsForIndustry(options.industry));
  }
  if (options.keywords) {
    keywords.push(...options.keywords);
  }
  if (options.skills) {
    keywords.push(...options.skills);
  }
  
  return [...new Set(keywords)];
}

function analyzeKeywords(text: string, targetKeywords: string[], skills: string[]): { matched: string[]; missing: string[] } {
  const textLower = text.toLowerCase();
  const allKeywords = [...new Set([...targetKeywords, ...skills])];
  
  const matched = allKeywords.filter(kw => 
    textLower.includes(normalizeKeyword(kw))
  );
  const missing = allKeywords.filter(kw => 
    !textLower.includes(normalizeKeyword(kw))
  );
  
  return { matched, missing };
}

function generateStrengths(
  metrics: AtsDetailedMetrics,
  breakdown: AtsScoreBreakdown,
  type: 'resume' | 'cover-letter'
): string[] {
  const strengths: string[] = [];
  
  if (breakdown.structure >= 80) strengths.push(`Well-organized ${type} with clear sections`);
  if (breakdown.content >= 80) strengths.push('Strong use of action verbs and professional language');
  if (breakdown.keywords >= 80) strengths.push('Excellent keyword coverage for target role');
  if (breakdown.impact >= 80) strengths.push('Good quantified achievements demonstrating impact');
  if (metrics.actionVerbCount >= 8) strengths.push(`${metrics.actionVerbCount} strong action verbs used`);
  if (metrics.quantifiedAchievements >= 3) strengths.push('Measurable results included');
  if (metrics.sectionsFound.length >= 4) strengths.push('All key sections present');
  
  return strengths.slice(0, 5);
}

function generateImprovements(
  metrics: AtsDetailedMetrics,
  breakdown: AtsScoreBreakdown,
  type: 'resume' | 'cover-letter'
): string[] {
  const improvements: string[] = [];
  
  if (breakdown.structure < 70) {
    improvements.push(`Add missing sections: ${metrics.sectionsMissing.join(', ')}`);
  }
  if (breakdown.keywords < 70) {
    improvements.push('Include more relevant keywords from job descriptions');
  }
  if (breakdown.impact < 70) {
    improvements.push('Add quantified achievements (percentages, numbers, metrics)');
  }
  if (metrics.actionVerbCount < 5) {
    improvements.push('Use more action verbs like "Led", "Achieved", "Developed"');
  }
  if (breakdown.readability < 70) {
    improvements.push('Improve readability with shorter sentences');
  }
  if (metrics.wordCount < 200) {
    improvements.push('Expand content with more detail about experience');
  }
  if (metrics.wordCount > 800 && type === 'resume') {
    improvements.push('Consider condensing to 1-2 pages (300-600 words)');
  }
  
  return improvements.slice(0, 5);
}

function prioritizeRecommendations(improvements: string[]): AtsRecommendations {
  // Simple prioritization: first 2 are high, next 2 are medium, rest are low
  return {
    high: improvements.slice(0, 2),
    medium: improvements.slice(2, 4),
    low: improvements.slice(4),
  };
}

// End of scoring service
