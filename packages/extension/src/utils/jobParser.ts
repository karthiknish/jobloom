import { normalizeCompanyName, isLikelyPlaceholderCompany } from './companyName';
import { fetchSponsorRecord } from '../sponsorship/lookup';

export interface SocCodeMatch {
  code: string;
  title: string;
  confidence: number;
  relatedTitles: string[];
}

export interface JobData {
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
  locationType: string;
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
  socCode?: string;
  occupationTitle?: string;
  likelySocCode?: string;
  socMatchConfidence?: number;
  matchedSocTitles?: string[];
  department: string;
  seniority: string;
  employmentType: string;
  
  visaSponsorship?: {
    mentioned: boolean;
    type?: string;
    requirements?: string[];
  };
}

export class JobParser {
  private static readonly SENIORITY_LEVELS = {
    'junior': ['jr', 'entry level', 'graduate', 'trainee', 'associate'],
    'mid-level': ['mid', 'intermediate', 'experienced'],
    'senior': ['sr', 'lead', 'principal', 'head', 'staff'],
    'manager': ['manager', 'lead', 'head of'],
    'director': ['director', 'vp', 'vice president', 'head of department'],
    'executive': ['ceo', 'cto', 'cfo', 'chief', 'executive', 'president']
  };

  private static readonly VISA_PATTERNS = {
    positive: [
      'visa sponsorship available', 'can sponsor visa', 'visa support provided',
      'licensed sponsor', 'certificate of sponsorship', 'tier 2 sponsorship',
      'skilled worker visa', 'global talent visa', 'we can sponsor',
      'sponsorship licence', 'right to work sponsorship', 'immigration sponsorship',
      'work permit sponsorship', 'skilled worker license', 'health and care worker visa',
      'relocation support', 'sponsorship offered'
    ],
    negative: [
      'no sponsorship', 'cannot sponsor', 'must have right to work',
      'must be eligible to work', 'no visa sponsorship', 'candidates must have existing right',
      'no relocation package', 'local candidates only', 'must be based in uk',
      'uk residents only', 'no visa support', ' sponsorship not available',
      'no sponsorship provided', 'we cannot offer sponsorship',
      'requires existing right to work', 'must hold valid work permit'
    ]
  };

  /**
   * Main entry point for job extraction from a page
   */
  static async extractJobFromPage(document: Document, url: string): Promise<JobData | null> {
    const domain = new URL(url).hostname.toLowerCase();
    let baseData: Partial<JobData> | null = null;

    // 1. Try LD+JSON (most reliable)
    baseData = this.extractLdJson(document);

    // 2. Site-specific DOM extraction if LD+JSON fails or is incomplete
    if (domain.includes('linkedin.com')) {
      baseData = { ...baseData, ...this.extractLinkedIn(document) };
    } else if (domain.includes('indeed.com') || domain.includes('indeed.co.uk')) {
      baseData = { ...baseData, ...this.extractIndeed(document) };
    } else if (domain.includes('reed.co.uk')) {
      baseData = { ...baseData, ...this.extractReed(document) };
    } else {
      baseData = { ...baseData, ...this.extractGeneric(document) };
    }

    if (!baseData || !baseData.title) return null;

    // 3. Enhance and normalize data
    return this.enhanceJobData(baseData, url);
  }

  /**
   * Extract job data from a specific element (e.g. a job card)
   */
  static async extractJobFromElement(element: Element, url: string): Promise<JobData | null> {
    const domain = new URL(url).hostname.toLowerCase();
    let baseData: Partial<JobData> | null = null;

    if (domain.includes('linkedin.com')) {
      baseData = this.extractLinkedIn(element);
    } else if (domain.includes('indeed.com') || domain.includes('indeed.co.uk')) {
      baseData = this.extractIndeed(element);
    } else {
      baseData = this.extractGeneric(element);
    }

    if (!baseData || !baseData.title) return null;

    return this.enhanceJobData(baseData, url);
  }

