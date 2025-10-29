// Enhanced job description parser with fuzzy matching and improved SOC code detection
export interface EnhancedJobData {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
    original: string;
  } | null;
  jobType: string;
  experienceLevel: string;
  qualifications: string[];
  skills: string[];
  requirements: string[];
  benefits: string[];
  remoteWork: boolean;
  companySize: string;
  industry: string;
  postedDate: string;
  applicationDeadline: string;
  isSponsored: boolean;
  sponsorshipType: string;
  dateFound: string;
  source: string;
  
  // Enhanced fields
  normalizedTitle: string;
  extractedKeywords: string[];
  likelySocCode?: string;
  socMatchConfidence: number;
  matchedSocTitles: string[];
  department: string;
  seniority: string;
  employmentType: string;
  locationType: string;
}

export interface SocCodeMatch {
  code: string;
  title: string;
  confidence: number;
  matchedKeywords: string[];
  relatedTitles: string[];
  eligibility: string;
}

// Fuzzy matching utilities
class FuzzyMatcher {
  // Calculate Levenshtein distance
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate similarity ratio (0-1)
  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Extract words from text, removing common stop words
  static extractWords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  // Calculate word overlap between two texts
  static wordOverlap(text1: string, text2: string): number {
    const words1 = new Set(this.extractWords(text1));
    const words2 = new Set(this.extractWords(text2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Job title normalization
class JobTitleNormalizer {
  private static readonly TITLE_VARIATIONS = {
    'software engineer': ['software developer', 'software eng', 'sde', 'developer', 'programmer'],
    'senior software engineer': ['senior software developer', 'senior sde', 'lead developer', 'principal engineer'],
    'product manager': ['pm', 'product owner', 'product lead'],
    'data scientist': ['data analyst', 'data engineer', 'research scientist'],
    'ux designer': ['ui designer', 'user experience designer', 'product designer'],
    'project manager': ['pm', 'program manager', 'project lead'],
    'business analyst': ['ba', 'systems analyst', 'process analyst'],
    'marketing manager': ['marketing lead', 'brand manager', 'digital marketing manager'],
    'sales manager': ['sales lead', 'business development manager', 'account manager'],
    'hr manager': ['human resources manager', 'people manager', 'talent manager'],
    'operations manager': ['ops manager', 'operations lead', 'process manager']
  };

  private static readonly SENIORITY_LEVELS = {
    'junior': ['jr', 'entry level', 'graduate', 'trainee'],
    'mid-level': ['mid', 'intermediate', 'experienced'],
    'senior': ['sr', 'lead', 'principal', 'head'],
    'manager': ['manager', 'lead', 'head of'],
    'director': ['director', 'vp', 'head of department'],
    'executive': ['ceo', 'cto', 'cfo', 'chief', 'executive', 'president']
  };

  static normalizeTitle(title: string): { normalized: string; seniority: string; keywords: string[] } {
    const lowerTitle = title.toLowerCase();
    
    // Extract seniority
    let seniority = 'mid-level';
    for (const [level, variations] of Object.entries(this.SENIORITY_LEVELS)) {
      if (variations.some(variation => lowerTitle.includes(variation))) {
        seniority = level;
        break;
      }
    }

    // Normalize title variations
    let normalized = lowerTitle;
    for (const [standard, variations] of Object.entries(this.TITLE_VARIATIONS)) {
      for (const variation of variations) {
        if (lowerTitle.includes(variation)) {
          normalized = lowerTitle.replace(variation, standard);
          break;
        }
      }
    }

    // Extract keywords
    const keywords = FuzzyMatcher.extractWords(normalized);

    return {
      normalized: normalized.trim(),
      seniority,
      keywords
    };
  }
}

// Enhanced salary extraction
class SalaryExtractor {
  private static readonly SALARY_PATTERNS = [
    // £50,000 - £70,000
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[-–]\s*£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    // £50k-£70k
    /£?(\d{1,3})k\s*[-–]\s*£?(\d{1,3})k/gi,
    // £50,000 per annum
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|p\.?)(?:annum|annum|year|yr)/gi,
    // £50 per hour
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|p\.?)\s*hour/gi,
    // £50k-£80k DOE
    /£?(\d{1,3})k\s*[-–]\s*£?(\d{1,3})k\s*(?:doe|negotiable)/gi
  ];

  static extract(text: string): { min?: number; max?: number; currency: string; period: string; original: string } | null {
    for (const pattern of this.SALARY_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const min = parseFloat(match[1].replace(/,/g, ''));
        const max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : min;
        
        // Determine period
        let period = 'annum';
        if (text.toLowerCase().includes('hour') || text.toLowerCase().includes('hr')) {
          period = 'hour';
        } else if (text.toLowerCase().includes('day')) {
          period = 'day';
        } else if (text.toLowerCase().includes('month')) {
          period = 'month';
        }

        return {
          min: min * 1000, // Convert k to full amount if needed
          max: max * 1000,
          currency: 'GBP',
          period,
          original: match[0]
        };
      }
    }

    return null;
  }
}

// Main enhanced job parser
export class EnhancedJobParser {
  // Enhanced job extraction with multiple strategies
  static async extractJobFromPage(document: Document, url: string): Promise<EnhancedJobData | null> {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Try different extraction strategies based on the site
    let jobData = null;
    
    if (domain.includes('linkedin.com')) {
      jobData = this.extractFromLinkedIn(document, url);
    } else if (domain.includes('indeed')) {
      jobData = this.extractFromIndeed(document, url);
    } else {
      jobData = this.extractFromGeneric(document, url);
    }

    if (!jobData) return null;

    // Enhance the extracted data
    return this.enhanceJobData(jobData, document);
  }

