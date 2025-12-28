/**
 * ATS Compatibility Checker
 * 
 * Detects common ATS parsing issues.
 */

import { AtsIssue, StandardSection } from './types';

// Standard cover letter sections
export const COVER_LETTER_SECTIONS: StandardSection[] = [
  { id: 'greeting', names: ['dear', 'hi ', 'hello', 'to whom', 'greetings'], required: true },
  { id: 'opener', names: ['i am writing', 'i\'m writing', 'i am excited', 'i\'m excited', 'please accept'], required: true },
  { id: 'body', names: ['experience', 'skills', 'achieved', 'led', 'managed', 'background', 'contribute'], required: true },
  { id: 'closing', names: ['sincerely', 'regards', 'thank you', 'best', 'faithfully', 'looking forward'], required: true },
];

// Standard resume sections ATS expects
export const STANDARD_SECTIONS: StandardSection[] = [
  { id: 'contact', names: ['contact', 'contact information', 'contact details'], required: true },
  { id: 'summary', names: ['summary', 'professional summary', 'profile', 'objective'], required: false },
  { id: 'experience', names: ['experience', 'work experience', 'professional experience', 'employment'], required: true },
  { id: 'education', names: ['education', 'academic background', 'qualifications'], required: true },
  { id: 'skills', names: ['skills', 'technical skills', 'competencies', 'core competencies'], required: false },
  { id: 'projects', names: ['projects', 'key projects', 'portfolio'], required: false },
  { id: 'certifications', names: ['certifications', 'certificates', 'licenses'], required: false },
];

// Common ATS-breaking patterns
const BREAKING_PATTERNS = {
  tableMarkers: /[|│┃┆┇┊┋]/g,
  tabularData: /\t{2,}/g,
  multipleColumns: /(.{20,})\s{5,}(.{20,})/g,
  graphicsInHeader: /\[?(?:image|logo|photo|picture)\]?/gi,
  decorativeBorders: /[═╔╗╚╝║─│┌┐└┘├┤┬┴┼]/g,
  smartQuotes: /[''""]/g,
  longUrls: /https?:\/\/[^\s]{100,}/gi,
};

// Contact info patterns
const CONTACT_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
};

// Date patterns
const DATE_PATTERNS = [
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\b/gi,
  /\b\d{1,2}[\/\-]\d{4}\b/g,
  /\b\d{4}\s*[-–]\s*(present|current|now)\b/gi,
];

/**
 * Check text for ATS compatibility issues
 */
export function checkAtsCompatibility(text: string): AtsIssue[] {
  const issues: AtsIssue[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for tables
  if (BREAKING_PATTERNS.tableMarkers.test(text) || BREAKING_PATTERNS.tabularData.test(text)) {
    issues.push({
      type: 'formatting',
      severity: 'critical',
      title: 'Table formatting detected',
      description: 'Most ATS cannot parse tables correctly.',
      recommendation: 'Convert tables to simple bullet points.',
    });
  }
  
  // Check for multi-column layout
  if (BREAKING_PATTERNS.multipleColumns.test(text)) {
    issues.push({
      type: 'formatting',
      severity: 'major',
      title: 'Multi-column layout detected',
      description: 'Two-column layouts confuse ATS parsers.',
      recommendation: 'Use a single-column layout.',
    });
  }
  
  // Check for graphics
  if (BREAKING_PATTERNS.graphicsInHeader.test(text)) {
    issues.push({
      type: 'parsing',
      severity: 'major',
      title: 'Images or graphics detected',
      description: 'ATS cannot read text in images.',
      recommendation: 'Use plain text only.',
    });
  }
  
  // Check for decorative characters
  const decorative = text.match(BREAKING_PATTERNS.decorativeBorders);
  if (decorative && decorative.length > 5) {
    issues.push({
      type: 'formatting',
      severity: 'major',
      title: 'Decorative characters detected',
      description: 'Special characters can confuse parsing.',
      recommendation: 'Use simple dashes for separators.',
    });
  }
  
  // Check for smart quotes
  if (BREAKING_PATTERNS.smartQuotes.test(text)) {
    issues.push({
      type: 'compatibility',
      severity: 'minor',
      title: 'Smart quotes detected',
      description: 'Curly quotes may not convert properly.',
      recommendation: 'Use straight quotes instead.',
    });
  }
  
  // Check for missing sections
  const foundSections = STANDARD_SECTIONS.filter(section =>
    section.names.some(name => lowerText.includes(name))
  );
  const missingSections = STANDARD_SECTIONS.filter(
    section => section.required && !foundSections.some(f => f.id === section.id)
  );
  
  missingSections.forEach(section => {
    issues.push({
      type: 'structure',
      severity: 'major',
      title: `Missing ${section.names[0]} section`,
      description: `ATS expects a "${section.names[0]}" section.`,
      recommendation: `Add a clear "${section.names[0].toUpperCase()}" heading.`,
    });
  });
  
  // Check for contact info
  if (!hasContactInfo(text)) {
    issues.push({
      type: 'content',
      severity: 'critical',
      title: 'Missing contact information',
      description: 'ATS requires email and phone.',
      recommendation: 'Add email and phone at the top.',
    });
  }
  
  // Check for dates
  if (!hasProperDates(text)) {
    issues.push({
      type: 'parsing',
      severity: 'major',
      title: 'Inconsistent date formats',
      description: 'ATS parses dates for experience duration.',
      recommendation: 'Use "Month YYYY - Month YYYY" format.',
    });
  }
  
  // Check resume length
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  if (wordCount < 200) {
    issues.push({
      type: 'content',
      severity: 'major',
      title: 'Resume too short',
      description: `Only ${wordCount} words detected.`,
      recommendation: 'Add more detail about experience and skills.',
    });
  } else if (wordCount > 1500) {
    issues.push({
      type: 'content',
      severity: 'minor',
      title: 'Resume may be too long',
      description: `${wordCount} words detected.`,
      recommendation: 'Consider condensing to 1-2 pages.',
    });
  }
  
  return issues;
}

// Check for contact information
function hasContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.email.test(text) && CONTACT_PATTERNS.phone.test(text);
}

