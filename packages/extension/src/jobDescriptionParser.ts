// Enhanced job description parser for UK job sites (2025)
export interface JobDescriptionData {
  fullDescription: string;
  keyRequirements: string[];
  essentialCriteria: string[];
  desirableCriteria: string[];
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
  } | null;
  jobType: string;
  experienceLevel: string;
  qualifications: string[];
  skills: string[];
  benefits: string[];
  remoteWork: boolean;
  location: string;
  company: string;
  socCode?: string;
  occupationTitle?: string;
  visaSponsorship: {
    mentioned: boolean;
    type?: string;
    requirements?: string[];
  };
}

export class UKJobDescriptionParser {
  // UK-specific job site patterns
  private static readonly UK_SITE_PATTERNS = {
    linkedin: {
      hostname: ['linkedin.com'],
      descriptionSelectors: [
        'div.show-more-less-html__markup',
        '.jobs-description__content',
        '.jobs-unified-top-card__description',
        '.job-description-container',
        '[data-test-id="job-details-description"]'
      ]
    },
    indeed: {
      hostname: ['indeed.co.uk', 'indeed.com'],
      descriptionSelectors: [
        '#jobDescriptionText',
        '.job-snippet',
        '#jobDescription',
        '[data-testid="jobsearch-JobComponent-description"]'
      ]
    },
    reed: {
      hostname: ['reed.co.uk'],
      descriptionSelectors: [
        '.description',
        '.job-description',
        '[data-testid="job-description"]'
      ]
    },
    totaljobs: {
      hostname: ['totaljobs.com'],
      descriptionSelectors: [
        '.job-description',
        '.description-text',
        '[data-automation="jobDescription"]'
      ]
    },
    cvlibrary: {
      hostname: ['cvlibrary.co.uk'],
      descriptionSelectors: [
        '.job-description',
        '.description',
        '[data-testid="job-description"]'
      ]
    },
    glassdoor: {
      hostname: ['glassdoor.co.uk', 'glassdoor.com'],
      descriptionSelectors: [
        '.jobDescription',
        '.description',
        '[data-test="job-description"]'
      ]
    }
  };

