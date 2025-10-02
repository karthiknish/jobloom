import { ResumeData } from "@/types/resume";

// Enhanced ATS scoring with advanced metrics
export interface EnhancedAtsEvaluation {
  score: number;
  breakdown: {
    structure: number;
    content: number;
    keywords: number;
    formatting: number;
    readability: number;
    impact: number;
    modernization: number;
  };
  detailedMetrics: {
    wordCount: number;
    keywordDensity: number;
    actionVerbUsage: number;
    quantificationScore: number;
    sectionCompleteness: number;
    professionalLanguage: number;
    technicalTerms: number;
    industryAlignment: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  criticalIssues: string[];
  improvements: string[];
  recommendations: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

export interface ResumeScore {
  overall: number;
  completeness: number;
  ats: number;
  impact: number;
  suggestions: string[];
  breakdown?: EnhancedAtsEvaluation['breakdown'];
  detailedMetrics?: EnhancedAtsEvaluation['detailedMetrics'];
  strengths?: string[];
  criticalIssues?: string[];
  recommendations?: EnhancedAtsEvaluation['recommendations'];
}

// Enhanced keyword libraries with semantic matching
const ACTION_VERBS = {
  leadership: ['led', 'managed', 'directed', 'supervised', 'orchestrated', 'coordinated', 'oversaw'],
  achievement: ['achieved', 'accomplished', 'delivered', 'completed', 'executed', 'produced', 'generated'],
  improvement: ['improved', 'enhanced', 'optimized', 'streamlined', 'refined', 'upgraded', 'modernized'],
  creation: ['created', 'developed', 'built', 'designed', 'implemented', 'launched', 'established'],
  analysis: ['analyzed', 'evaluated', 'assessed', 'examined', 'investigated', 'researched', 'studied'],
  communication: ['presented', 'communicated', 'explained', 'articulated', 'negotiated', 'collaborated', 'liaised']
};

const IMPACT_METRICS = [
  /(\$|£|€)\d+[kmb]?\b/gi,
  /\d+%?\s*(growth|increase|reduction|improvement)/gi,
  /\d+\s+(users|customers|clients|employees|team members|projects)/gi,
  /\d+\s+(hours|days|weeks|months)\s+(saved|reduced|optimized)/gi,
  /\d+\s*(million|billion|thousand)/gi
];

const INDUSTRY_KEYWORDS = {
  technology: {
    software: ['javascript', 'react', 'node.js', 'python', 'java', 'typescript', 'api', 'cloud', 'devops', 'agile', 'scrum'],
    data: ['sql', 'python', 'machine learning', 'data analysis', 'statistics', 'visualization', 'pandas', 'tensorflow'],
    security: ['cybersecurity', 'network security', 'encryption', 'vulnerability', 'compliance', 'risk management'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'serverless', 'microservices', 'infrastructure']
  },
  finance: {
    banking: ['risk management', 'compliance', 'regulatory', 'financial analysis', 'investment', 'portfolio', 'trading'],
    accounting: ['financial reporting', 'gaap', 'audit', 'tax', 'budgeting', 'forecasting', 'financial planning'],
    fintech: ['digital banking', 'blockchain', 'cryptocurrency', 'payment systems', 'financial technology', 'innovation']
  },
  marketing: {
    digital: ['seo', 'sem', 'ppc', 'social media', 'content marketing', 'email marketing', 'analytics', 'conversion'],
    brand: ['brand management', 'brand strategy', 'positioning', 'identity', 'messaging', 'brand development'],
    product: ['product marketing', 'go-to-market', 'product launch', 'market research', 'competitive analysis']
  }
};

const PROFESSIONAL_LANGUAGES = [
  'strategic', 'innovative', 'collaborative', 'analytical', 'detail-oriented', 'results-driven',
  'proactive', 'adaptable', 'versatile', 'dynamic', 'comprehensive', 'methodical'
];

const TECHNICAL_TERMS = {
  software: ['api', 'sdk', 'framework', 'library', 'database', 'algorithm', 'architecture', 'scalability'],
  devops: ['ci/cd', 'deployment', 'infrastructure', 'monitoring', 'automation', 'version control', 'containerization'],
  data: ['machine learning', 'artificial intelligence', 'big data', 'analytics', 'visualization', 'statistics'],
  web: ['frontend', 'backend', 'full-stack', 'responsive', 'accessibility', 'performance', 'optimization']
};

export class EnhancedAtsScorer {
  private resume: ResumeData;
  private targetRole?: string;
  private industry?: string;

  constructor(resume: ResumeData, options?: { targetRole?: string; industry?: string }) {
    this.resume = resume;
    this.targetRole = options?.targetRole;
    this.industry = options?.industry;
  }

  public calculateScore(): EnhancedAtsEvaluation {
    const fullText = this.extractFullText();
    const words = this.tokenize(fullText);

    // Calculate all metrics
    const detailedMetrics = this.calculateDetailedMetrics(fullText, words);
    const breakdown = this.calculateBreakdown(fullText, words, detailedMetrics);
    const overall = this.calculateOverallScore(breakdown);

    // Analyze keywords and content
    const keywordAnalysis = this.analyzeKeywords(fullText, words);
    const contentAnalysis = this.analyzeContent(fullText, words, detailedMetrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, detailedMetrics, contentAnalysis);

    return {
      score: overall,
      breakdown,
      detailedMetrics,
      matchedKeywords: keywordAnalysis.matched,
      missingKeywords: keywordAnalysis.missing,
      strengths: contentAnalysis.strengths,
      criticalIssues: contentAnalysis.criticalIssues,
      improvements: contentAnalysis.improvements,
      recommendations
    };
  }

  private extractFullText(): string {
    const sections: string[] = [];

    // Personal info
    sections.push(
      Object.values(this.resume.personalInfo)
        .filter(Boolean)
        .join(' ')
    );

    // Experience
    this.resume.experience.forEach(exp => {
      sections.push(
        [exp.position, exp.company, exp.description, ...exp.achievements]
          .filter(Boolean)
          .join(' ')
      );
    });

    // Education
    this.resume.education.forEach(edu => {
      sections.push(
        [edu.degree, edu.field, edu.institution]
          .filter(Boolean)
          .join(' ')
      );
    });

    // Skills
    this.resume.skills.forEach(skillGroup => {
      sections.push(skillGroup.skills.join(' '));
    });

    // Projects
    this.resume.projects.forEach(project => {
      sections.push(
        [project.name, project.description, ...project.technologies]
          .filter(Boolean)
          .join(' ')
      );
    });

    return sections.join(' ');
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .match(/\b[\w\-\+\#\.\@]+\b/g) || [];
  }

  private calculateDetailedMetrics(text: string, words: string[]): EnhancedAtsEvaluation['detailedMetrics'] {
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Keyword density
    const industryKeywords = this.getIndustryKeywords();
    const keywordMatches = industryKeywords.filter(keyword =>
      words.some(word => word.includes(keyword.toLowerCase()))
    );
    const keywordDensity = (keywordMatches.length / Math.max(wordCount, 1)) * 100;

    // Action verb usage
    const allActionVerbs = Object.values(ACTION_VERBS).flat();
    const actionVerbMatches = words.filter(word =>
      allActionVerbs.includes(word)
    );
    const actionVerbUsage = (actionVerbMatches.length / Math.max(sentences.length, 1)) * 100;

    // Quantification score
    const metricMatches = text.match(/\b(\d+%|\$\d+|\d+\s*(customers|users|projects|revenue|growth|roi))\b/gi) || [];
    const quantificationScore = Math.min((metricMatches.length / 5) * 100, 100);

    // Section completeness
    const requiredSections = ['personalInfo', 'experience', 'education', 'skills'];
    const completedSections = requiredSections.filter(section => {
      if (section === 'personalInfo') {
        return this.resume.personalInfo.fullName && this.resume.personalInfo.email;
      }
      return this.resume[section as keyof ResumeData] &&
             Array.isArray(this.resume[section as keyof ResumeData]) &&
             (this.resume[section as keyof ResumeData] as any[]).length > 0;
    });
    const sectionCompleteness = (completedSections.length / requiredSections.length) * 100;

    // Professional language usage
    const professionalMatches = words.filter(word =>
      PROFESSIONAL_LANGUAGES.includes(word)
    );
    const professionalLanguage = (professionalMatches.length / Math.max(wordCount, 1)) * 1000; // Per 1000 words

    // Technical terms usage
    const technicalKeywords = this.getTechnicalKeywords();
    const technicalMatches = words.filter(word =>
      technicalKeywords.includes(word)
    );
    const technicalTerms = (technicalMatches.length / Math.max(wordCount, 1)) * 1000;

    // Industry alignment
    const industryAlignment = this.calculateIndustryAlignment(words);

    return {
      wordCount,
      keywordDensity,
      actionVerbUsage,
      quantificationScore,
      sectionCompleteness,
      professionalLanguage,
      technicalTerms,
      industryAlignment
    };
  }

  private calculateBreakdown(text: string, words: string[], metrics: EnhancedAtsEvaluation['detailedMetrics']): EnhancedAtsEvaluation['breakdown'] {
    return {
      structure: this.calculateStructureScore(),
      content: this.calculateContentScore(metrics),
      keywords: this.calculateKeywordScore(metrics),
      formatting: this.calculateFormattingScore(),
      readability: this.calculateReadabilityScore(text, words),
      impact: this.calculateImpactScore(metrics),
      modernization: this.calculateModernizationScore(metrics)
    };
  }

  private calculateStructureScore(): number {
    let score = 0;

    // Required sections
    if (this.resume.personalInfo.fullName) score += 5;
    if (this.resume.personalInfo.email) score += 5;
    if (this.resume.personalInfo.summary) score += 5;
    if (this.resume.experience.length > 0) score += 10;
    if (this.resume.education.length > 0) score += 10;
    if (this.resume.skills.length > 0) score += 10;
    if (this.resume.projects.length > 0) score += 5;

    // Section order (logical flow)
    const logicalOrder = ['personalInfo', 'experience', 'education', 'skills', 'projects'];
    // Simplified check - in real implementation would check actual order

    return Math.min(score, 50);
  }

  private calculateContentScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Word count (optimal range: 400-600 words)
    if (metrics.wordCount >= 400 && metrics.wordCount <= 600) score += 15;
    else if (metrics.wordCount >= 300 && metrics.wordCount <= 800) score += 10;
    else if (metrics.wordCount >= 200) score += 5;

    // Professional language
    if (metrics.professionalLanguage >= 5) score += 15;
    else if (metrics.professionalLanguage >= 3) score += 10;
    else if (metrics.professionalLanguage >= 1) score += 5;

    // Technical terms (if relevant)
    if (this.industry === 'technology' && metrics.technicalTerms >= 10) score += 10;
    else if (metrics.technicalTerms >= 5) score += 5;

    // Industry alignment
    score += (metrics.industryAlignment / 100) * 10;

    return Math.min(score, 50);
  }

  private calculateKeywordScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Keyword density (optimal: 2-5%)
    if (metrics.keywordDensity >= 2 && metrics.keywordDensity <= 5) score += 20;
    else if (metrics.keywordDensity >= 1 && metrics.keywordDensity <= 8) score += 15;
    else if (metrics.keywordDensity >= 0.5) score += 10;

    // Action verb usage
    if (metrics.actionVerbUsage >= 60) score += 15;
    else if (metrics.actionVerbUsage >= 40) score += 10;
    else if (metrics.actionVerbUsage >= 20) score += 5;

    return Math.min(score, 35);
  }

  private calculateFormattingScore(): number {
    let score = 30; // Start with perfect score

    // Deductions for common ATS issues
    const text = this.extractFullText();

    // Tables or complex formatting
    if (text.includes('|') || text.includes('\t')) score -= 10;

    // Special characters
    const specialCharCount = (text.match(/[^\w\s.,;:'"()\-\+\#\@\%]/g) || []).length;
    if (specialCharCount > 20) score -= 10;

    // Excessive whitespace
    if (text.match(/\s{4,}/)) score -= 5;

    // Very long paragraphs
    const paragraphs = text.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.length > 500);
    if (longParagraphs.length > 0) score -= 5;

    return Math.max(score, 0);
  }

  private calculateReadabilityScore(text: string, words: string[]): number {
    let score = 20;

    // Average sentence length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;

    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 15;
    else if (avgSentenceLength >= 8 && avgSentenceLength <= 25) score += 10;
    else if (avgSentenceLength >= 6 && avgSentenceLength <= 30) score += 5;

    // Variety in sentence length
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const variance = this.calculateVariance(sentenceLengths);
    if (variance > 10) score += 10;
    else if (variance > 5) score += 5;

    return Math.min(score, 45);
  }

  private calculateImpactScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Quantification
    score += metrics.quantificationScore * 0.4;

    // Action verbs
    score += (metrics.actionVerbUsage / 100) * 30;

    // Achievement language
    const text = this.extractFullText();
    const achievementWords = ['achieved', 'accomplished', 'delivered', 'improved', 'increased', 'reduced'];
    const achievementCount = achievementWords.filter(word =>
      text.toLowerCase().includes(word)
    ).length;
    score += Math.min(achievementCount * 5, 30);

    return Math.min(score, 100);
  }

  private calculateModernizationScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Modern technical terms
    const modernTerms = ['cloud', 'ai', 'machine learning', 'blockchain', 'devops', 'microservices', 'serverless'];
    const text = this.extractFullText();
    const modernMatches = modernTerms.filter(term =>
      text.toLowerCase().includes(term)
    );
    score += Math.min(modernMatches.length * 10, 30);

    // Digital presence indicators
    if (this.resume.personalInfo.linkedin) score += 20;
    if (this.resume.personalInfo.github && this.industry === 'technology') score += 15;
    if (this.resume.personalInfo.website) score += 10;

    // Modern certifications or skills
    if (this.resume.certifications && this.resume.certifications.length > 0) score += 15;

    return Math.min(score, 75);
  }

  private calculateOverallScore(breakdown: EnhancedAtsEvaluation['breakdown']): number {
    const weights = {
      structure: 0.15,
      content: 0.20,
      keywords: 0.25,
      formatting: 0.10,
      readability: 0.15,
      impact: 0.10,
      modernization: 0.05
    };

    return Math.round(
      Object.entries(breakdown).reduce((total, [key, value]) =>
        total + (value * weights[key as keyof typeof weights]), 0
      )
    );
  }

  private analyzeKeywords(text: string, words: string[]): { matched: string[]; missing: string[] } {
    const targetKeywords = this.getTargetKeywords();
    const matched = targetKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    const missing = targetKeywords.filter(keyword =>
      !text.toLowerCase().includes(keyword.toLowerCase())
    );

    return { matched, missing };
  }

  private analyzeContent(text: string, words: string[], metrics: EnhancedAtsEvaluation['detailedMetrics']) {
    const strengths: string[] = [];
    const criticalIssues: string[] = [];
    const improvements: string[] = [];

    // Analyze strengths
    if (metrics.actionVerbUsage >= 50) {
      strengths.push('Strong use of action verbs to drive achievements');
    }
    if (metrics.quantificationScore >= 60) {
      strengths.push('Excellent use of quantifiable metrics and results');
    }
    if (metrics.professionalLanguage >= 5) {
      strengths.push('Professional language and terminology');
    }
    if (metrics.sectionCompleteness >= 80) {
      strengths.push('Well-structured with complete sections');
    }

    // Identify critical issues
    if (!this.resume.personalInfo.summary) {
      criticalIssues.push('Missing professional summary - add 2-3 sentences highlighting your value');
    }
    if (this.resume.experience.length === 0) {
      criticalIssues.push('No work experience listed - add relevant positions');
    }
    if (metrics.actionVerbUsage < 20) {
      criticalIssues.push('Low action verb usage - start bullet points with strong action verbs');
    }
    if (metrics.quantificationScore < 20) {
      criticalIssues.push('Lacks quantifiable achievements - add specific metrics and results');
    }

    // General improvements
    if (metrics.wordCount < 300) {
      improvements.push('Consider expanding descriptions with more detail and context');
    } else if (metrics.wordCount > 800) {
      improvements.push('Consider condensing content to focus on most relevant achievements');
    }

    if (metrics.keywordDensity < 1) {
      improvements.push('Incorporate more industry-specific keywords naturally');
    }

    return { strengths, criticalIssues, improvements };
  }

  private generateRecommendations(
    breakdown: EnhancedAtsEvaluation['breakdown'],
    metrics: EnhancedAtsEvaluation['detailedMetrics'],
    contentAnalysis: ReturnType<EnhancedAtsScorer['analyzeContent']>
  ): EnhancedAtsEvaluation['recommendations'] {
    const high: string[] = [];
    const medium: string[] = [];
    const low: string[] = [];

    // High priority (critical issues)
    high.push(...contentAnalysis.criticalIssues);

    if (breakdown.structure < 30) {
      high.push('Improve resume structure - ensure all required sections are present and well-organized');
    }

    if (breakdown.formatting < 20) {
      high.push('Fix formatting issues - remove tables, special characters, and ensure ATS-friendly layout');
    }

    // Medium priority (significant improvements)
    if (breakdown.keywords < 20) {
      medium.push('Enhance keyword optimization - include more relevant industry and role-specific terms');
    }

    if (breakdown.content < 30) {
      medium.push('Strengthen content quality - add more detail, professional language, and technical terms');
    }

    if (metrics.actionVerbUsage < 40) {
      medium.push('Increase action verb usage - start bullet points with stronger action verbs');
    }

    // Low priority (nice to have improvements)
    if (breakdown.modernization < 30) {
      low.push('Update with modern technologies and digital presence indicators');
    }

    if (metrics.quantificationScore < 50) {
      low.push('Add more quantifiable achievements and specific results');
    }

    return { high, medium, low };
  }

  // Helper methods
  private getIndustryKeywords(): string[] {
    if (!this.industry) return [];
    const industryData = INDUSTRY_KEYWORDS[this.industry as keyof typeof INDUSTRY_KEYWORDS];
    if (!industryData) return [];

    return Object.values(industryData).flat();
  }

  private getTechnicalKeywords(): string[] {
    const allTechnical = Object.values(TECHNICAL_TERMS).flat();
    return allTechnical;
  }

  private getTargetKeywords(): string[] {
    const keywords = this.getIndustryKeywords();

    // Add role-specific keywords
    if (this.targetRole) {
      const roleKeywords = this.getRoleKeywords(this.targetRole);
      keywords.push(...roleKeywords);
    }

    return [...new Set(keywords)];
  }

  private getRoleKeywords(role: string): string[] {
    const roleLower = role.toLowerCase();

    const roleMap: { [key: string]: string[] } = {
      'software engineer': ['javascript', 'react', 'node.js', 'python', 'api', 'git', 'agile'],
      'product manager': ['product strategy', 'roadmap', 'user research', 'analytics', 'stakeholder'],
      'data scientist': ['python', 'machine learning', 'statistics', 'sql', 'data analysis'],
      'marketing manager': ['digital marketing', 'seo', 'sem', 'content strategy', 'analytics'],
      'sales manager': ['pipeline', 'crm', 'revenue', 'account management', 'forecasting']
    };

    for (const [key, keywords] of Object.entries(roleMap)) {
      if (roleLower.includes(key)) {
        return keywords;
      }
    }

    return [];
  }

  private calculateIndustryAlignment(words: string[]): number {
    const industryKeywords = this.getIndustryKeywords();
    if (industryKeywords.length === 0) return 50; // Neutral if no industry specified

    const matches = words.filter(word =>
      industryKeywords.some(keyword => word.includes(keyword.toLowerCase()))
    );

    return Math.min((matches.length / industryKeywords.length) * 100, 100);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return variance;
  }
}

// Enhanced scoring function
export function calculateEnhancedATSScore(
  resume: ResumeData,
  options?: { targetRole?: string; industry?: string }
): ResumeScore {
  const scorer = new EnhancedAtsScorer(resume, options);
  const evaluation = scorer.calculateScore();

  return {
    overall: evaluation.score,
    completeness: evaluation.breakdown.structure,
    ats: Math.round(
      (evaluation.breakdown.structure +
       evaluation.breakdown.keywords +
       evaluation.breakdown.formatting +
       evaluation.breakdown.readability) / 4
    ),
    impact: evaluation.breakdown.impact,
    suggestions: [
      ...evaluation.recommendations.high,
      ...evaluation.recommendations.medium,
      ...evaluation.recommendations.low
    ].slice(0, 8), // Limit to top 8 suggestions
    breakdown: evaluation.breakdown,
    detailedMetrics: evaluation.detailedMetrics,
    strengths: evaluation.strengths,
    criticalIssues: evaluation.criticalIssues,
    recommendations: evaluation.recommendations
  };
}