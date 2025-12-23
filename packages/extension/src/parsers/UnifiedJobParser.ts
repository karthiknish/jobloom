/**
 * UnifiedJobParser - Consolidated job parsing for the HireAll extension
 * 
 * This parser consolidates functionality from:
 * - EnhancedJobParser: LinkedIn/Indeed extraction, fuzzy matching for SOC codes
 * - UKJobDescriptionParser: UK-specific patterns, visa sponsorship analysis
 * 
 * Provides a single source of truth for job data extraction with:
 * - Multi-site support (LinkedIn, Indeed, Reed, Glassdoor, etc.)
 * - UK-specific feature extraction (visa sponsorship, SOC codes)
 * - Server-side SOC matching with client fallback
 */

import { post } from '../apiClient';
import { fetchSponsorRecord } from '../sponsorship/lookup';
import { isLikelyPlaceholderCompany, normalizeCompanyName } from '../utils/companyName';
import { normalizeJobUrl, extractJobIdentifier } from '../utils/urlNormalizer';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type JobSite = 'linkedin' | 'indeed' | 'reed' | 'totaljobs' | 'cvlibrary' | 'glassdoor' | 'generic' | 'unknown';

export interface SalaryInfo {
  min?: number;
  max?: number;
  currency: string;
  period: string;
  original: string;
}

export interface VisaSponsorshipInfo {
  mentioned: boolean;
  available: boolean;
  type?: string;
  requirements?: string[];
}

export interface SocCodeMatch {
  code: string;
  title: string;
  confidence: number;
  matchedKeywords: string[];
  relatedTitles: string[];
  eligibility: string;
}

export interface JobData {
  // Core fields
  title: string;
  company: string;
  location: string;
  url: string;
  normalizedUrl: string;
  jobIdentifier: string;
  description: string;
  
  // Structured data
  salary: SalaryInfo | null;
  skills: string[];
  requirements: string[];
  benefits: string[];
  qualifications: string[];
  
  // Job classification
  jobType: string;
  experienceLevel: string;
  seniority: string;
  department: string;
  employmentType: string;
  locationType: string;
  remoteWork: boolean;
  
  // Company info
  companySize: string;
  industry: string;
  
  // Dates
  postedDate: string;
  applicationDeadline: string;
  dateFound: string;
  
  // UK-specific
  isSponsored: boolean;
  sponsorshipType: string;
  visaSponsorship: VisaSponsorshipInfo;
  socCode?: string;
  socMatch?: SocCodeMatch;
  
  // Metadata
  source: JobSite;
  normalizedTitle: string;
  extractedKeywords: string[];
}

// ============================================================================
// Site Configuration
// ============================================================================

