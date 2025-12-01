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
  leadership: ['led', 'managed', 'directed', 'supervised', 'orchestrated', 'coordinated', 'oversaw', 'spearheaded', 'championed', 'headed'],
  achievement: ['achieved', 'accomplished', 'delivered', 'completed', 'executed', 'produced', 'generated', 'attained', 'exceeded', 'surpassed'],
  improvement: ['improved', 'enhanced', 'optimized', 'streamlined', 'refined', 'upgraded', 'modernized', 'transformed', 'revitalized', 'strengthened'],
  creation: ['created', 'developed', 'built', 'designed', 'implemented', 'launched', 'established', 'pioneered', 'initiated', 'founded'],
  analysis: ['analyzed', 'evaluated', 'assessed', 'examined', 'investigated', 'researched', 'studied', 'identified', 'diagnosed', 'measured'],
  communication: ['presented', 'communicated', 'explained', 'articulated', 'negotiated', 'collaborated', 'liaised', 'facilitated', 'conveyed', 'persuaded'],
  technical: ['engineered', 'programmed', 'configured', 'integrated', 'deployed', 'automated', 'debugged', 'architected', 'coded', 'tested']
};

const IMPACT_METRICS = [
  /(\$|£|€)\s*\d+(\.\d+)?[kmb]?\b/gi,
  /\d+(\.\d+)?%\s*(growth|increase|decrease|reduction|improvement|boost)/gi,
  /\b\d+\s*(users|customers|clients|employees|team members|projects|accounts)/gi,
  /\d+\s*(hours|days|weeks|months)\s*(saved|reduced|optimized|improved)/gi,
  /\d+\s*(million|billion|thousand|hundred)\b/gi,
  /\bx\d+\s*(faster|better|more efficient)/gi,
  /\b\d+(\.\d+)?x\s*(increase|growth|improvement)/gi,
  /\btop\s*\d+%/gi,
  /\brank(ed)?\s*(#|number)?\s*\d+/gi
];

const INDUSTRY_KEYWORDS = {
  technology: {
    software: ['javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'c++', 'go', 'rust', 'api', 'rest', 'graphql', 'microservices', 'cloud', 'devops', 'agile', 'scrum', 'ci/cd', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'],
    data: ['sql', 'nosql', 'python', 'r', 'machine learning', 'deep learning', 'data analysis', 'statistics', 'visualization', 'pandas', 'tensorflow', 'pytorch', 'spark', 'hadoop', 'etl', 'data pipeline', 'big data', 'analytics'],
    security: ['cybersecurity', 'network security', 'encryption', 'vulnerability', 'penetration testing', 'compliance', 'risk management', 'siem', 'firewall', 'identity management'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'serverless', 'microservices', 'infrastructure as code', 'terraform', 'cloudformation', 'lambda', 'ec2', 's3']
  },
  finance: {
    banking: ['risk management', 'compliance', 'regulatory', 'financial analysis', 'investment', 'portfolio', 'trading', 'derivatives', 'credit', 'lending'],
    accounting: ['financial reporting', 'gaap', 'ifrs', 'audit', 'tax', 'budgeting', 'forecasting', 'financial planning', 'reconciliation', 'accounts payable'],
    fintech: ['digital banking', 'blockchain', 'cryptocurrency', 'payment systems', 'financial technology', 'open banking', 'regtech', 'insurtech']
  },
  marketing: {
    digital: ['seo', 'sem', 'ppc', 'social media marketing', 'content marketing', 'email marketing', 'google analytics', 'conversion optimization', 'a/b testing', 'marketing automation'],
    brand: ['brand management', 'brand strategy', 'positioning', 'brand identity', 'messaging', 'brand development', 'market research', 'consumer insights'],
    product: ['product marketing', 'go-to-market', 'product launch', 'market research', 'competitive analysis', 'pricing strategy', 'product positioning']
  },
  healthcare: {
    clinical: ['patient care', 'clinical operations', 'medical records', 'hipaa', 'ehr', 'emr', 'clinical trials', 'healthcare compliance'],
    administration: ['healthcare management', 'revenue cycle', 'billing', 'medical coding', 'practice management', 'quality improvement'],
    technology: ['health informatics', 'telehealth', 'digital health', 'medical devices', 'healthcare it', 'interoperability']
  }
};

const PROFESSIONAL_LANGUAGE = [
  'strategic', 'innovative', 'collaborative', 'analytical', 'detail-oriented', 'results-driven',
  'proactive', 'adaptable', 'versatile', 'dynamic', 'comprehensive', 'methodical', 'cross-functional',
  'stakeholder', 'scalable', 'efficient', 'effective', 'impactful', 'data-driven', 'customer-focused'
];

const TECHNICAL_TERMS = {
  software: ['api', 'sdk', 'framework', 'library', 'database', 'algorithm', 'architecture', 'scalability', 'performance', 'security'],
  devops: ['ci/cd', 'deployment', 'infrastructure', 'monitoring', 'automation', 'version control', 'containerization', 'orchestration'],
  data: ['machine learning', 'artificial intelligence', 'big data', 'analytics', 'visualization', 'statistics', 'modeling', 'prediction'],
  web: ['frontend', 'backend', 'full-stack', 'responsive', 'accessibility', 'performance', 'optimization', 'user experience']
};

// ATS formatting red flags
const ATS_RED_FLAGS = {
  specialCharacters: /[^\w\s.,;:'"()\-\+\#\@\%\$\/\\&]/g,
  excessiveWhitespace: /\s{4,}/g,
  tableIndicators: /[|│┃┆┇┊┋]/g,
  headerIndicators: /^(#{1,6}|\*{1,3}|_{1,3})\s/gm,
  unicodeSymbols: /[\u2022\u2023\u2043\u2219\u25AA\u25AB\u25CF\u25CB]/g
};

export class EnhancedAtsScorer {
  private resume: ResumeData;
  private targetRole?: string;
  private industry?: string;
  private fullText: string = '';
  private words: string[] = [];

  constructor(resume: ResumeData, options?: { targetRole?: string; industry?: string }) {
    this.resume = resume;
    this.targetRole = options?.targetRole?.toLowerCase();
    this.industry = options?.industry?.toLowerCase();
  }

  public calculateScore(): EnhancedAtsEvaluation {
    this.fullText = this.extractFullText();
    this.words = this.tokenize(this.fullText);

    // Calculate all metrics
    const detailedMetrics = this.calculateDetailedMetrics(this.fullText, this.words);
    const breakdown = this.calculateBreakdown(this.fullText, this.words, detailedMetrics);
    const overall = this.calculateOverallScore(breakdown);

    // Analyze keywords and content
    const keywordAnalysis = this.analyzeKeywords(this.fullText, this.words);
    const contentAnalysis = this.analyzeContent(this.fullText, this.words, detailedMetrics);

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
    const personalInfoValues = Object.values(this.resume.personalInfo).filter(Boolean);
    if (personalInfoValues.length > 0) {
      sections.push(personalInfoValues.join(' '));
    }

    // Experience - ensure proper extraction
    if (this.resume.experience && this.resume.experience.length > 0) {
      this.resume.experience.forEach(exp => {
        const expParts = [
          exp.position,
          exp.company,
          exp.location,
          exp.description,
          ...(exp.achievements || [])
        ].filter(Boolean);
        if (expParts.length > 0) {
          sections.push(expParts.join(' '));
        }
      });
    }

    // Education
    if (this.resume.education && this.resume.education.length > 0) {
      this.resume.education.forEach(edu => {
        const eduParts = [
          edu.degree,
          edu.field,
          edu.institution,
          edu.honors
        ].filter(Boolean);
        if (eduParts.length > 0) {
          sections.push(eduParts.join(' '));
        }
      });
    }

    // Skills
    if (this.resume.skills && this.resume.skills.length > 0) {
      this.resume.skills.forEach(skillGroup => {
        if (skillGroup.skills && skillGroup.skills.length > 0) {
          sections.push(skillGroup.category || '');
          sections.push(skillGroup.skills.join(' '));
        }
      });
    }

    // Projects
    if (this.resume.projects && this.resume.projects.length > 0) {
      this.resume.projects.forEach(project => {
        const projParts = [
          project.name,
          project.description,
          ...(project.technologies || [])
        ].filter(Boolean);
        if (projParts.length > 0) {
          sections.push(projParts.join(' '));
        }
      });
    }

    // Certifications
    if (this.resume.certifications && this.resume.certifications.length > 0) {
      this.resume.certifications.forEach(cert => {
        const certParts = [cert.name, cert.issuer].filter(Boolean);
        if (certParts.length > 0) {
          sections.push(certParts.join(' '));
        }
      });
    }

    return sections.filter(s => s.trim()).join(' ');
  }

  private tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      .match(/\b[\w\-\+\#\.\@]+\b/g) || [];
  }

  private calculateDetailedMetrics(text: string, words: string[]): EnhancedAtsEvaluation['detailedMetrics'] {
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lowerText = text.toLowerCase();

    // Keyword density - more comprehensive matching
    const industryKeywords = this.getIndustryKeywords();
    const keywordMatches = industryKeywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );
    const keywordDensity = wordCount > 0 ? (keywordMatches.length / wordCount) * 100 : 0;

    // Action verb usage - check actual usage in context
    const allActionVerbs = Object.values(ACTION_VERBS).flat();
    const actionVerbMatches = allActionVerbs.filter(verb =>
      lowerText.includes(verb.toLowerCase())
    );
    const actionVerbUsage = sentences.length > 0 
      ? (actionVerbMatches.length / sentences.length) * 100 
      : 0;

    // Quantification score - comprehensive metric detection
    let metricMatchCount = 0;
    for (const pattern of IMPACT_METRICS) {
      const matches = text.match(pattern);
      if (matches) {
        metricMatchCount += matches.length;
      }
    }
    const quantificationScore = Math.min((metricMatchCount / 5) * 100, 100);

    // Section completeness - weighted assessment
    const sectionWeights = {
      personalInfo: { weight: 25, check: () => this.resume.personalInfo.fullName && this.resume.personalInfo.email && this.resume.personalInfo.summary },
      experience: { weight: 30, check: () => this.resume.experience && this.resume.experience.length > 0 },
      education: { weight: 15, check: () => this.resume.education && this.resume.education.length > 0 },
      skills: { weight: 20, check: () => this.resume.skills && this.resume.skills.some(s => s.skills && s.skills.length > 0) },
      projects: { weight: 10, check: () => this.resume.projects && this.resume.projects.length > 0 }
    };
    
    let sectionCompleteness = 0;
    for (const [, config] of Object.entries(sectionWeights)) {
      if (config.check()) {
        sectionCompleteness += config.weight;
      }
    }

    // Professional language usage
    const professionalMatches = PROFESSIONAL_LANGUAGE.filter(term =>
      lowerText.includes(term.toLowerCase())
    );
    const professionalLanguage = wordCount > 0 
      ? (professionalMatches.length / wordCount) * 1000 
      : 0; // Per 1000 words

    // Technical terms usage
    const technicalKeywords = this.getTechnicalKeywords();
    const technicalMatches = technicalKeywords.filter(term =>
      lowerText.includes(term.toLowerCase())
    );
    const technicalTerms = wordCount > 0 
      ? (technicalMatches.length / wordCount) * 1000 
      : 0;

    // Industry alignment
    const industryAlignment = this.calculateIndustryAlignment(words);

    return {
      wordCount,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      actionVerbUsage: Math.round(actionVerbUsage * 100) / 100,
      quantificationScore: Math.round(quantificationScore),
      sectionCompleteness: Math.round(sectionCompleteness),
      professionalLanguage: Math.round(professionalLanguage * 100) / 100,
      technicalTerms: Math.round(technicalTerms * 100) / 100,
      industryAlignment: Math.round(industryAlignment)
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
    let maxScore = 50;

    // Contact information (15 points)
    if (this.resume.personalInfo.fullName) score += 3;
    if (this.resume.personalInfo.email) score += 4;
    if (this.resume.personalInfo.phone) score += 3;
    if (this.resume.personalInfo.location) score += 2;
    if (this.resume.personalInfo.linkedin) score += 2;
    if (this.resume.personalInfo.github || this.resume.personalInfo.website) score += 1;

    // Professional summary (10 points)
    const summary = this.resume.personalInfo.summary || '';
    if (summary.length >= 100 && summary.length <= 400) {
      score += 10;
    } else if (summary.length >= 50) {
      score += 6;
    } else if (summary.length > 0) {
      score += 3;
    }

    // Experience section (12 points)
    if (this.resume.experience && this.resume.experience.length > 0) {
      score += 5;
      const hasDetailedExp = this.resume.experience.some(exp => 
        exp.achievements && exp.achievements.filter(a => a.trim().length > 10).length >= 2
      );
      if (hasDetailedExp) score += 7;
    }

    // Education section (6 points)
    if (this.resume.education && this.resume.education.length > 0) {
      score += 4;
      if (this.resume.education[0].degree) score += 2;
    }

    // Skills section (5 points)
    if (this.resume.skills && this.resume.skills.length > 0) {
      const totalSkills = this.resume.skills.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0);
      if (totalSkills >= 8) score += 5;
      else if (totalSkills >= 4) score += 3;
      else if (totalSkills > 0) score += 1;
    }

    // Projects bonus (2 points)
    if (this.resume.projects && this.resume.projects.length > 0) score += 2;

    return Math.min(Math.round((score / maxScore) * 100), 100);
  }

  private calculateContentScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Word count (optimal range: 350-700 words for ATS)
    if (metrics.wordCount >= 350 && metrics.wordCount <= 700) {
      score += 25;
    } else if (metrics.wordCount >= 250 && metrics.wordCount <= 900) {
      score += 18;
    } else if (metrics.wordCount >= 150 && metrics.wordCount <= 1100) {
      score += 10;
    } else if (metrics.wordCount >= 100) {
      score += 5;
    }

    // Professional language (per 1000 words)
    if (metrics.professionalLanguage >= 8) score += 25;
    else if (metrics.professionalLanguage >= 5) score += 18;
    else if (metrics.professionalLanguage >= 3) score += 12;
    else if (metrics.professionalLanguage >= 1) score += 6;

    // Technical terms relevance
    if (this.industry === 'technology' || this.targetRole?.includes('engineer') || this.targetRole?.includes('developer')) {
      if (metrics.technicalTerms >= 15) score += 25;
      else if (metrics.technicalTerms >= 10) score += 18;
      else if (metrics.technicalTerms >= 5) score += 10;
    } else {
      // For non-tech roles, less emphasis on technical terms
      if (metrics.technicalTerms >= 5) score += 15;
      else if (metrics.technicalTerms >= 2) score += 10;
      score += 10; // Base score for non-tech roles
    }

    // Industry alignment bonus
    score += Math.round((metrics.industryAlignment / 100) * 25);

    return Math.min(score, 100);
  }

  private calculateKeywordScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Keyword density (optimal: 2-5% for ATS systems)
    if (metrics.keywordDensity >= 2 && metrics.keywordDensity <= 5) {
      score += 35;
    } else if (metrics.keywordDensity >= 1.5 && metrics.keywordDensity <= 7) {
      score += 25;
    } else if (metrics.keywordDensity >= 1 && metrics.keywordDensity <= 10) {
      score += 15;
    } else if (metrics.keywordDensity >= 0.5) {
      score += 8;
    }

    // Action verb usage (per sentence)
    if (metrics.actionVerbUsage >= 80) score += 35;
    else if (metrics.actionVerbUsage >= 60) score += 28;
    else if (metrics.actionVerbUsage >= 40) score += 20;
    else if (metrics.actionVerbUsage >= 20) score += 12;
    else if (metrics.actionVerbUsage >= 10) score += 5;

    // Bonus for skill keywords matching industry
    const skillWords = this.resume.skills?.flatMap(s => s.skills || []).join(' ').toLowerCase() || '';
    const industryKeywords = this.getIndustryKeywords();
    const skillMatches = industryKeywords.filter(kw => skillWords.includes(kw.toLowerCase())).length;
    score += Math.min(skillMatches * 3, 30);

    return Math.min(score, 100);
  }

  private calculateFormattingScore(): number {
    let score = 100; // Start with perfect score and deduct for issues

    const text = this.fullText;
    if (!text) return 50;

    // Check for table indicators (major ATS issue)
    const tableMatches = text.match(ATS_RED_FLAGS.tableIndicators);
    if (tableMatches && tableMatches.length > 5) {
      score -= 25;
    } else if (tableMatches && tableMatches.length > 0) {
      score -= 10;
    }

    // Check for excessive whitespace
    const whitespaceMatches = text.match(ATS_RED_FLAGS.excessiveWhitespace);
    if (whitespaceMatches && whitespaceMatches.length > 10) {
      score -= 15;
    } else if (whitespaceMatches && whitespaceMatches.length > 3) {
      score -= 8;
    }

    // Check for problematic special characters
    const specialCharMatches = text.match(ATS_RED_FLAGS.specialCharacters);
    const specialCharRatio = specialCharMatches ? specialCharMatches.length / text.length : 0;
    if (specialCharRatio > 0.05) {
      score -= 20;
    } else if (specialCharRatio > 0.02) {
      score -= 10;
    }

    // Check for unicode bullets (some ATS can't parse these)
    const unicodeMatches = text.match(ATS_RED_FLAGS.unicodeSymbols);
    if (unicodeMatches && unicodeMatches.length > 20) {
      score -= 10;
    }

    // Bonus for clean, simple formatting
    if (!tableMatches && !whitespaceMatches && specialCharRatio < 0.01) {
      score = Math.min(score + 10, 100);
    }

    return Math.max(score, 0);
  }

  private calculateReadabilityScore(text: string, words: string[]): number {
    if (!text || words.length === 0) return 30;

    let score = 0;

    // Average sentence length (optimal: 12-20 words)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    if (avgSentenceLength >= 10 && avgSentenceLength <= 22) {
      score += 40;
    } else if (avgSentenceLength >= 8 && avgSentenceLength <= 28) {
      score += 30;
    } else if (avgSentenceLength >= 5 && avgSentenceLength <= 35) {
      score += 20;
    } else {
      score += 10;
    }

    // Sentence length variety (good writing has variety)
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    if (sentenceLengths.length > 1) {
      const variance = this.calculateVariance(sentenceLengths);
      if (variance > 15) score += 25;
      else if (variance > 8) score += 18;
      else if (variance > 3) score += 10;
    }

    // Check for bullet point structure (good for ATS)
    const bulletLines = text.split('\n').filter(line => 
      line.trim().startsWith('-') || 
      line.trim().startsWith('•') || 
      line.trim().startsWith('*') ||
      /^\d+\./.test(line.trim())
    ).length;
    if (bulletLines >= 5) score += 20;
    else if (bulletLines >= 2) score += 12;

    // Paragraph length (avoid walls of text)
    const paragraphs = text.split(/\n\n+/);
    const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / Math.max(paragraphs.length, 1);
    if (avgParagraphLength < 500) score += 15;
    else if (avgParagraphLength < 800) score += 8;

    return Math.min(score, 100);
  }

  private calculateImpactScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;

    // Quantification is king for impact (40 points)
    if (metrics.quantificationScore >= 80) score += 40;
    else if (metrics.quantificationScore >= 60) score += 32;
    else if (metrics.quantificationScore >= 40) score += 24;
    else if (metrics.quantificationScore >= 20) score += 16;
    else if (metrics.quantificationScore > 0) score += 8;

    // Action verbs drive impact (30 points)
    if (metrics.actionVerbUsage >= 70) score += 30;
    else if (metrics.actionVerbUsage >= 50) score += 24;
    else if (metrics.actionVerbUsage >= 30) score += 18;
    else if (metrics.actionVerbUsage >= 15) score += 10;

    // Achievement-focused language (30 points)
    const achievementWords = ['achieved', 'accomplished', 'delivered', 'improved', 'increased', 'reduced', 'generated', 'saved', 'exceeded', 'transformed'];
    const lowerText = this.fullText.toLowerCase();
    const achievementCount = achievementWords.filter(word => lowerText.includes(word)).length;
    
    if (achievementCount >= 8) score += 30;
    else if (achievementCount >= 5) score += 24;
    else if (achievementCount >= 3) score += 16;
    else if (achievementCount >= 1) score += 8;

    return Math.min(score, 100);
  }

  private calculateModernizationScore(metrics: EnhancedAtsEvaluation['detailedMetrics']): number {
    let score = 0;
    const lowerText = this.fullText.toLowerCase();

    // Modern technology/methodology terms (30 points)
    const modernTerms = [
      'cloud', 'ai', 'machine learning', 'blockchain', 'devops', 'microservices', 
      'serverless', 'agile', 'scrum', 'data-driven', 'automation', 'digital transformation',
      'remote', 'hybrid', 'saas', 'api', 'continuous integration', 'continuous deployment'
    ];
    const modernMatches = modernTerms.filter(term => lowerText.includes(term)).length;
    if (modernMatches >= 6) score += 30;
    else if (modernMatches >= 4) score += 24;
    else if (modernMatches >= 2) score += 16;
    else if (modernMatches >= 1) score += 8;

    // Digital presence (30 points)
    if (this.resume.personalInfo.linkedin) score += 12;
    if (this.resume.personalInfo.github) {
      if (this.industry === 'technology' || this.targetRole?.includes('engineer') || this.targetRole?.includes('developer')) {
        score += 12; // More valuable for tech roles
      } else {
        score += 6;
      }
    }
    if (this.resume.personalInfo.website) score += 6;

    // Modern certifications (20 points)
    if (this.resume.certifications && this.resume.certifications.length > 0) {
      const recentCerts = this.resume.certifications.filter(cert => {
        const certText = (cert.name + ' ' + (cert.issuer || '')).toLowerCase();
        return modernTerms.some(term => certText.includes(term)) ||
               certText.includes('certified') ||
               certText.includes('aws') ||
               certText.includes('google') ||
               certText.includes('microsoft');
      });
      if (recentCerts.length >= 2) score += 20;
      else if (recentCerts.length >= 1) score += 12;
      else score += 5; // Any certification is somewhat valuable
    }

    // Recent technologies in skills (20 points)
    const recentTech = ['react', 'typescript', 'kubernetes', 'docker', 'python', 'node.js', 'aws', 'azure', 'gcp', 'tensorflow', 'pytorch'];
    const skillsText = this.resume.skills?.flatMap(s => s.skills || []).join(' ').toLowerCase() || '';
    const recentTechMatches = recentTech.filter(tech => skillsText.includes(tech)).length;
    if (recentTechMatches >= 5) score += 20;
    else if (recentTechMatches >= 3) score += 14;
    else if (recentTechMatches >= 1) score += 8;

    return Math.min(score, 100);
  }

  private calculateOverallScore(breakdown: EnhancedAtsEvaluation['breakdown']): number {
    // Weighted scoring - keywords and content are most important for ATS
    const weights = {
      structure: 0.15,    // Foundation - required sections
      content: 0.20,      // Quality of content
      keywords: 0.25,     // Most important for ATS matching
      formatting: 0.10,   // Clean formatting for parsing
      readability: 0.10,  // Human readability
      impact: 0.15,       // Achievement focus
      modernization: 0.05 // Modern relevance
    };

    const weightedScore = Object.entries(breakdown).reduce((total, [key, value]) =>
      total + (value * weights[key as keyof typeof weights]), 0
    );

    // Apply curve to make scoring more realistic
    // Very few resumes are truly excellent, most cluster in 50-75 range
    let finalScore = Math.round(weightedScore);
    
    // Penalty for critical missing elements
    if (breakdown.structure < 30) {
      finalScore = Math.min(finalScore, 60); // Cap at 60 if structure is poor
    }
    if (breakdown.keywords < 20) {
      finalScore = Math.max(finalScore - 10, 0); // Penalty for low keywords
    }

    return Math.min(Math.max(finalScore, 0), 100);
  }

  private analyzeKeywords(text: string, words: string[]): { matched: string[]; missing: string[] } {
    const targetKeywords = this.getTargetKeywords();
    const lowerText = text.toLowerCase();
    
    const matched: string[] = [];
    const missing: string[] = [];
    
    targetKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Check for exact or partial match (for compound words)
      if (lowerText.includes(keywordLower) || 
          words.some(w => w.includes(keywordLower))) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    // Also check for action verbs used
    const allActionVerbs = Object.values(ACTION_VERBS).flat();
    const usedActionVerbs = allActionVerbs.filter(verb => 
      lowerText.includes(verb.toLowerCase())
    );
    matched.push(...usedActionVerbs.filter(v => !matched.includes(v)));

    return { 
      matched: [...new Set(matched)], 
      missing: [...new Set(missing)].slice(0, 15) // Limit missing to top 15
    };
  }

  private analyzeContent(text: string, words: string[], metrics: EnhancedAtsEvaluation['detailedMetrics']) {
    const strengths: string[] = [];
    const criticalIssues: string[] = [];
    const improvements: string[] = [];

    // Analyze strengths with thresholds
    if (metrics.actionVerbUsage >= 60) {
      strengths.push('Excellent use of action verbs throughout resume');
    } else if (metrics.actionVerbUsage >= 40) {
      strengths.push('Good use of action verbs to describe achievements');
    }
    
    if (metrics.quantificationScore >= 70) {
      strengths.push('Outstanding quantification of achievements with specific metrics');
    } else if (metrics.quantificationScore >= 50) {
      strengths.push('Strong quantifiable achievements and results');
    }
    
    if (metrics.professionalLanguage >= 8) {
      strengths.push('Excellent professional vocabulary and terminology');
    } else if (metrics.professionalLanguage >= 5) {
      strengths.push('Good use of professional language');
    }
    
    if (metrics.sectionCompleteness >= 85) {
      strengths.push('Comprehensive resume with all key sections complete');
    } else if (metrics.sectionCompleteness >= 70) {
      strengths.push('Well-structured resume with most sections complete');
    }

    if (metrics.industryAlignment >= 70) {
      strengths.push('Strong alignment with industry-specific keywords');
    }

    if (metrics.technicalTerms >= 10 && (this.industry === 'technology' || this.targetRole?.includes('engineer'))) {
      strengths.push('Rich technical vocabulary demonstrating domain expertise');
    }

    // Identify critical issues with specific guidance
    if (!this.resume.personalInfo.fullName || !this.resume.personalInfo.email) {
      criticalIssues.push('🔴 Missing essential contact info - Name and email are required for all resumes');
    }
    
    if (!this.resume.personalInfo.summary || this.resume.personalInfo.summary.length < 50) {
      criticalIssues.push('🔴 Missing or weak professional summary - Add 2-4 impactful sentences highlighting your key value proposition');
    }
    
    if (this.resume.experience.length === 0) {
      criticalIssues.push('🔴 No work experience listed - Add relevant positions with detailed achievements');
    } else {
      const hasDetailedExperience = this.resume.experience.some(exp => 
        exp.description && exp.description.length > 100
      );
      if (!hasDetailedExperience) {
        criticalIssues.push('🔴 Experience descriptions are too brief - Expand with specific achievements and responsibilities');
      }
    }
    
    if (metrics.actionVerbUsage < 15) {
      criticalIssues.push('🔴 Very few action verbs - Start each bullet point with a strong action verb (e.g., Led, Developed, Achieved)');
    }
    
    if (metrics.quantificationScore < 15) {
      criticalIssues.push('🔴 No quantifiable achievements - Add specific numbers, percentages, and metrics to demonstrate impact');
    }

    if (!this.resume.skills || this.resume.skills.length === 0) {
      criticalIssues.push('🔴 No skills section - Add relevant skills categorized by type (Technical, Soft Skills, Languages)');
    }

    // Medium-priority improvements
    if (metrics.wordCount < 250) {
      improvements.push('🟡 Resume is too brief - Expand descriptions to provide more context (aim for 350-600 words)');
    } else if (metrics.wordCount > 900) {
      improvements.push('🟡 Resume may be too long - Consider condensing to highlight most impactful achievements');
    }

    if (metrics.keywordDensity < 1.5) {
      improvements.push('🟡 Low keyword density - Incorporate more industry-specific keywords naturally into descriptions');
    } else if (metrics.keywordDensity > 8) {
      improvements.push('🟡 Possible keyword stuffing - Ensure keywords are used naturally and contextually');
    }

    if (metrics.actionVerbUsage >= 15 && metrics.actionVerbUsage < 35) {
      improvements.push('🟡 Moderate action verb usage - Increase variety and frequency of strong action verbs');
    }

    if (metrics.quantificationScore >= 15 && metrics.quantificationScore < 40) {
      improvements.push('🟡 Limited quantification - Add more specific metrics (%, $, numbers) to achievements');
    }

    if (!this.resume.personalInfo.linkedin) {
      improvements.push('🟢 Consider adding LinkedIn profile URL');
    }

    if (this.industry === 'technology' && !this.resume.personalInfo.github) {
      improvements.push('🟢 Consider adding GitHub profile for technical credibility');
    }

    if (!this.resume.certifications || this.resume.certifications.length === 0) {
      improvements.push('🟢 Consider adding relevant certifications to boost credibility');
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

    // High priority (critical issues) - extract from content analysis
    contentAnalysis.criticalIssues.forEach(issue => {
      const cleanIssue = issue.replace(/^🔴\s*/, '');
      high.push(cleanIssue);
    });

    // Additional high priority based on scores
    if (breakdown.structure < 40 && !high.some(h => h.includes('structure'))) {
      high.push('Improve resume structure - Add all standard sections: Summary, Experience, Education, Skills');
    }

    if (breakdown.formatting < 30) {
      high.push('Fix formatting issues - Use simple formatting, avoid tables and special characters for ATS compatibility');
    }

    // Medium priority (significant improvements)
    contentAnalysis.improvements
      .filter(imp => imp.startsWith('🟡'))
      .forEach(imp => {
        const cleanImp = imp.replace(/^🟡\s*/, '');
        medium.push(cleanImp);
      });

    if (breakdown.keywords < 35 && !medium.some(m => m.includes('keyword'))) {
      medium.push('Enhance keyword optimization - Research job descriptions and incorporate relevant industry terms');
    }

    if (breakdown.content < 40 && !medium.some(m => m.includes('content'))) {
      medium.push('Strengthen content quality - Add more professional language and detailed descriptions');
    }

    if (metrics.actionVerbUsage < 50 && metrics.actionVerbUsage >= 20 && !medium.some(m => m.includes('action verb'))) {
      medium.push('Diversify action verbs - Use a variety of strong verbs like: achieved, implemented, optimized, led');
    }

    // Low priority (nice to have)
    contentAnalysis.improvements
      .filter(imp => imp.startsWith('🟢'))
      .forEach(imp => {
        const cleanImp = imp.replace(/^🟢\s*/, '');
        low.push(cleanImp);
      });

    if (breakdown.modernization < 40 && !low.some(l => l.includes('modern'))) {
      low.push('Update with modern terminology and technologies relevant to your field');
    }

    if (breakdown.readability < 50) {
      low.push('Improve readability - Use bullet points, concise sentences, and clear formatting');
    }

    // Deduplicate and limit
    return { 
      high: [...new Set(high)].slice(0, 5), 
      medium: [...new Set(medium)].slice(0, 5), 
      low: [...new Set(low)].slice(0, 5) 
    };
  }

  // Helper methods
  private getIndustryKeywords(): string[] {
    if (!this.industry) {
      // Return general professional keywords if no industry specified
      return ['communication', 'leadership', 'teamwork', 'problem-solving', 'analytical', 'detail-oriented'];
    }
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

    // Add technical keywords if relevant
    if (this.industry === 'technology' || this.targetRole?.includes('engineer') || this.targetRole?.includes('developer')) {
      keywords.push(...this.getTechnicalKeywords().slice(0, 20));
    }

    return [...new Set(keywords)];
  }

  private getRoleKeywords(role: string): string[] {
    const roleLower = role.toLowerCase();

    const roleMap: { [key: string]: string[] } = {
      'software engineer': ['javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'api', 'git', 'agile', 'testing', 'debugging', 'code review', 'software development'],
      'frontend': ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'typescript', 'responsive design', 'ui/ux', 'web development'],
      'backend': ['node.js', 'python', 'java', 'go', 'api', 'database', 'sql', 'rest', 'microservices', 'server'],
      'fullstack': ['frontend', 'backend', 'api', 'database', 'javascript', 'react', 'node.js', 'full stack', 'web application'],
      'devops': ['ci/cd', 'kubernetes', 'docker', 'aws', 'terraform', 'jenkins', 'automation', 'infrastructure', 'deployment'],
      'data engineer': ['python', 'sql', 'etl', 'data pipeline', 'spark', 'hadoop', 'data warehouse', 'big data', 'airflow'],
      'product manager': ['product strategy', 'roadmap', 'user research', 'analytics', 'stakeholder management', 'agile', 'scrum', 'prioritization', 'market analysis', 'product development'],
      'data scientist': ['python', 'r', 'machine learning', 'deep learning', 'statistics', 'sql', 'data analysis', 'tensorflow', 'pytorch', 'modeling'],
      'data analyst': ['sql', 'excel', 'python', 'tableau', 'data visualization', 'analytics', 'reporting', 'statistics', 'business intelligence'],
      'marketing manager': ['digital marketing', 'seo', 'sem', 'ppc', 'content strategy', 'analytics', 'social media', 'brand management', 'campaign management'],
      'sales': ['pipeline', 'crm', 'revenue', 'account management', 'forecasting', 'negotiation', 'client relationship', 'quota', 'prospecting'],
      'project manager': ['project management', 'pmp', 'agile', 'scrum', 'stakeholder', 'budget', 'timeline', 'risk management', 'resource allocation'],
      'ux designer': ['user research', 'wireframing', 'prototyping', 'figma', 'user testing', 'design thinking', 'user interface', 'interaction design'],
      'hr': ['recruitment', 'talent acquisition', 'employee relations', 'onboarding', 'performance management', 'hris', 'benefits', 'compliance'],
      'finance': ['financial analysis', 'budgeting', 'forecasting', 'accounting', 'financial reporting', 'excel', 'financial modeling', 'variance analysis']
    };

    for (const [key, keywords] of Object.entries(roleMap)) {
      if (roleLower.includes(key)) {
        return keywords;
      }
    }

    // Return generic professional keywords if no role match
    return ['communication', 'collaboration', 'problem-solving', 'leadership', 'analytical'];
  }

  private calculateIndustryAlignment(words: string[]): number {
    const industryKeywords = this.getIndustryKeywords();
    if (industryKeywords.length === 0) return 50; // Neutral if no industry specified

    let matchCount = 0;
    const lowerWords = words.map(w => w.toLowerCase());
    
    industryKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Check for exact matches or partial matches for compound terms
      if (lowerWords.some(word => word.includes(keywordLower) || keywordLower.includes(word))) {
        matchCount++;
      }
    });

    // Scale to percentage with reasonable expectations (matching 20% of keywords is good)
    const alignmentScore = (matchCount / Math.min(industryKeywords.length, 15)) * 100;
    return Math.min(Math.round(alignmentScore), 100);
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
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

  // Calculate a pure ATS compatibility score (focused on parsing success)
  const atsCompatibility = Math.round(
    (evaluation.breakdown.structure * 0.3) +
    (evaluation.breakdown.formatting * 0.3) +
    (evaluation.breakdown.keywords * 0.25) +
    (evaluation.breakdown.readability * 0.15)
  );

  // Calculate completeness based on section presence and detail
  const completeness = Math.round(
    (evaluation.detailedMetrics.sectionCompleteness * 0.6) +
    (Math.min(evaluation.detailedMetrics.wordCount / 5, 40)) // Bonus for content depth, max 40
  );

  // Calculate impact score focused on achievement demonstration
  const impactScore = Math.round(
    (evaluation.breakdown.impact * 0.5) +
    (evaluation.breakdown.content * 0.3) +
    (evaluation.breakdown.modernization * 0.2)
  );

  // Prioritize suggestions: high first, then medium, then low
  const suggestions = [
    ...evaluation.recommendations.high.map(s => `🔴 ${s}`),
    ...evaluation.recommendations.medium.map(s => `🟡 ${s}`),
    ...evaluation.recommendations.low.map(s => `🟢 ${s}`)
  ].slice(0, 10); // Limit to top 10 suggestions

  return {
    overall: evaluation.score,
    completeness: Math.min(completeness, 100),
    ats: atsCompatibility,
    impact: impactScore,
    suggestions,
    breakdown: evaluation.breakdown,
    detailedMetrics: evaluation.detailedMetrics,
    strengths: evaluation.strengths,
    criticalIssues: evaluation.criticalIssues,
    recommendations: evaluation.recommendations
  };
}

// Quick ATS check function for real-time feedback
export function quickATSCheck(resume: ResumeData): {
  score: number;
  status: 'excellent' | 'good' | 'needs-work' | 'poor';
  topIssue: string | null;
} {
  const scorer = new EnhancedAtsScorer(resume);
  const evaluation = scorer.calculateScore();
  
  let status: 'excellent' | 'good' | 'needs-work' | 'poor';
  if (evaluation.score >= 80) status = 'excellent';
  else if (evaluation.score >= 60) status = 'good';
  else if (evaluation.score >= 40) status = 'needs-work';
  else status = 'poor';

  const topIssue = evaluation.recommendations.high[0] || 
                   evaluation.recommendations.medium[0] || 
                   null;

  return { score: evaluation.score, status, topIssue };
}