// Check for proper date formats
function hasProperDates(text: string): boolean {
  return DATE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Calculate ATS compatibility score from issues
 */
export function calculateAtsCompatibilityScore(issues: AtsIssue[]): number {
  let score = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical': score -= 25; break;
      case 'major': score -= 15; break;
      case 'minor': score -= 5; break;
      case 'info': score -= 1; break;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get file type compatibility info
 */
export function checkFileTypeCompatibility(fileType: string): {
  compatible: boolean;
  warnings: string[];
  recommendation: string;
} {
  const type = fileType.toLowerCase();
  
  if (type === 'pdf') {
    return {
      compatible: true,
      warnings: ['Ensure PDF is text-based, not scanned.'],
      recommendation: 'PDF is widely supported.',
    };
  }
  
  if (type === 'docx' || type === 'doc') {
    return {
      compatible: true,
      warnings: type === 'doc' ? ['Old .doc format has less support.'] : [],
      recommendation: '.docx is most universally compatible.',
    };
  }
  
  return {
    compatible: false,
    warnings: [`${type} may not parse correctly.`],
    recommendation: 'Use .docx or .pdf format.',
  };
}

/**
 * Run full ATS check
 */
export function runFullAtsCheck(text: string, fileType: string = 'pdf') {
  const issues = checkAtsCompatibility(text);
  const score = calculateAtsCompatibilityScore(issues);
  const fileCompatibility = checkFileTypeCompatibility(fileType);
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const majorCount = issues.filter(i => i.severity === 'major').length;
  
  return {
    overallScore: score,
    issues,
    fileCompatibility,
    summary: {
      criticalCount,
      majorCount,
      passesBasicParsing: criticalCount === 0,
      readyForSubmission: score >= 70 && criticalCount === 0,
    },
  };
}

/**
 * Evaluate ATS compatibility from raw text (used by CV upload API)
 * This is a simpler interface for API routes
 */
export interface TextEvaluationInput {
  text: string;
  targetRole: string | null;
  industry: string | null;
  fileType: string | null;
}

export function evaluateAtsCompatibilityFromText(input: TextEvaluationInput) {
  const { text, targetRole, industry, fileType } = input;
  const issues = checkAtsCompatibility(text);
  const score = calculateAtsCompatibilityScore(issues);
  const lowerText = text.toLowerCase();
  
  // Get matched/missing keywords based on role and industry
  const { getKeywordsForRole, getKeywordsForIndustry } = require('./keywords');
  
  const targetKeywords: string[] = [];
  if (targetRole) targetKeywords.push(...getKeywordsForRole(targetRole));
  if (industry) targetKeywords.push(...getKeywordsForIndustry(industry));
  
  const matchedKeywords = targetKeywords.filter(kw => 
    lowerText.includes(kw.toLowerCase())
  );
  const missingKeywords = targetKeywords.filter(kw => 
    !lowerText.includes(kw.toLowerCase())
  ).slice(0, 15);
  
  // Identify missing sections
  const foundSections = STANDARD_SECTIONS.filter(section =>
    section.names.some(name => lowerText.includes(name))
  );
  const missingSections = STANDARD_SECTIONS.filter(
    section => section.required && !foundSections.some(f => f.id === section.id)
  ).map(s => s.id);
  
  // Generate suggestions from issues
  const suggestions = issues.map(issue => issue.recommendation);
  
  return {
    score,
    matchedKeywords,
    missingKeywords,
    missingSections,
    suggestions,
    issues,
  };
}