const SITE_PATTERNS: Record<JobSite, { hostnames: string[]; selectors: Record<string, string[]> }> = {
  linkedin: {
    hostnames: ['linkedin.com'],
    selectors: {
      title: [
        // Job detail page (2024/2025)
        '.job-details-jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title-link',
        'h1.top-card-layout__title',
        '.jobs-unified-top-card__job-title',
        'h1.t-24',
        // Job cards in list view (2024/2025)
        '.job-card-list__title',
        '.job-card-list__title--link',
        '.artdeco-entity-lockup__title',
        '.artdeco-entity-lockup__title a',
        '.job-card-container__link span',
        '.job-card-container__link',
        'a[data-control-name="job_card_title"]',
      ],
      company: [
        // Job detail page (new design 2024/2025)
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__primary-description-container a',
        // Job detail page (legacy)
        '.topcard__org-name-link',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        // Job cards in list view (2024/2025)
        '.job-card-container__company-name',
        '.job-card-container__primary-description',
        '.artdeco-entity-lockup__subtitle',
        '.artdeco-entity-lockup__subtitle span',
        '.job-card-list__subtitle span',
        '.job-card-list__entity-lockup .artdeco-entity-lockup__subtitle',
        // Search results
        '.entity-result__secondary-subtitle',
        '.job-card-search__company-name',
        // Legacy
        '.job-card-list__company',
        '.jobs-company-name',
      ],
      location: [
        // Job detail page
        '.job-details-jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
        '.topcard__flavor--bullet',
        '.jobs-unified-top-card__bullet',
        // Job cards
        '.job-card-container__metadata-item',
        '.artdeco-entity-lockup__caption',
        '.job-card-list__metadata-item',
        '.job-card-list__location',
      ],
      description: [
        '.jobs-description__content',
        '.jobs-description-content__text',
        '#job-details',
        'div.show-more-less-html__markup',
      ],
      salary: [
        '.job-details-jobs-unified-top-card__job-insight--highlight',
        '.job-details-jobs-unified-top-card__job-insight span',
        '.compensation__salary',
        '.jobs-unified-top-card__salary-info',
      ],
    },
  },
  indeed: {
    hostnames: ['indeed.com', 'indeed.co.uk'],
    selectors: {
      title: [
        'h1[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1.jobsearch-JobInfoHeader-title',
        '[data-testid="simpleHeader-title"]',
        '.jobsearch-JobInfoHeader-title-container h1',
        'h1.icl-u-xs-mb--xs',
        'h1',
      ],
      company: [
        '[data-testid="inlineHeader-companyName"]',
        '[data-testid="simpleHeader-companyName"]',
        '.jobsearch-InlineCompanyRating-companyHeader a',
        '.jobsearch-CompanyInfoContainer a',
        '.companyName',
        '[data-company-name="true"]',
      ],
      location: [
        '[data-testid="job-location"]',
        '[data-testid="inlineHeader-companyLocation"]',
        '.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)',
        '.companyLocation',
      ],
      description: [
        '#jobDescriptionText',
        '[data-testid="jobDescriptionText"]',
        '.jobsearch-JobComponent-description',
        '.jobsearch-jobDescriptionText',
      ],
      salary: [
        '#salaryInfoAndJobType',
        '[data-testid="attribute_snippet_testid"]',
        '.jobsearch-JobMetadataHeader-item',
        '.salary-snippet-container',
      ],
    },
  },
  reed: {
    hostnames: ['reed.co.uk'],
    selectors: {
      title: ['h1', '.job-header__title'],
      company: ['.company-name', '.job-header__company a'],
      location: ['.location', '.job-header__location'],
      description: ['.description', '.job-description', '[data-testid="job-description"]'],
      salary: ['.salary', '.job-header__salary'],
    },
  },
  totaljobs: {
    hostnames: ['totaljobs.com'],
    selectors: {
      title: ['h1', '.job-title'],
      company: ['.company', '.company-link'],
      location: ['.location'],
      description: ['.job-description', '.description-text', '[data-automation="jobDescription"]'],
      salary: ['.salary'],
    },
  },
  cvlibrary: {
    hostnames: ['cv-library.co.uk'],
    selectors: {
      title: ['h1.title'],
      company: ['.company'],
      location: ['.location'],
      description: ['.job-description'],
      salary: ['.salary'],
    },
  },
  glassdoor: {
    hostnames: ['glassdoor.com', 'glassdoor.co.uk'],
    selectors: {
      title: ['[data-test="job-title"]', '.JobDetails_jobTitle__'],
      company: ['[data-test="employer-name"]', '.JobDetails_jobDetailsHeader__'],
      location: ['[data-test="location"]', '.JobDetails_location__'],
      description: ['[class*="JobDetails_jobDescription"]', '.jobDescriptionContent'],
      salary: ['[data-test="salary-estimate"]'],
    },
  },
  generic: {
    hostnames: [],
    selectors: {
      title: ['h1', '.job-title', '[class*="title"]'],
      company: ['[class*="company"]', '.company-name'],
      location: ['[class*="location"]', '.job-location'],
      description: ['[class*="description"]', '.job-description', '[id*="description"]'],
      salary: ['[class*="salary"]', '.job-salary'],
    },
  },
  unknown: {
    hostnames: [],
    selectors: {
      title: [],
      company: [],
      location: [],
      description: [],
      salary: [],
    },
  },
};

// ============================================================================
// Utility Classes
// ============================================================================