  private static extractFromLinkedIn(document: Document, url: string): Partial<EnhancedJobData> | null {
    try {
      // Extract job title
      const titleElement = document.querySelector('h1.top-card-layout__title, .top-jobs-title, h1');
      const title = titleElement?.textContent?.trim() || '';

      // Extract company
      const companyElement = document.querySelector('.topcard__org-name-link, .top-jobs-company-name, [data-test-id="job-details-company-name"]');
      const company = companyElement?.textContent?.trim() || '';

      // Extract location
      const locationElement = document.querySelector('.topcard__flavor-row, .top-jobs-location, [data-test-id="job-details-location"]');
      const location = locationElement?.textContent?.trim() || '';

      // Extract description
      const descriptionElement = document.querySelector('div.show-more-less-html__markup, .jobs-description__content, .job-description-container');
      const description = descriptionElement?.innerHTML || '';

      // Extract salary using enhanced patterns
      const salaryText = document.querySelector('.compensation__salary, .job-salary, [data-test-id="job-details-salary"]')?.textContent || '';
      const salary = SalaryExtractor.extract(salaryText);

      // Extract job details
      const employmentType = document.querySelector('.job-criteria__text--criteria, [data-test-id="job-details-employment-type"]')?.textContent?.trim() || '';
      const seniorityLevel = document.querySelector('.job-criteria__text--criteria, [data-test-id="job-details-seniority-level"]')?.textContent?.trim() || '';
      const companySize = document.querySelector('.job-criteria__text--criteria, [data-test-id="job-details-company-size"]')?.textContent?.trim() || '';

      // Extract posted date
      const postedDateElement = document.querySelector('.posted-time-ago__text, .time-ago, [data-test-id="job-details-posted-date"]');
      const postedDate = postedDateElement?.textContent?.trim() || '';

      return {
        title,
        company,
        location,
        url,
        description,
        salary,
        jobType: employmentType,
        experienceLevel: seniorityLevel,
        companySize,
        postedDate,
        source: 'linkedin',
        dateFound: new Date().toISOString(),
        isSponsored: false,
        sponsorshipType: '',
        skills: [],
        requirements: [],
        benefits: [],
        qualifications: [],
        remoteWork: location.toLowerCase().includes('remote'),
        industry: '',
        applicationDeadline: ''
      };
    } catch (error) {
      console.error('LinkedIn extraction failed:', error);
      return null;
    }
  }