  // SOC code patterns for UK occupations
  private static readonly SOC_PATTERNS = [
    // SOC 2020 patterns
    { code: '1111', keywords: ['chief executive', 'managing director', 'president', 'ceo'], title: 'Senior Officials and Legislators' },
    { code: '1120', keywords: ['business manager', 'operations manager', 'general manager'], title: 'Production Managers and Directors in Manufacturing' },
    { code: '1131', keywords: ['finance manager', 'financial controller', 'cfo'], title: 'Financial Managers and Directors' },
    { code: '1132', keywords: ['hr manager', 'personnel manager', 'human resources'], title: 'Human Resource Managers and Directors' },
    { code: '1150', keywords: ['it manager', 'technology manager', 'information systems'], title: 'Information Technology and Telecommunications Directors' },

    // Software Development
    { code: '2136', keywords: ['software developer', 'programmer', 'software engineer', 'full stack'], title: 'Programmers and Software Development Professionals' },
    { code: '2135', keywords: ['web developer', 'front-end developer', 'back-end developer'], title: 'Web Design and Development Professionals' },
    { code: '2137', keywords: ['data analyst', 'data scientist', 'business analyst'], title: 'Data Analysts' },
    { code: '2139', keywords: ['systems analyst', 'business systems analyst'], title: 'Systems Analysts' },

    // Marketing & Digital
    { code: '3543', keywords: ['marketing manager', 'digital marketing', 'brand manager'], title: 'Marketing Associate Professionals' },
    { code: '2473', keywords: ['graphic designer', 'ux designer', 'ui designer'], title: 'Artists' },

    // Healthcare
    { code: '2211', keywords: ['doctor', 'physician', 'gp', 'general practitioner'], title: 'Medical Practitioners' },
    { code: '2212', keywords: ['nurse', 'registered nurse', 'staff nurse'], title: 'Nurses' },
    { code: '2213', keywords: ['pharmacist', 'clinical pharmacist'], title: 'Pharmacists' },
    { code: '2214', keywords: ['psychologist', 'clinical psychologist'], title: 'Psychologists' },

    // Engineering
    { code: '2122', keywords: ['civil engineer', 'structural engineer'], title: 'Engineering Professionals' },
    { code: '2123', keywords: ['mechanical engineer', 'maintenance engineer'], title: 'Engineering Professionals (not civil)' },
    { code: '2126', keywords: ['electrical engineer', 'electronics engineer'], title: 'IT and Telecommunications Professionals' },

    // Education
    { code: '2315', keywords: ['teacher', 'lecturer', 'professor'], title: 'Teaching and Other Educational Professionals' },
    { code: '2320', keywords: ['teaching assistant', 'learning support'], title: 'Teaching Assistants' },

    // Finance
    { code: '4131', keywords: ['accountant', 'chartered accountant', 'cpa'], title: 'Bookkeepers, Payroll Managers and Wages Clerks' },
    { code: '2431', keywords: ['accountant', 'financial accountant'], title: 'Accountants' },
    { code: '4132', keywords: ['credit controller', 'debt collector'], title: 'Credit Controllers' },
    { code: '4133', keywords: ['financial adviser', 'ifa'], title: 'Financial and Accounting Technicians' },

    // Customer Service
    { code: '4111', keywords: ['call centre', 'customer service', 'help desk'], title: 'Customer Service Occupations' },
    { code: '4121', keywords: ['receptionist', 'switchboard operator'], title: 'Receptionists' },

    // Sales
    { code: '3533', keywords: ['sales executive', 'sales representative', 'account manager'], title: 'Sales Representatives' },
    { code: '3534', keywords: ['sales manager', 'business development'], title: 'Sales Managers and Directors' },

    // Construction
    { code: '5311', keywords: ['bricklayer', 'mason', 'builder'], title: 'Bricklayers, Masons and Related Workers' },
    { code: '5312', keywords: ['carpenter', 'joiner', 'woodworker'], title: 'Carpenters and Joiners' },
    { code: '5313', keywords: ['plasterer', 'dry liner'], title: 'Construction Trades' },

    // Hospitality
    { code: '5434', keywords: ['chef', 'cook', 'kitchen porter'], title: 'Chefs' },
    { code: '9234', keywords: ['waiter', 'waitress', 'server', 'barista'], title: 'Waiters and Waitresses' },
    { code: '9235', keywords: ['bar staff', 'bartender', 'barman'], title: 'Bar Staff' }
  ];

  // Visa sponsorship keywords for UK context
  private static readonly VISA_SPONSORSHIP_PATTERNS = {
    positive: [
      'visa sponsorship available',
      'can sponsor visa',
      'visa support provided',
      'licensed sponsor',
      'certificate of sponsorship',
      'tier 2 sponsorship',
      'skilled worker visa',
      'global talent visa',
      'we can sponsor',
      'sponsorship licence',
      'right to work sponsorship',
      'immigration sponsorship',
      'work permit sponsorship',
      'skilled worker license'
    ],
    negative: [
      'no sponsorship',
      'cannot sponsor',
      'must have right to work',
      'must be eligible to work',
      'no visa sponsorship',
      'candidates must have existing right',
      'no relocation package',
      'local candidates only',
      'must be based in uk',
      'uk residents only',
      'no visa support',
      ' sponsorship not available'
    ]
  };

  static detectJobSite(): string {
    const hostname = window.location.hostname.toLowerCase();

    for (const [siteName, siteData] of Object.entries(this.UK_SITE_PATTERNS)) {
      if (siteData.hostname.some(host => hostname.includes(host))) {
        return siteName;
      }
    }

    return 'unknown';
  }

