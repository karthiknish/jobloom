/**
 * ATS Compatibility Checker Utilities
 * 
 * Comprehensive utilities for ensuring resume/CV passes ATS systems.
 * Focuses on common ATS parsing issues and formatting problems.
 */

// Common ATS systems and their parsing quirks
export const ATS_SYSTEMS = {
  TALEO: { 
    name: 'Taleo',
    parsesTables: false,
    parsesColumns: false,
    preferredFormat: 'docx',
    dateFormats: ['MM/YYYY', 'Month YYYY'],
  },
  WORKDAY: { 
    name: 'Workday',
    parsesTables: false,
    parsesColumns: false,
    preferredFormat: 'pdf',
    dateFormats: ['MM/YYYY', 'Month YYYY'],
  },
  GREENHOUSE: { 
    name: 'Greenhouse',
    parsesTables: true,
    parsesColumns: false,
    preferredFormat: 'pdf',
    dateFormats: ['Month YYYY', 'YYYY'],
  },
  LEVER: { 
    name: 'Lever',
    parsesTables: true,
    parsesColumns: true,
    preferredFormat: 'pdf',
    dateFormats: ['Month YYYY'],
  },
  ICIMS: { 
    name: 'iCIMS',
    parsesTables: false,
    parsesColumns: false,
    preferredFormat: 'docx',
    dateFormats: ['MM/YYYY', 'Month YYYY'],
  },
  JOBVITE: { 
    name: 'Jobvite',
    parsesTables: true,
    parsesColumns: true,
    preferredFormat: 'pdf',
    dateFormats: ['Month YYYY'],
  },
  SUCCESSFACTORS: { 
    name: 'SuccessFactors',
    parsesTables: false,
    parsesColumns: false,
    preferredFormat: 'docx',
    dateFormats: ['MM/YYYY'],
  },
};

// ATS Issue Types
export type AtsIssueType = 
  | 'formatting' 
  | 'parsing' 
  | 'content' 
  | 'structure' 
  | 'keyword' 
  | 'compatibility';

export type AtsIssueSeverity = 'critical' | 'major' | 'minor' | 'info';

export interface AtsIssue {
  type: AtsIssueType;
  severity: AtsIssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedSystems?: string[];
}

// Common ATS-breaking patterns
export const ATS_BREAKING_PATTERNS = {
  // Headers and graphics
  graphicsInHeader: /\[?(?:image|logo|photo|picture)\]?/gi,
  headerIcons: /[\u2022\u2023\u2043\u2219\u25AA\u25AB\u25CF\u25CB]/g,
  decorativeBorders: /[═╔╗╚╝║─│┌┐└┘├┤┬┴┼]/g,
  
  // Table formatting
  tableMarkers: /[|│┃┆┇┊┋]/g,
  tabularData: /\t{2,}/g,
  multipleColumns: /(.{20,})\s{5,}(.{20,})/g,
  
  // Special characters
  smartQuotes: /[''""]/g,
  nonStandardBullets: /[•◦▪▫●○◆◇\u2605\u2606]/g,
  emDashes: /[—–]/g,
  
  // File issues
  embeddedObjects: /\[(?:embed|object|chart|graph|diagram)\]/gi,
  hyperLinksWithLongUrls: /https?:\/\/[^\s]{100,}/gi,
  
  // Font issues
  fancyFontIndicators: /(?:script|cursive|handwritten|decorative|artistic)/gi,
  
  // Color issues (in Word XML)
  coloredText: /<w:color[^>]*>/gi,
};

// Standard resume sections ATS expects
export const STANDARD_SECTIONS = [
  { id: 'contact', names: ['contact', 'contact information', 'contact details'], required: true },
  { id: 'summary', names: ['summary', 'professional summary', 'profile', 'objective', 'career objective', 'about'], required: false },
  { id: 'experience', names: ['experience', 'work experience', 'professional experience', 'employment history', 'work history'], required: true },
  { id: 'education', names: ['education', 'academic background', 'qualifications', 'academic qualifications'], required: true },
  { id: 'skills', names: ['skills', 'technical skills', 'core competencies', 'competencies', 'key skills', 'professional skills'], required: false },
  { id: 'projects', names: ['projects', 'key projects', 'personal projects', 'portfolio'], required: false },
  { id: 'certifications', names: ['certifications', 'certificates', 'professional certifications', 'licenses'], required: false },
  { id: 'awards', names: ['awards', 'achievements', 'honors', 'accomplishments'], required: false },
  { id: 'publications', names: ['publications', 'papers', 'research'], required: false },
  { id: 'languages', names: ['languages', 'language skills'], required: false },
];