  private static extractFromIndeed(document: Document, url: string): Partial<EnhancedJobData> | null {
    try {
      const title = document.querySelector('#jobTitleTextContainer, h1, .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
      const company = document.querySelector('[data-testid="inlineHeader-companyName"], .companyName')?.textContent?.trim() || '';
      const location = document.querySelector('[data-testid="job-location"], .jobLocation')?.textContent?.trim() || '';
      const description = document.querySelector('#jobDescriptionText, .job-snippet')?.innerHTML || '';
      const salary = SalaryExtractor.extract(document.querySelector('.salary-snippet-container, .job-salary')?.textContent || '');

      return {
        title,
        company,
        location,
        url,
        description,
        salary,
        source: 'indeed',
        dateFound: new Date().toISOString(),
        isSponsored: false,
        sponsorshipType: '',
        skills: [],
        requirements: [],
        benefits: [],
        qualifications: [],
        remoteWork: location.toLowerCase().includes('remote'),
        industry: '',
        jobType: '',
        experienceLevel: '',
        companySize: '',
        postedDate: '',
        applicationDeadline: ''
      };
    } catch (error) {
      console.error('Indeed extraction failed:', error);
      return null;
    }
  }

  private static extractFromGeneric(document: Document, url: string): Partial<EnhancedJobData> | null {
    try {
      // Generic extraction using common selectors
      const title = document.querySelector('h1, .job-title, [class*="title"]')?.textContent?.trim() || '';
      const company = document.querySelector('[class*="company"], .company-name, [data-testid*="company"]')?.textContent?.trim() || '';
      const location = document.querySelector('[class*="location"], .job-location, [data-testid*="location"]')?.textContent?.trim() || '';
      const description = document.querySelector('[class*="description"], .job-description, [id*="description"]')?.innerHTML || '';
      const salary = SalaryExtractor.extract(document.querySelector('[class*="salary"], .job-salary')?.textContent || '');

      return {
        title,
        company,
        location,
        url,
        description,
        salary,
        source: 'generic',
        dateFound: new Date().toISOString(),
        isSponsored: false,
        sponsorshipType: '',
        skills: [],
        requirements: [],
        benefits: [],
        qualifications: [],
        remoteWork: location.toLowerCase().includes('remote'),
        industry: '',
        jobType: '',
        experienceLevel: '',
        companySize: '',
        postedDate: '',
        applicationDeadline: ''
      };
    } catch (error) {
      console.error('Generic extraction failed:', error);
      return null;
    }
  }

  private static enhanceJobData(baseData: Partial<EnhancedJobData>, document: Document): EnhancedJobData | null {
    if (!baseData.title) return null;

    // Normalize job title
    const { normalized, seniority, keywords } = JobTitleNormalizer.normalizeTitle(baseData.title);

    // Extract additional information from description
    const description = baseData.description || '';
    const skills = this.extractSkills(description);
    const requirements = this.extractRequirements(description);
    const benefits = this.extractBenefits(description);
    const qualifications = this.extractQualifications(description);

    // Determine location type
    const locationType = this.determineLocationType(baseData.location || '');

    // Determine employment type
    const employmentType = this.determineEmploymentType(description, baseData.jobType || '');

    // Extract department
    const department = this.extractDepartment(normalized, description);

    return {
      ...baseData,
      title: baseData.title,
      company: baseData.company || '',
      location: baseData.location || '',
      url: baseData.url || '',
      description,
      salary: baseData.salary || null,
      skills,
      requirements,
      benefits,
      qualifications,
      normalizedTitle: normalized,
      extractedKeywords: keywords,
      socMatchConfidence: 0,
      matchedSocTitles: [],
      department,
      seniority,
      employmentType,
      locationType,
      jobType: baseData.jobType || '',
      experienceLevel: baseData.experienceLevel || seniority,
      companySize: baseData.companySize || '',
      industry: baseData.industry || '',
      postedDate: baseData.postedDate || '',
      applicationDeadline: baseData.applicationDeadline || '',
      isSponsored: baseData.isSponsored || false,
      sponsorshipType: baseData.sponsorshipType || '',
      dateFound: baseData.dateFound || new Date().toISOString(),
      source: baseData.source || 'unknown'
    } as EnhancedJobData;
  }

  // Enhanced extraction methods
  private static extractSkills(description: string): string[] {
    const skillPatterns = [
      /(?:skills?|technologies?|stack|required|experienced in|proficient in|knowledge of)[\s:]*([^.]+)/gi,
      /(?:using|with|experience with)[\s:]*([^.]+)/gi
    ];

    const skills = new Set<string>();
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'react', 'angular', 'vue',
      'node.js', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp', 'docker',
      'kubernetes', 'git', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'graphql',
      'rest api', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform'
    ];

    for (const pattern of skillPatterns) {
      const matches = [...description.matchAll(pattern)];
      for (const match of matches) {
        const text = match[1].toLowerCase();
        for (const skill of commonSkills) {
          if (text.includes(skill)) {
            skills.add(skill);
          }
        }
      }
    }

    return Array.from(skills);
  }

  private static extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const reqPattern = /(?:requirements?|qualifications?|essential|must have|needed)[\s:]*([^.]*(?:\.[^.]*){0,2})/gi;
    const matches = [...description.matchAll(reqPattern)];
    
    for (const match of matches) {
      const text = match[1].trim();
      if (text.length > 10) {
        requirements.push(text);
      }
    }

    return requirements.slice(0, 5); // Limit to top 5
  }

  private static extractBenefits(description: string): string[] {
    const benefits: string[] = [];
    const benefitPattern = /(?:benefits?|perks?|offer|package|includes?)[\s:]*([^.]*(?:\.[^.]*){0,2})/gi;
    const matches = [...description.matchAll(benefitPattern)];
    
    for (const match of matches) {
      const text = match[1].trim();
      if (text.length > 10) {
        benefits.push(text);
      }
    }

    return benefits.slice(0, 5); // Limit to top 5
  }