  static extractJobDescription(element?: Element): string {
    const siteName = this.detectJobSite();
    const sitePatterns = this.UK_SITE_PATTERNS[siteName as keyof typeof this.UK_SITE_PATTERNS];

    if (!sitePatterns) {
      return this.extractGenericDescription(element);
    }

    // Try site-specific selectors first
    for (const selector of sitePatterns.descriptionSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = this.cleanDescriptionText(element.textContent || '');
          if (text.length > 100) { // Ensure meaningful content
            return text;
          }
        }
      } catch (error) {
        console.warn(`Failed to extract description with selector: ${selector}`, error);
      }
    }

    // Fallback to generic extraction
    return this.extractGenericDescription(element);
  }

  private static extractGenericDescription(element?: Element): string {
    const fallbackSelectors = [
      '[data-testid*="description"]',
      '[class*="description"]',
      '[class*="job-details"]',
      '[id*="description"]',
      '[class*="job-content"]',
      '[data-test*="description"]'
    ];

    // If a specific element is provided, check it first
    if (element) {
      const text = this.cleanDescriptionText(element.textContent || '');
      if (text.length > 100) {
        return text;
      }
    }

    // Try generic selectors
    for (const selector of fallbackSelectors) {
      try {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements) {
          const text = this.cleanDescriptionText(el.textContent || "");
          if (text.length > 100) {
            return text;
          }
        }
      } catch (error) {
        console.warn(`Failed to extract description with selector: ${selector}`, error);
      }
    }

    // Last resort: look for longest text content in page
    return this.findLongestMeaningfulText();
  }

  private static findLongestMeaningfulText(): string {
    const allElements = Array.from(document.querySelectorAll('*'));
    let longestText = '';

    for (const element of allElements) {
      const text = this.cleanDescriptionText(element.textContent || '');
      if (text.length > longestText.length && text.length > 100) {
        // Check if it's likely a job description (avoid navigation, headers, etc.)
        const tagName = element.tagName.toLowerCase();
        const className = element.className.toLowerCase();

        if (!this.isNonDescriptionElement(tagName, className)) {
          longestText = text;
        }
      }
    }

    return longestText;
  }

  private static isNonDescriptionElement(tagName: string, className: string): boolean {
    const excludeTags = ['script', 'style', 'nav', 'header', 'footer', 'aside'];
    const excludeClasses = ['navigation', 'header', 'footer', 'sidebar', 'menu', 'nav'];

    return excludeTags.includes(tagName) ||
           excludeClasses.some(excludeClass => className.includes(excludeClass));
  }

  private static cleanDescriptionText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/Show more|Show less|Read more|Read less/gi, '')
      .replace(/Apply now|Apply today/gi, '')
      .trim();
  }

  static parseJobDescription(description: string, title?: string, company?: string): JobDescriptionData {
    const cleanedDescription = description.toLowerCase();
    const processedDescription = this.cleanDescriptionText(description);

    return {
      fullDescription: processedDescription,
      keyRequirements: this.extractRequirements(cleanedDescription),
      essentialCriteria: this.extractEssentialCriteria(cleanedDescription),
      desirableCriteria: this.extractDesirableCriteria(cleanedDescription),
      salary: this.extractSalary(cleanedDescription),
      jobType: this.extractJobType(cleanedDescription),
      experienceLevel: this.extractExperienceLevel(cleanedDescription),
      qualifications: this.extractQualifications(cleanedDescription),
      skills: this.extractSkills(cleanedDescription),
      benefits: this.extractBenefits(cleanedDescription),
      remoteWork: this.detectRemoteWork(cleanedDescription),
      location: this.extractLocation(cleanedDescription),
      company: company || '',
      socCode: this.detectSOCCode(cleanedDescription, title),
      occupationTitle: this.getOccupationTitle(cleanedDescription, title),
      visaSponsorship: this.analyzeVisaSponsorship(cleanedDescription)
    };
  }

  private static extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const sentences = description.split(/[.!?]+/);

    // Look for requirement patterns
    const requirementPatterns = [
      /required[:\s]*(.+?)(?=\.|and|or|$)/gi,
      /must have[:\s]*(.+?)(?=\.|and|or|$)/gi,
      /essential[:\s]*(.+?)(?=\.|and|or|$)/gi,
      /experience with[:\s]*(.+?)(?=\.|and|or|$)/gi,
      /knowledge of[:\s]*(.+?)(?=\.|and|or|$)/gi,
      /\d+\s*\+?\s*years? of experience/i,
      /bachelor'?s degree/i,
      /master'?s degree/i,
      /phd/i
    ];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        for (const pattern of requirementPatterns) {
          const match = trimmed.match(pattern);
          if (match) {
            requirements.push(match[1] || trimmed);
            break;
          }
        }
      }
    }

    return requirements.slice(0, 8); // Limit to top 8 requirements
  }

  private static extractEssentialCriteria(description: string): string[] {
    const essential: string[] = [];
    const sentences = description.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (
        trimmed.includes('essential') ||
        trimmed.includes('must have') ||
        trimmed.includes('required') ||
        trimmed.includes('non-negotiable')
      ) {
        if (trimmed.length > 10 && trimmed.length < 200) {
          essential.push(trimmed);
        }
      }
    }

    return essential.slice(0, 5);
  }

  private static extractDesirableCriteria(description: string): string[] {
    const desirable: string[] = [];
    const sentences = description.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (
        trimmed.includes('desirable') ||
        trimmed.includes('nice to have') ||
        trimmed.includes('preferred') ||
        trimmed.includes('advantageous') ||
        trimmed.includes('bonus')
      ) {
        if (trimmed.length > 10 && trimmed.length < 200) {
          desirable.push(trimmed);
        }
      }
    }

    return desirable.slice(0, 5);
  }

  private static extractSalary(description: string): JobDescriptionData['salary'] {
    const salaryPatterns = [
      // UK salary patterns
      /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?\s*(?:per\s+)?(annum|year|annual|pa|hour|day|week|month)/i,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?\s*(?:per\s+)?(annum|year|annual|pa|hour|day|week|month)\s*GBP/i,
      /GBP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*GBP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?/i,
      // International patterns that might appear on UK sites
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?\s*(?:per\s+)?(annum|year|annual|hour|day|week|month)/i,
      /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?\s*(?:per\s+)?(annum|year|annual|hour|day|week|month)/i
    ];

    for (const pattern of salaryPatterns) {
      const match = description.match(pattern);
      if (match) {
        const min = match[1] ? parseFloat(match[1].replace(/,/g, '')) : undefined;
        const max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : min;
        const period = match[3] || match[4] || 'annum';

        return {
          min,
          max,
          currency: '£', // Default to GBP for UK sites
          period: period.toLowerCase().replace(/annual|annum/gi, 'year')
        };
      }
    }

    return null;
  }

  private static extractJobType(description: string): string {
    const jobTypePatterns = [
      { pattern: /full[-\s]?time|permanent|direct hire/i, type: 'Full-time' },
      { pattern: /part[-\s]?time/i, type: 'Part-time' },
      { pattern: /contract|temporary|interim/i, type: 'Contract' },
      { pattern: /freelance|consultant/i, type: 'Freelance' },
      { pattern: /internship|placement/i, type: 'Internship' },
      { pattern: /zero[-\s]?hours|zero hour/i, type: 'Zero Hours' },
      { pattern: /apprenticeship/i, type: 'Apprenticeship' }
    ];

    for (const { pattern, type } of jobTypePatterns) {
      if (pattern.test(description)) {
        return type;
      }
    }

    return 'Not specified';
  }

  private static extractExperienceLevel(description: string): string {
    const experiencePatterns = [
      { pattern: /entry[-\s]?level|junior|trainee|graduate|no experience|0[-\s]?1[-\s]?year/i, level: 'Entry Level' },
      { pattern: /mid[-\s]?level|intermediate|2[-\s]?3[-\s]?years?|3[-\s]?5[-\s]?years?/i, level: 'Mid Level' },
      { pattern: /senior|5[-\s]?plus|7[-\s]?plus|8[-\s]?plus|10[-\s]?plus/i, level: 'Senior Level' },
      { pattern: /lead|principal|head of|director/i, level: 'Lead/Management' }
    ];

    for (const { pattern, level } of experiencePatterns) {
      if (pattern.test(description)) {
        return level;
      }
    }

    return 'Not specified';
  }

  private static extractQualifications(description: string): string[] {
    const qualifications: string[] = [];
    const qualificationPatterns = [
      /phd|doctorate|doctor of philosophy/i,
      /master'?s degree|ma|m\.?a\.|mba|m\.?s\.|msc/i,
      /bachelor'?s degree|ba|b\.?a\.|bsc|b\.?s\.|undergraduate/i,
      /hnd|higher national diploma/i,
      /a[-\s]?levels?|advanced levels?/i,
      /gcse|general certificate of secondary education/i,
      /nvq|national vocational qualification/i,
      /cim|chartered institute of marketing/i,
      /cima|chartered institute of management accountants/i,
      /acca|association of chartered certified accountants/i,
      /cips|chartered institute of purchasing and supply/i,
      /cii|chartered insurance institute/i
    ];

    for (const pattern of qualificationPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        qualifications.push(matches[0]);
      }
    }

    return [...new Set(qualifications)]; // Remove duplicates
  }

  private static extractSkills(description: string): string[] {
    // Common UK tech and professional skills
    const ukSkillKeywords = [
      // Technical Skills
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust',
      'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring', '.net', 'laravel',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
      'sql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'nosql',
      'git', 'agile', 'scrum', 'kanban', 'jira', 'confluence',

      // Business Skills
      'project management', 'stakeholder management', 'business analysis',
      'financial analysis', 'budget management', 'risk management', 'compliance',
      'marketing strategy', 'digital marketing', 'seo', 'sem', 'ppc',
      'sales', 'business development', 'account management', 'crm',

      // Professional Qualifications
      'prince2', 'pmp', 'agile', 'scrum master', 'itil', 'iso 9001',

      // UK-specific
      'fca compliance', 'fca regulated', 'solicitor', 'barrister', 'accountancy', 'chartered',
      'cisi', 'cfa', 'cima', 'acca', 'cimi', 'cilt'
    ];

    const skills: string[] = [];

    // Direct skill matching
    for (const skill of ukSkillKeywords) {
      if (description.toLowerCase().includes(skill)) {
        skills.push(skill);
      }
    }

    // Extract multi-word skills
    const multiWordSkills = [
      'project management', 'business analysis', 'risk management',
      'financial analysis', 'data analysis', 'machine learning',
      'artificial intelligence', 'web development', 'software development',
      'quality assurance', 'user experience', 'user interface',
      'digital marketing', 'social media', 'content marketing',
      'customer relationship management', 'supply chain management'
    ];

    for (const skill of multiWordSkills) {
      if (description.toLowerCase().includes(skill)) {
        skills.push(skill);
      }
    }

    return [...new Set(skills)].slice(0, 20); // Limit to top 20 skills
  }

  private static extractBenefits(description: string): string[] {
    const benefits: string[] = [];
    const benefitPatterns = [
      /private medical insurance|private healthcare|health insurance/i,
      /pension scheme|company pension|workplace pension/i,
      /bonus|performance bonus|annual bonus/i,
      /holiday|annual leave|vacation|pto/i,
      /flexible working|remote working|work from home|hybrid/i,
      /training and development|professional development|learning budget/i,
      /gym membership|fitness allowance|wellness/i,
      /company car|car allowance|travel expenses/i,
      /stock options|share options|equity/i,
      /life assurance|critical illness/i,
      /cycle to work scheme|bike scheme/i,
      /childcare vouchers|nursery support/i
    ];

    for (const pattern of benefitPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        benefits.push(matches[0]);
      }
    }

    return [...new Set(benefits)];
  }

  private static detectRemoteWork(description: string): boolean {
    const remoteKeywords = [
      'remote', 'work from home', 'wfh', 'home working', 'hybrid',
      'flexible working', 'telecommute', 'virtual', 'distributed team'
    ];

    return remoteKeywords.some(keyword => description.includes(keyword));
  }

  private static extractLocation(description: string): string {
    // UK cities and regions that might be mentioned in descriptions
    const ukLocations = [
      'london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'sheffield',
      'bradford', 'liverpool', 'edinburgh', 'bristol', 'cardiff', 'belfast',
      'leicester', 'coventry', 'hull', 'newcastle', 'nottingham', 'plymouth',
      'stoke-on-trent', 'wolverhampton', 'derby', 'southampton', 'portsmouth',
      'brighton', 'reading', 'northampton', 'milton keynes', 'luton'
    ];

    const words = description.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (ukLocations.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    }

    return 'Not specified';
  }

  private static detectSOCCode(description: string, title?: string): string | undefined {
    const combinedText = `${title || ''} ${description}`.toLowerCase();

    // Score each SOC pattern
    let bestMatch: { code: string; score: number } | undefined;

    for (const soc of this.SOC_PATTERNS) {
      let score = 0;

      // Check title match (highest weight)
      if (title) {
        for (const keyword of soc.keywords) {
          if (title.toLowerCase().includes(keyword)) {
            score += 10;
          }
        }
      }

      // Check description match
      for (const keyword of soc.keywords) {
        const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { code: soc.code, score };
      }
    }

    return bestMatch && bestMatch.score > 3 ? bestMatch.code : undefined;
  }

  private static getOccupationTitle(description: string, title?: string): string | undefined {
    const socCode = this.detectSOCCode(description, title);
    if (socCode) {
      const soc = this.SOC_PATTERNS.find(s => s.code === socCode);
      return soc?.title;
    }
    return undefined;
  }

  private static analyzeVisaSponsorship(description: string): JobDescriptionData['visaSponsorship'] {
    const sponsorship = {
      mentioned: false,
      type: undefined as string | undefined,
      requirements: undefined as string[] | undefined
    };

    // Check for positive sponsorship indicators
    for (const pattern of this.VISA_SPONSORSHIP_PATTERNS.positive) {
      if (description.includes(pattern)) {
        sponsorship.mentioned = true;
        sponsorship.type = this.extractVisaType(description, pattern);
        break;
      }
    }

    // Check for negative indicators
    for (const pattern of this.VISA_SPONSORSHIP_PATTERNS.negative) {
      if (description.includes(pattern)) {
        sponsorship.mentioned = true;
        sponsorship.type = 'Not Available';
        break;
      }
    }

    // Extract specific requirements if sponsorship is mentioned
    if (sponsorship.mentioned && sponsorship.type !== 'Not Available') {
      sponsorship.requirements = this.extractVisaRequirements(description);
    }

    return sponsorship;
  }

  private static extractVisaType(description: string, matchedPattern: string): string {
    if (matchedPattern.includes('skilled worker')) return 'Skilled Worker';
    if (matchedPattern.includes('global talent')) return 'Global Talent';
    if (matchedPattern.includes('tier 2')) return 'Tier 2';
    if (matchedPattern.includes('certificate of sponsorship')) return 'Certificate of Sponsorship';
    return 'Available';
  }

  private static extractVisaRequirements(description: string): string[] {
    const requirements: string[] = [];
    const requirementPatterns = [
      /must have(?:.*?)(?:visa|work permit)(?:.*?)(?:valid|current)/i,
      /(?:candidate|applicant)(?:.*?)(?:must|should)(?:.*?)(?:be eligible|have right)(?:.*?)(?:work|live)/i,
      /(?:eligible for|requirements include)(?:.*?)(?:work visa|skilled worker)/i
    ];

    for (const pattern of requirementPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        requirements.push(matches[0]);
      }
    }

    return requirements.slice(0, 3);
  }
}