// Check for common ATS issues in text
export function checkAtsCompatibility(text: string): AtsIssue[] {
  const issues: AtsIssue[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for tables
  if (ATS_BREAKING_PATTERNS.tableMarkers.test(text) || ATS_BREAKING_PATTERNS.tabularData.test(text)) {
    issues.push({
      type: 'formatting',
      severity: 'critical',
      title: 'Table formatting detected',
      description: 'Most ATS systems cannot parse tables correctly and may scramble your content.',
      recommendation: 'Convert tables to simple text with clear line breaks. Use bullet points instead.',
      affectedSystems: ['Taleo', 'Workday', 'iCIMS', 'SuccessFactors'],
    });
  }
  
  // Check for multi-column layout
  if (ATS_BREAKING_PATTERNS.multipleColumns.test(text)) {
    issues.push({
      type: 'formatting',
      severity: 'major',
      title: 'Multi-column layout detected',
      description: 'Two-column or multi-column layouts often confuse ATS parsers.',
      recommendation: 'Use a single-column layout for maximum compatibility.',
      affectedSystems: ['Taleo', 'Workday', 'iCIMS'],
    });
  }
  
  // Check for graphics/images
  if (ATS_BREAKING_PATTERNS.graphicsInHeader.test(text)) {
    issues.push({
      type: 'parsing',
      severity: 'major',
      title: 'Images or graphics detected',
      description: 'ATS cannot read text embedded in images, logos, or graphics.',
      recommendation: 'Remove all images and use plain text only.',
      affectedSystems: Object.keys(ATS_SYSTEMS),
    });
  }
  
  // Check for special characters
  const specialChars = text.match(ATS_BREAKING_PATTERNS.decorativeBorders);
  if (specialChars && specialChars.length > 5) {
    issues.push({
      type: 'formatting',
      severity: 'major',
      title: 'Decorative characters detected',
      description: 'Decorative borders and special characters can confuse ATS parsing.',
      recommendation: 'Use simple dashes or underscores for separators if needed.',
    });
  }
  
  // Check for smart quotes
  if (ATS_BREAKING_PATTERNS.smartQuotes.test(text)) {
    issues.push({
      type: 'compatibility',
      severity: 'minor',
      title: 'Smart quotes detected',
      description: 'Curly/smart quotes may not convert properly in some ATS systems.',
      recommendation: 'Use straight quotes (\' and ") instead of curly quotes.',
    });
  }
  
  // Check for missing standard sections
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
      description: `ATS systems expect a clearly labeled "${section.names[0]}" section.`,
      recommendation: `Add a "${section.names[0].toUpperCase()}" section with relevant content.`,
    });
  });
  
  // Check for contact information
  if (!hasContactInfo(text)) {
    issues.push({
      type: 'content',
      severity: 'critical',
      title: 'Missing contact information',
      description: 'ATS requires email and phone number to create your candidate profile.',
      recommendation: 'Add your email and phone number at the top of your resume.',
    });
  }
  
  // Check for dates
  if (!hasProperDates(text)) {
    issues.push({
      type: 'parsing',
      severity: 'major',
      title: 'Inconsistent or missing date formats',
      description: 'ATS systems parse dates to calculate experience duration.',
      recommendation: 'Use consistent date format: "Month YYYY - Month YYYY" or "MM/YYYY - MM/YYYY".',
    });
  }
  
  // Check for very long URLs
  const longUrls = text.match(ATS_BREAKING_PATTERNS.hyperLinksWithLongUrls);
  if (longUrls && longUrls.length > 0) {
    issues.push({
      type: 'formatting',
      severity: 'minor',
      title: 'Long URLs detected',
      description: 'Very long URLs can break line formatting in ATS.',
      recommendation: 'Use URL shorteners or link text instead of raw URLs.',
    });
  }
  
  // Check resume length (word count)
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  if (wordCount < 200) {
    issues.push({
      type: 'content',
      severity: 'major',
      title: 'Resume appears too short',
      description: `Only ${wordCount} words detected. Most ATS systems expect more content.`,
      recommendation: 'Add more detail about your experience, skills, and achievements.',
    });
  } else if (wordCount > 1500) {
    issues.push({
      type: 'content',
      severity: 'minor',
      title: 'Resume may be too long',
      description: `${wordCount} words detected. Very long resumes may not be fully parsed.`,
      recommendation: 'Consider condensing to 1-2 pages (400-800 words) for most roles.',
    });
  }
  
  return issues;
}