  private static extractQualifications(description: string): string[] {
    const qualifications: string[] = [];
    const qualPattern = /(?:degree|bachelor|master|phd|mba|qualification|certified)[^.]*/gi;
    const matches = [...description.matchAll(qualPattern)];
    
    for (const match of matches) {
      const text = match[0].trim();
      if (text.length > 5) {
        qualifications.push(text);
      }
    }

    return qualifications.slice(0, 3); // Limit to top 3
  }

  private static determineLocationType(location: string): string {
    const loc = location.toLowerCase();
    if (loc.includes('remote')) return 'remote';
    if (loc.includes('hybrid')) return 'hybrid';
    if (loc.includes('onsite') || loc.includes('office')) return 'onsite';
    return 'onsite';
  }

  private static determineEmploymentType(description: string, jobType: string): string {
    const text = (description + ' ' + jobType).toLowerCase();
    if (text.includes('contract') || text.includes('contractor')) return 'contract';
    if (text.includes('permanent') || text.includes('full-time')) return 'permanent';
    if (text.includes('temporary') || text.includes('temp')) return 'temporary';
    if (text.includes('internship') || text.includes('intern')) return 'internship';
    if (text.includes('part-time')) return 'part-time';
    return 'full-time';
  }

  private static extractDepartment(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    const departments = {
      'engineering': ['software', 'developer', 'engineer', 'technical', 'devops', 'backend', 'frontend'],
      'product': ['product manager', 'product owner', 'product design'],
      'design': ['designer', 'ux', 'ui', 'creative', 'visual'],
      'marketing': ['marketing', 'brand', 'digital marketing', 'content'],
      'sales': ['sales', 'business development', 'account manager', 'revenue'],
      'hr': ['human resources', 'hr', 'recruiter', 'talent', 'people'],
      'finance': ['finance', 'accounting', 'financial', 'controller'],
      'operations': ['operations', 'ops', 'process', 'logistics'],
      'data': ['data', 'analytics', 'business intelligence', 'data science'],
      'customer': ['customer service', 'customer success', 'support']
    };

    for (const [dept, keywords] of Object.entries(departments)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return dept;
      }
    }

    return 'general';
  }

  // Enhanced SOC code matching with fuzzy matching
  static async matchToSocCode(jobData: EnhancedJobData, socCodes: any[]): Promise<SocCodeMatch | null> {
    const title = jobData.normalizedTitle;
    const description = jobData.description;
    const keywords = jobData.extractedKeywords;

    let bestMatch: SocCodeMatch | null = null;
    let bestScore = 0;

    for (const soc of socCodes) {
      let score = 0;
      const matchedKeywords: string[] = [];

      // Exact title match (highest weight)
      const titleSimilarity = FuzzyMatcher.similarity(title, soc.jobType.toLowerCase());
      if (titleSimilarity > 0.7) {
        score += titleSimilarity * 0.5;
        matchedKeywords.push(soc.jobType);
      }

      // Related titles match
      for (const relatedTitle of soc.relatedTitles || []) {
        const relatedSimilarity = FuzzyMatcher.similarity(title, relatedTitle.toLowerCase());
        if (relatedSimilarity > 0.6) {
          score += relatedSimilarity * 0.4;
          matchedKeywords.push(relatedTitle);
        }
      }

      // Word overlap with description
      const descriptionOverlap = FuzzyMatcher.wordOverlap(title + ' ' + description, soc.jobType);
      if (descriptionOverlap > 0.3) {
        score += descriptionOverlap * 0.2;
      }

      // Keyword matching
      for (const keyword of keywords) {
        if (soc.jobType.toLowerCase().includes(keyword) || 
            soc.relatedTitles?.some((title: string) => title.toLowerCase().includes(keyword))) {
          score += 0.1;
          matchedKeywords.push(keyword);
        }
      }

      // Department matching
      if (soc.jobType.toLowerCase().includes(jobData.department)) {
        score += 0.15;
      }

      // Seniority level bonus
      if (soc.jobType.toLowerCase().includes(jobData.seniority)) {
        score += 0.1;
      }

      if (score > bestScore && score > 0.3) { // Minimum threshold
        bestScore = score;
        bestMatch = {
          code: soc.code,
          title: soc.jobType,
          confidence: Math.min(score, 1.0),
          matchedKeywords: [...new Set(matchedKeywords)],
          relatedTitles: soc.relatedTitles || [],
          eligibility: soc.eligibility || 'Unknown'
        };
      }
    }

    return bestMatch;
  }
}

export default EnhancedJobParser;