class FuzzyMatcher {
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
      }
    }
    return matrix[str2.length][str1.length];
  }

  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  static extractWords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their']);
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  }

  static wordOverlap(text1: string, text2: string): number {
    const words1 = new Set(this.extractWords(text1));
    const words2 = new Set(this.extractWords(text2));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

class TitleNormalizer {
  private static readonly VARIATIONS: Record<string, string[]> = {
    'software engineer': ['software developer', 'software eng', 'sde', 'developer', 'programmer'],
    'senior software engineer': ['senior software developer', 'senior sde', 'lead developer', 'principal engineer'],
    'product manager': ['pm', 'product owner', 'product lead'],
    'data scientist': ['data analyst', 'data engineer', 'research scientist'],
    'ux designer': ['ui designer', 'user experience designer', 'product designer'],
    'devops engineer': ['devops', 'site reliability engineer', 'sre', 'platform engineer'],
  };

  private static readonly SENIORITY: Record<string, string[]> = {
    'junior': ['jr', 'entry level', 'graduate', 'trainee'],
    'mid-level': ['mid', 'intermediate', 'experienced'],
    'senior': ['sr', 'lead', 'principal', 'head', 'staff'],
    'manager': ['manager', 'head of'],
    'director': ['director', 'vp', 'vice president'],
    'executive': ['ceo', 'cto', 'cfo', 'chief', 'executive'],
  };

  static normalize(title: string): { normalized: string; seniority: string; keywords: string[] } {
    const lowerTitle = title.toLowerCase();
    let seniority = 'mid-level';
    for (const [level, variations] of Object.entries(this.SENIORITY)) {
      if (variations.some(v => lowerTitle.includes(v))) { seniority = level; break; }
    }
    let normalized = lowerTitle;
    for (const [standard, variations] of Object.entries(this.VARIATIONS)) {
      for (const variation of variations) {
        if (lowerTitle.includes(variation)) { normalized = lowerTitle.replace(variation, standard); break; }
      }
    }
    return { normalized: normalized.trim(), seniority, keywords: FuzzyMatcher.extractWords(normalized) };
  }
}

class SalaryExtractor {
  private static readonly PATTERNS = [
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[-–]\s*£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    /£?(\d{1,3})k\s*[-–]\s*£?(\d{1,3})k/gi,
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|p\.?)\s*(?:annum|year|yr)/gi,
    /£?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|p\.?)\s*hour/gi,
  ];

  static extract(text: string): SalaryInfo | null {
    for (const pattern of this.PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const min = parseFloat(match[1].replace(/,/g, ''));
        const max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : min;
        let period = 'year';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('hour') || lowerText.includes('hr')) period = 'hour';
        else if (lowerText.includes('day')) period = 'day';
        else if (lowerText.includes('month')) period = 'month';
        const needsMultiplier = match[0].includes('k');
        return {
          min: needsMultiplier ? min * 1000 : min,
          max: needsMultiplier ? max * 1000 : max,
          currency: 'GBP',
          period,
          original: match[0],
        };
      }
    }
    return null;
  }
}

// ============================================================================
// Visa Sponsorship Patterns (UK-specific)
// ============================================================================

const VISA_PATTERNS = {
  positive: [
    'visa sponsorship available', 'can sponsor visa', 'visa support provided', 'licensed sponsor',
    'certificate of sponsorship', 'tier 2 sponsorship', 'skilled worker visa', 'global talent visa',
    'we can sponsor', 'sponsorship licence', 'sponsorship offered', 'relocation support',
  ],
  negative: [
    'no sponsorship', 'cannot sponsor', 'must have right to work', 'must be eligible to work',
    'no visa sponsorship', 'not able to sponsor', 'uk residents only', 'no relocation',
    'requires existing right to work', 'must hold valid work permit',
  ],
};

// ============================================================================
// Main Parser Class
// ============================================================================