  private static extractLdJson(document: Document | Element): Partial<JobData> | null {
    try {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const content = script.textContent;
        if (!content) continue;
        const data = JSON.parse(content);
        const job = data['@type'] === 'JobPosting' ? data : data['@graph']?.find((item: any) => item['@type'] === 'JobPosting');

        if (job) {
          return {
            title: job.title || '',
            company: job.hiringOrganization?.name || '',
            location: job.jobLocation?.address?.addressLocality || job.jobLocation?.address?.addressRegion || '',
            description: job.description || '',
            salary: job.baseSalary ? {
              min: job.baseSalary.value?.minValue,
              max: job.baseSalary.value?.maxValue,
              currency: job.baseSalary.currency || 'GBP',
              period: 'year',
              original: ''
            } : null,
            jobType: job.employmentType || '',
            postedDate: job.datePosted || '',
            applicationDeadline: job.validThrough || '',
            remoteWork: job.jobLocationType === 'TELECOMMUTE',
          };
        }
      }
    } catch (e) {
      console.warn('LD+JSON parsing failed', e);
    }
    return null;
  }

  private static extractLinkedIn(document: Document | Element): Partial<JobData> {
    const title = document.querySelector('.job-details-jobs-unified-top-card__job-title, h1.top-card-layout__title')?.textContent?.trim() || '';
    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .topcard__org-name-link')?.textContent?.trim() || '';
    const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet')?.textContent?.trim() || '';
    const description = document.querySelector('.jobs-description__content, #job-details')?.innerHTML || '';
    
    return { title, company, location, description, source: 'linkedin' };
  }

  private static extractIndeed(document: Document | Element): Partial<JobData> {
    const title = document.querySelector('h1[data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
    const company = document.querySelector('[data-testid="inlineHeader-companyName"], .companyName')?.textContent?.trim() || '';
    const location = document.querySelector('[data-testid="job-location"], .companyLocation')?.textContent?.trim() || '';
    const description = document.querySelector('#jobDescriptionText')?.innerHTML || '';
    
    return { title, company, location, description, source: 'indeed' };
  }

  private static extractReed(document: Document | Element): Partial<JobData> {
    const title = document.querySelector('h1')?.textContent?.trim() || '';
    const company = document.querySelector('.posted-by a')?.textContent?.trim() || '';
    const location = document.querySelector('.location span')?.textContent?.trim() || '';
    const description = document.querySelector('.description')?.innerHTML || '';
    
    return { title, company, location, description, source: 'reed' };
  }

  private static extractGeneric(document: Document | Element): Partial<JobData> {
    const title = document.querySelector('h1, .job-title')?.textContent?.trim() || '';
    const company = document.querySelector('.company, .employer')?.textContent?.trim() || '';
    const location = document.querySelector('.location, .city')?.textContent?.trim() || '';
    const description = document.querySelector('.description, #job-details, .job-body')?.innerHTML || '';
    
    return { title, company, location, description, source: 'generic' };
  }

  private static async enhanceJobData(base: Partial<JobData>, url: string): Promise<JobData> {
    const description = base.description || '';
    const title = base.title || '';
    
    // Normalize company
    let company = base.company || '';
    if (company) {
      company = normalizeCompanyName(company);
      if (isLikelyPlaceholderCompany(company)) company = '';
    }

    // Extract Seniority
    let seniority = 'mid-level';
    const lowerTitle = title.toLowerCase();
    for (const [level, variations] of Object.entries(this.SENIORITY_LEVELS)) {
      if (variations.some(v => lowerTitle.includes(v))) {
        seniority = level;
        break;
      }
    }

    // Extract Salary if missing
    let salary = base.salary || this.extractSalary(description);

    // Extract Visa Info
    const visaInfo = this.analyzeVisaSponsorship(description);
    
    // Official Sponsor Check
    let isSponsored = visaInfo?.mentioned && visaInfo?.type !== 'Not Available';
    let sponsorshipType = visaInfo?.type || '';

    if (company && !isSponsored) {
      try {
        const sponsorRecord = await fetchSponsorRecord(company);
        if (sponsorRecord?.eligibleForSponsorship) {
          isSponsored = true;
          sponsorshipType = sponsorRecord.sponsorshipType || 'Licensed Sponsor';
        }
      } catch (e) {
        console.warn('Sponsor lookup failed', e);
      }
    }

    return {
      ...base,
      title,
      company,
      location: base.location || '',
      url,
      description,
      salary,
      jobType: base.jobType || this.extractJobType(description),
      experienceLevel: base.experienceLevel || seniority,
      qualifications: this.extractQualifications(description),
      skills: this.extractSkills(description),
      requirements: this.extractRequirements(description),
      benefits: this.extractBenefits(description),
      remoteWork: base.remoteWork || description.toLowerCase().includes('remote'),
      locationType: description.toLowerCase().includes('remote') ? 'remote' : (description.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite'),
      companySize: base.companySize || '',
      industry: base.industry || '',
      postedDate: base.postedDate || '',
      applicationDeadline: base.applicationDeadline || '',
      isSponsored,
      sponsorshipType,
      dateFound: new Date().toISOString(),
      source: base.source || 'unknown',
      normalizedTitle: title.toLowerCase(),
      occupationTitle: title,
      extractedKeywords: this.extractKeywords(title),
      department: this.extractDepartment(title, description),
      seniority,
      employmentType: base.jobType || 'Full-time',
      visaSponsorship: visaInfo
    } as JobData;
  }

  private static extractSalary(text: string): JobData['salary'] {
    const pattern = /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:to|-|–|—)\s*£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
    const match = text.match(pattern);
    if (match) {
      return {
        min: parseFloat(match[1].replace(/,/g, '')),
        max: parseFloat(match[2].replace(/,/g, '')),
        currency: 'GBP',
        period: 'year',
        original: match[0]
      };
    }
    return null;
  }

  private static extractKeywords(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  }

  private static extractDepartment(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('software') || text.includes('engineer') || text.includes('developer')) return 'Engineering';
    if (text.includes('marketing') || text.includes('brand')) return 'Marketing';
    if (text.includes('sales') || text.includes('account')) return 'Sales';
    if (text.includes('product')) return 'Product';
    if (text.includes('data') || text.includes('analyst')) return 'Data';
    return 'General';
  }

  private static extractJobType(description: string): string {
    const text = description.toLowerCase();
    if (text.includes('part-time')) return 'Part-time';
    if (text.includes('contract')) return 'Contract';
    if (text.includes('intern')) return 'Internship';
    return 'Full-time';
  }

  private static extractSkills(description: string): string[] {
    const common = ['javascript', 'typescript', 'python', 'java', 'react', 'aws', 'sql', 'agile'];
    return common.filter(s => description.toLowerCase().includes(s));
  }

  private static extractRequirements(description: string): string[] {
    return []; // Placeholder
  }

  private static extractBenefits(description: string): string[] {
    return []; // Placeholder
  }

  private static extractQualifications(description: string): string[] {
    return []; // Placeholder
  }

  private static analyzeVisaSponsorship(description: string): JobData['visaSponsorship'] {
    const text = description.toLowerCase();
    for (const p of this.VISA_PATTERNS.positive) {
      if (text.includes(p)) return { mentioned: true, type: 'Available' };
    }
    for (const n of this.VISA_PATTERNS.negative) {
      if (text.includes(n)) return { mentioned: true, type: 'Not Available' };
    }
    return { mentioned: false };
  }
}