// Check for valid contact information
function hasContactInfo(text: string): boolean {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  
  return emailPattern.test(text) && phonePattern.test(text);
}

// Check for proper date formats
function hasProperDates(text: string): boolean {
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\b/gi,
    /\b\d{1,2}[\/\-]\d{4}\b/g,
    /\b\d{4}\s*[-–]\s*(present|current|now)\b/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\s*[-–]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\b/gi,
  ];
  
  return datePatterns.some(pattern => pattern.test(text));
}

// Calculate ATS compatibility score (0-100)
export function calculateAtsCompatibilityScore(issues: AtsIssue[]): number {
  let score = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'major':
        score -= 15;
        break;
      case 'minor':
        score -= 5;
        break;
      case 'info':
        score -= 1;
        break;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

// Get ATS-friendly text recommendations
export function getAtsOptimizations(text: string): string[] {
  const recommendations: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Action verb suggestions
  const weakVerbs = ['was responsible for', 'helped with', 'worked on', 'assisted with', 'participated in'];
  weakVerbs.forEach(verb => {
    if (lowerText.includes(verb)) {
      recommendations.push(`Replace "${verb}" with strong action verbs like "led", "developed", "achieved", or "implemented".`);
    }
  });
  
  // Quantification check
  const hasNumbers = /\d+%|\$\d+|\d+\+/.test(text);
  if (!hasNumbers) {
    recommendations.push('Add quantified achievements with numbers, percentages, or dollar amounts.');
  }
  
  // Keywords density
  const techKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'java'];
  const foundKeywords = techKeywords.filter(kw => lowerText.includes(kw));
  if (foundKeywords.length < 3) {
    recommendations.push('Consider adding more industry-relevant technical keywords from the job description.');
  }
  
  // Summary check
  if (!lowerText.includes('summary') && !lowerText.includes('profile') && !lowerText.includes('objective')) {
    recommendations.push('Add a professional summary at the top highlighting your key qualifications.');
  }
  
  return recommendations;
}

// File type compatibility check
export function checkFileTypeCompatibility(fileType: string): {
  compatible: boolean;
  warnings: string[];
  recommendation: string;
} {
  const type = fileType.toLowerCase();
  
  if (type === 'pdf') {
    return {
      compatible: true,
      warnings: ['Some older ATS may struggle with complex PDF formatting.'],
      recommendation: 'PDF is widely supported. Ensure it was created from a text document, not scanned.',
    };
  }
  
  if (type === 'docx' || type === 'doc') {
    return {
      compatible: true,
      warnings: type === 'doc' ? ['Older .doc format may have compatibility issues with some ATS.'] : [],
      recommendation: '.docx is the most universally compatible format.',
    };
  }
  
  if (type === 'txt') {
    return {
      compatible: true,
      warnings: ['Plain text loses all formatting.'],
      recommendation: 'Use .docx for better formatting while maintaining compatibility.',
    };
  }
  
  if (type === 'rtf') {
    return {
      compatible: false,
      warnings: ['RTF format is not well supported by many ATS systems.'],
      recommendation: 'Convert to .docx or .pdf before submitting.',
    };
  }
  
  return {
    compatible: false,
    warnings: [`${type} format may not be parsed correctly by ATS.`],
    recommendation: 'Use .docx or .pdf format for best results.',
  };
}

// Comprehensive ATS check result
export interface AtsCheckResult {
  overallScore: number;
  issues: AtsIssue[];
  optimizations: string[];
  fileCompatibility: ReturnType<typeof checkFileTypeCompatibility>;
  summary: {
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    passesBasicParsing: boolean;
    readyForSubmission: boolean;
  };
}

// Run full ATS check
export function runFullAtsCheck(text: string, fileType: string = 'pdf'): AtsCheckResult {
  const issues = checkAtsCompatibility(text);
  const optimizations = getAtsOptimizations(text);
  const fileCompatibility = checkFileTypeCompatibility(fileType);
  const score = calculateAtsCompatibilityScore(issues);
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const majorCount = issues.filter(i => i.severity === 'major').length;
  const minorCount = issues.filter(i => i.severity === 'minor').length;
  
  return {
    overallScore: score,
    issues,
    optimizations,
    fileCompatibility,
    summary: {
      criticalCount,
      majorCount,
      minorCount,
      passesBasicParsing: criticalCount === 0,
      readyForSubmission: score >= 70 && criticalCount === 0,
    },
  };
}