export class UnifiedJobParser {
  /**
   * Detect which job site the current page belongs to
   */
  static detectJobSite(url: string): JobSite {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      for (const [site, config] of Object.entries(SITE_PATTERNS) as [JobSite, typeof SITE_PATTERNS[JobSite]][]) {
        if (config.hostnames.some(h => hostname.includes(h))) return site;
      }
    } catch {}
    return 'unknown';
  }

  /**
   * Check if the URL is a supported job site
   */
  static isSupportedSite(url: string): boolean {
    const site = this.detectJobSite(url);
    return site === 'linkedin' || site === 'indeed';
  }

  /**
   * Main extraction method - extracts job data from the current page
   */
  static async extractJobFromPage(document: Document, url: string): Promise<JobData | null> {
    const site = this.detectJobSite(url);
    if (!this.isSupportedSite(url)) {
      console.warn('HireAll: Job extraction only supports LinkedIn and Indeed. Current site:', site);
      return null;
    }

    // Try LD+JSON first (most reliable)
    const ldJsonData = this.extractLdJsonData(document);
    
    // Extract using site-specific selectors
    const siteConfig = SITE_PATTERNS[site];
    const rawData = {
      title: ldJsonData?.title || this.querySelector(document, siteConfig.selectors.title) || '',
      company: ldJsonData?.company || this.querySelector(document, siteConfig.selectors.company) || '',
      location: ldJsonData?.location || this.querySelector(document, siteConfig.selectors.location) || '',
      description: ldJsonData?.description || this.querySelectorHtml(document, siteConfig.selectors.description) || '',
      salaryText: this.querySelector(document, siteConfig.selectors.salary) || '',
    };

    if (!rawData.title) return null;

    // Process and enhance the data
    return this.enhanceJobData(rawData, url, site, document);
  }

  /**
   * Extract job data from a specific element (e.g. a job card)
   */
  static async extractJobFromElement(element: Element, url: string): Promise<JobData | null> {
    const site = this.detectJobSite(url);
    if (!this.isSupportedSite(url)) {
      console.warn('HireAll: Job extraction only supports LinkedIn and Indeed. Current site:', site);
      return null;
    }

    // Extract using site-specific selectors scoped to the element
    const siteConfig = SITE_PATTERNS[site];
    const rawData = {
      title: this.querySelectorFromElement(element, siteConfig.selectors.title) || '',
      company: this.querySelectorFromElement(element, siteConfig.selectors.company) || '',
      location: this.querySelectorFromElement(element, siteConfig.selectors.location) || '',
      description: this.querySelectorHtmlFromElement(element, siteConfig.selectors.description) || '',
      salaryText: this.querySelectorFromElement(element, siteConfig.selectors.salary) || '',
    };

    if (!rawData.title) return null;

    // Use a minimal document context for enhancement
    return this.enhanceJobData(rawData, url, site, document);
  }

  /**
   * Extract job data from LD+JSON structured data
   */
  private static extractLdJsonData(document: Document): Partial<JobData> | null {
    try {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const content = script.textContent;
        if (!content) continue;
        const data = JSON.parse(content);
        const jobPosting = data['@type'] === 'JobPosting' ? data : data['@graph']?.find((item: any) => item['@type'] === 'JobPosting');
        if (jobPosting) {
          return {
            title: jobPosting.title || '',
            company: jobPosting.hiringOrganization?.name || '',
            location: jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.address?.addressRegion || '',
            description: jobPosting.description || '',
            salary: jobPosting.baseSalary ? {
              min: jobPosting.baseSalary.value?.minValue,
              max: jobPosting.baseSalary.value?.maxValue,
              currency: jobPosting.baseSalary.currency || 'GBP',
              period: 'year',
              original: '',
            } : null,
            jobType: jobPosting.employmentType || '',
            postedDate: jobPosting.datePosted || '',
            applicationDeadline: jobPosting.validThrough || '',
            remoteWork: jobPosting.jobLocationType === 'TELECOMMUTE',
          };
        }
      }
    } catch {}
    return null;
  }

  /**
   * Enhance raw extracted data with normalized fields and UK-specific features
   */
  private static async enhanceJobData(
    rawData: { title: string; company: string; location: string; description: string; salaryText: string },
    url: string,
    site: JobSite,
    document: Document
  ): Promise<JobData> {
    const { normalized, seniority, keywords } = TitleNormalizer.normalize(rawData.title);
    const salary = SalaryExtractor.extract(rawData.salaryText) || SalaryExtractor.extract(rawData.description);
    const visaSponsorship = this.analyzeVisaSponsorship(rawData.description);
    
    // Normalize company name
    const normalizedCompany = normalizeCompanyName(rawData.company);
    const company = isLikelyPlaceholderCompany(normalizedCompany) ? '' : normalizedCompany;

    // Check sponsorship from official register
    let isSponsored = visaSponsorship.available;
    let sponsorshipType = visaSponsorship.type || '';
    if (company) {
      try {
        const sponsorRecord = await fetchSponsorRecord(company);
        if (sponsorRecord?.eligibleForSponsorship) {
          isSponsored = true;
          sponsorshipType = sponsorshipType || sponsorRecord.sponsorshipType || 'Licensed Sponsor';
        }
      } catch {}
    }

    const now = new Date().toISOString();

    return {
      title: rawData.title.trim(),
      company,
      location: rawData.location.trim(),
      url: url.trim(),
      normalizedUrl: normalizeJobUrl(url),
      jobIdentifier: extractJobIdentifier(url),
      description: rawData.description,
      salary,
      skills: this.extractSkills(rawData.description),
      requirements: this.extractRequirements(rawData.description),
      benefits: this.extractBenefits(rawData.description),
      qualifications: this.extractQualifications(rawData.description),
      jobType: this.extractJobType(rawData.description),
      experienceLevel: this.extractExperienceLevel(rawData.description),
      seniority,
      department: this.extractDepartment(normalized, rawData.description),
      employmentType: this.extractEmploymentType(rawData.description),
      locationType: this.extractLocationType(rawData.location),
      remoteWork: this.detectRemoteWork(rawData.location, rawData.description),
      companySize: '',
      industry: '',
      postedDate: '',
      applicationDeadline: '',
      dateFound: now,
      isSponsored,
      sponsorshipType,
      visaSponsorship,
      source: site,
      normalizedTitle: normalized,
      extractedKeywords: keywords,
    };
  }

  /**
   * Analyze job description for visa sponsorship mentions (UK-specific)
   */
  static analyzeVisaSponsorship(description: string): VisaSponsorshipInfo {
    const lowerDesc = description.toLowerCase();
    
    for (const pattern of VISA_PATTERNS.negative) {
      if (lowerDesc.includes(pattern)) {
        return { mentioned: true, available: false, type: 'Not Available' };
      }
    }
    
    for (const pattern of VISA_PATTERNS.positive) {
      if (lowerDesc.includes(pattern)) {
        let type = 'Available';
        if (pattern.includes('skilled worker')) type = 'Skilled Worker';
        else if (pattern.includes('global talent')) type = 'Global Talent';
        else if (pattern.includes('tier 2')) type = 'Tier 2';
        return { mentioned: true, available: true, type };
      }
    }

    return { mentioned: false, available: false };
  }

  /**
   * Match job to SOC codes using server-side endpoint
   */
  static async matchToSocCode(jobData: JobData): Promise<SocCodeMatch | null> {
    try {
      const response = await post<{ success: boolean; match: SocCodeMatch | null }>('/api/soc-codes/match', {
        title: jobData.title,
        description: jobData.description,
        keywords: jobData.extractedKeywords,
        department: jobData.department,
        seniority: jobData.seniority,
      }, true);
      return response?.success ? response.match : null;
    } catch (error) {
      console.warn('HireAll: SOC matching failed:', error);
      return null;
    }
  }

  // ============================================================================
  // Extraction Helper Methods
  // ============================================================================

  private static querySelector(document: Document, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) return el.textContent.trim();
      } catch {}
    }
    return '';
  }

  private static querySelectorHtml(document: Document, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el?.innerHTML) return el.innerHTML;
      } catch {}
    }
    return '';
  }

  private static querySelectorFromElement(element: Element, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = element.querySelector(selector);
        if (el?.textContent?.trim()) return el.textContent.trim();
      } catch {}
    }
    return '';
  }

  private static querySelectorHtmlFromElement(element: Element, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = element.querySelector(selector);
        if (el?.innerHTML) return el.innerHTML;
      } catch {}
    }
    return '';
  }

  private static extractSkills(description: string): string[] {
    const skills = new Set<string>();
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'react', 'angular', 'vue',
      'node.js', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp', 'docker',
      'kubernetes', 'git', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'graphql',
      'rest api', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform',
    ];
    const lowerDesc = description.toLowerCase();
    for (const skill of skillKeywords) {
      if (lowerDesc.includes(skill)) skills.add(skill);
    }
    return Array.from(skills);
  }

  private static extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const patterns = [/required[:\s]*([^.]+)/gi, /must have[:\s]*([^.]+)/gi, /essential[:\s]*([^.]+)/gi];
    for (const pattern of patterns) {
      const matches = [...description.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]?.trim().length > 10) requirements.push(match[1].trim());
      }
    }
    return requirements.slice(0, 5);
  }

  private static extractBenefits(description: string): string[] {
    const benefits: string[] = [];
    const lowerDesc = description.toLowerCase();
    const benefitKeywords = [
      'private medical', 'pension', 'bonus', 'holiday', 'flexible working', 'remote', 'hybrid',
      'training', 'gym', 'car allowance', 'stock options', 'life assurance', 'cycle to work',
    ];
    for (const keyword of benefitKeywords) {
      if (lowerDesc.includes(keyword)) benefits.push(keyword);
    }
    return benefits;
  }

  private static extractQualifications(description: string): string[] {
    const qualifications: string[] = [];
    const patterns = [/phd|doctorate/gi, /master'?s degree|mba|msc/gi, /bachelor'?s degree|bsc/gi];
    for (const pattern of patterns) {
      const matches = description.match(pattern);
      if (matches) qualifications.push(matches[0]);
    }
    return [...new Set(qualifications)];
  }

  private static extractJobType(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (/full[-\s]?time|permanent/.test(lowerDesc)) return 'Full-time';
    if (/part[-\s]?time/.test(lowerDesc)) return 'Part-time';
    if (/contract|temporary/.test(lowerDesc)) return 'Contract';
    if (/internship/.test(lowerDesc)) return 'Internship';
    return '';
  }

  private static extractExperienceLevel(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (/entry[-\s]?level|junior|graduate/.test(lowerDesc)) return 'Entry Level';
    if (/mid[-\s]?level|2[-\s]?3[-\s]?years?|3[-\s]?5[-\s]?years?/.test(lowerDesc)) return 'Mid Level';
    if (/senior|5\+\s*years?|lead|principal/.test(lowerDesc)) return 'Senior';
    return '';
  }

  private static extractDepartment(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    const departments: Record<string, string[]> = {
      'engineering': ['software', 'developer', 'engineer', 'technical', 'devops'],
      'product': ['product manager', 'product owner'],
      'design': ['designer', 'ux', 'ui', 'creative'],
      'marketing': ['marketing', 'brand', 'digital marketing'],
      'sales': ['sales', 'business development', 'account manager'],
      'data': ['data', 'analytics', 'machine learning'],
    };
    for (const [dept, keywords] of Object.entries(departments)) {
      if (keywords.some(k => text.includes(k))) return dept;
    }
    return 'general';
  }

  private static extractEmploymentType(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('contract')) return 'contract';
    if (lowerDesc.includes('permanent') || lowerDesc.includes('full-time')) return 'permanent';
    if (lowerDesc.includes('temporary')) return 'temporary';
    return 'full-time';
  }

  private static extractLocationType(location: string): string {
    const lowerLoc = location.toLowerCase();
    if (lowerLoc.includes('remote')) return 'remote';
    if (lowerLoc.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }

  private static detectRemoteWork(location: string, description: string): boolean {
    const combined = (location + ' ' + description).toLowerCase();
    return ['remote', 'work from home', 'wfh', 'hybrid'].some(k => combined.includes(k));
  }
}

export default UnifiedJobParser;
