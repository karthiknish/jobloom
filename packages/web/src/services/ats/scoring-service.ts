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
  AtsRecommendationItem,
} from '@/lib/ats/types';

import {
  ACTION_VERBS,
  SOFT_SKILLS,
  IMPACT_PATTERNS,
  getKeywordsForRole,
  getKeywordsForIndustry,
  normalizeKeyword,
  INDUSTRY_TECHNICAL_KEYWORDS,
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
  improvements: (string | AtsRecommendationItem)[];
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
  const metrics = calculateDetailedMetrics(normalizedText, words, sentences, type, options.industry);

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
  type: 'resume' | 'cover-letter',
  industry?: string
): AtsDetailedMetrics {
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Flatten action verbs from the object categories
  const actionVerbList = Object.values(ACTION_VERBS).flat();
  const actionVerbCount = words.filter(w => 
    actionVerbList.some((verb: string) => normalizeKeyword(verb) === w)
  ).length;

  // Sections analysis
  const { found, missing } = analyzeSections(text, type);

  // Count technical keywords (industry-aware)
  // Now includes tech keywords as baseline and detects multi-industry terms
  const technicalKeywordCount = countTechnicalKeywords(text, type, industriesFromText(text));

  // Count soft skills
  const softSkillCount = words.filter(w =>
    SOFT_SKILLS.some(skill => normalizeKeyword(skill) === w)
  ).length;

  // Count impact statements (numbers, percentages, metrics)
  const impactStatementCount = countImpactStatements(text);
  const quantifiedAchievements = countQuantifiedAchievements(text);

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

function industriesFromText(text: string): string[] {
  const textLower = text.toLowerCase();
  const industries = new Set<string>();
  
  if (textLower.includes('patient') || textLower.includes('clinic') || textLower.includes('hipaa')) industries.add('healthcare');
  if (textLower.includes('financial') || textLower.includes('invest') || textLower.includes('gaap') || textLower.includes('audit')) industries.add('finance');
  if (textLower.includes('curriculum') || textLower.includes('student') || textLower.includes('teach')) industries.add('education');
  if (textLower.includes('marketing') || textLower.includes('campaign') || textLower.includes('seo')) industries.add('marketing');
  if (textLower.includes('legal') || textLower.includes('contract')) industries.add('legal');
  if (textLower.includes('sales') || textLower.includes('pipeline')) industries.add('sales');
  
  if (industries.size === 0) industries.add('technology');
  return Array.from(industries);
}

function countTechnicalKeywords(text: string, type: string, industries: string[]): number {
  const allTerms = new Set<string>(INDUSTRY_TECHNICAL_KEYWORDS.technology);
  
  for (const industry of industries) {
    const terms = INDUSTRY_TECHNICAL_KEYWORDS[industry] || [];
    terms.forEach(term => allTerms.add(term));
  }
  
  let count = 0;
  for (const term of allTerms) {
    const lowerTerm = term.toLowerCase();
    const regex = new RegExp(`\\b${lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      count++;
    }
  }
  return count;
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
      { id: 'contact', patterns: ['email', 'phone', '@'] },
      { id: 'summary', patterns: ['summary', 'objective', 'profile', 'about'] },
      { id: 'experience', patterns: ['experience', 'work history', 'employment'] },
      { id: 'education', patterns: ['education', 'degree', 'university', 'college'] },
      { id: 'skills', patterns: ['skills', 'technologies', 'proficiencies', 'expertise'] },
    ];
    
    const found = resumeSections
      .filter(s => {
        // More robust section detection:
        // 1. Check for standalone headers (uppercase or followed by newline/colon)
        // 2. Check for keywords in proximity to potential section boundaries
        return s.patterns.some(p => {
          // Contact info often isn't a standalone header
          if (s.id === 'contact') return textLower.includes(p);
          
          // Strict header detection for other sections: At start of line, potentially preceded by whitespace, 
          // followed by colon or newline. Case insensitive here but headers are usually uppercase.
          const regex = new RegExp(`(^|\\n)\\s*${p}\\b[:\\s]*(\\n|$)`, 'i');
          return regex.test(textLower);
        });
      })
      .map(s => s.id);
    const missing = resumeSections
      .filter(s => !found.includes(s.id))
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
    keywords: calculateKeywordScore(text, metrics, options),
    formatting: calculateFormattingScore(text),
    readability: calculateReadabilityScore(metrics),
    impact: calculateImpactScore(metrics),
  };
}

function calculateStructureScore(metrics: AtsDetailedMetrics, type: 'resume' | 'cover-letter'): number {
  const expectedSections = type === 'resume' ? 5 : 4;
  const sectionScore = (metrics.sectionsFound.length / expectedSections) * 100;
  
  // Word count scoring (more gradual)
  let lengthScore = 40;
  if (type === 'resume') {
    if (metrics.wordCount >= 300 && metrics.wordCount <= 800) lengthScore = 100;
    else if (metrics.wordCount >= 200 && metrics.wordCount <= 1000) lengthScore = 85;
    else if (metrics.wordCount >= 100 && metrics.wordCount <= 1200) lengthScore = 70;
  } else {
    if (metrics.wordCount >= 200 && metrics.wordCount <= 400) lengthScore = 100;
    else if (metrics.wordCount >= 150 && metrics.wordCount <= 600) lengthScore = 80;
    else if (metrics.wordCount >= 100) lengthScore = 60;
  }
  
  return Math.min(100, Math.round((sectionScore + lengthScore) / 2));
}

function calculateContentScore(metrics: AtsDetailedMetrics): number {
  let score = 50;
  
  // Action verbs (very important)
  if (metrics.actionVerbCount >= 10) score += 25;
  else if (metrics.actionVerbCount >= 5) score += 15;
  else if (metrics.actionVerbCount >= 2) score += 8;
  
  // Technical keywords (weight reduced from 25 to 15)
  if (metrics.technicalKeywordCount >= 8) score += 15;
  else if (metrics.technicalKeywordCount >= 4) score += 10;
  
  // Soft skills (weight increased)
  if (metrics.softSkillCount >= 5) score += 15;
  else if (metrics.softSkillCount >= 3) score += 10;
  
  return Math.min(100, score);
}

function calculateKeywordScore(text: string, metrics: AtsDetailedMetrics, options: TextScoringOptions): number {
  const targetKeywords = getTargetKeywords(options);
  
  // If keywords provided in options (JD scan), use strict matching
  if (targetKeywords.length > 0) {
    const textLower = text.toLowerCase();
    const matchCount = targetKeywords.filter(kw => {
      const normalized = normalizeKeyword(kw);
      return textLower.includes(normalized);
    }).length;
    
    return Math.min(100, Math.round((matchCount / targetKeywords.length) * 100));
  }
  
  // Industry-blind matching (Generous fallback for general scans)
  // Use technical keywords and soft skills as a proxy
  let score = 60; 
  score += Math.min(25, metrics.technicalKeywordCount * 4);
  score += Math.min(15, metrics.softSkillCount * 3);
  
  return Math.min(100, score);
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
  // Target reading grade 8-14 for professional documents
  // Be more lenient on the upper end for technical documents
  const grade = metrics.readabilityGrade;
  if (grade >= 8 && grade <= 14) return 100;
  if (grade >= 6 && grade <= 18) return 85;
  if (grade >= 4 && grade <= 20) return 70;
  return 50;
}

function calculateImpactScore(metrics: AtsDetailedMetrics): number {
  let score = 40;
  
  // Quantified achievements are key (slightly more sensitive)
  if (metrics.quantifiedAchievements >= 3) score += 35;
  else if (metrics.quantifiedAchievements >= 1) score += 20;
  
  if (metrics.quantifiedAchievements >= 6) score += 15;
  
  // Impact statements
  if (metrics.impactStatementCount >= 3) score += 10;
  
  return Math.min(100, score);
}

function calculateOverallScore(breakdown: AtsScoreBreakdown, type: 'resume' | 'cover-letter'): number {
  // Fetch potential adjustments based on learning points
  // In a real scenario, this would be cached or fetched once per session
  const adjustments = getScoringAdjustments(type);

  // Weight categories differently for resume vs cover letter
  if (type === 'resume') {
    const score = Math.round(
      breakdown.structure * (0.15 + (adjustments.structure || 0)) +
      breakdown.content * (0.20 + (adjustments.content || 0)) +
      breakdown.keywords * (0.25 + (adjustments.keywords || 0)) +
      breakdown.formatting * (0.10 + (adjustments.formatting || 0)) +
      breakdown.readability * (0.10 + (adjustments.readability || 0)) +
      breakdown.impact * (0.20 + (adjustments.impact || 0))
    );
    return Math.max(0, Math.min(100, score));
  }
  
  // Cover letter weights
  const score = Math.round(
    breakdown.structure * (0.15 + (adjustments.structure || 0)) +
    breakdown.content * (0.25 + (adjustments.content || 0)) +
    breakdown.keywords * (0.20 + (adjustments.keywords || 0)) +
    breakdown.formatting * (0.10 + (adjustments.formatting || 0)) +
    breakdown.readability * (0.15 + (adjustments.readability || 0)) +
    breakdown.impact * (0.15 + (adjustments.impact || 0))
  );
  return Math.max(0, Math.min(100, score));
}

/**
 * Get scoring weight adjustments based on verified learning points
 * This allows the system to auto-tune itself based on user feedback trends
 */
function getScoringAdjustments(type: string): Record<string, number> {
  // This is a simplified version. In production, this would fetch from a 
  // 'scoring_overrides' collection populated by the aggregation engine.
  // For now, it's a placeholder for the mechanism.
  return {};
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
): AtsRecommendationItem[] {
  const improvements: AtsRecommendationItem[] = [];
  
  if (breakdown.structure < 70) {
    improvements.push({
      id: 'missing_sections',
      text: `Add missing sections: ${metrics.sectionsMissing.join(', ')}`,
      metadata: { missing: metrics.sectionsMissing }
    });
  }
  if (breakdown.keywords < 70) {
    improvements.push({
      id: 'low_keyword_density',
      text: 'Include more relevant keywords from job descriptions',
    });
  }
  if (breakdown.impact < 70) {
    improvements.push({
      id: 'low_impact',
      text: 'Add quantified achievements (percentages, numbers, metrics)',
    });
  }
  if (metrics.actionVerbCount < 5) {
    improvements.push({
      id: 'few_action_verbs',
      text: 'Use more action verbs like "Led", "Achieved", "Developed"',
      metadata: { count: metrics.actionVerbCount }
    });
  }
  if (breakdown.readability < 70) {
    improvements.push({
      id: 'low_readability',
      text: 'Improve readability with shorter sentences',
      metadata: { grade: metrics.readabilityGrade }
    });
  }
  if (metrics.wordCount < 200) {
    improvements.push({
      id: 'short_content',
      text: 'Expand content with more detail about experience',
      metadata: { count: metrics.wordCount }
    });
  }
  if (metrics.wordCount > 800 && type === 'resume') {
    improvements.push({
      id: 'long_content',
      text: 'Consider condensing to 1-2 pages (300-600 words)',
      metadata: { count: metrics.wordCount }
    });
  }
  
  return improvements;
}

function prioritizeRecommendations(improvements: AtsRecommendationItem[]): AtsRecommendations {
  // Simple prioritization: first 2 are high, next 2 are medium, rest are low
  return {
    high: improvements.slice(0, 2),
    medium: improvements.slice(2, 4),
    low: improvements.slice(4),
  };
}

// End of scoring service
