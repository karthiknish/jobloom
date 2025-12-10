export interface JobData {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  sponsorshipType?: string;
  dateFound: string;
  source: string;
  jobId?: string;
  metadata?: {
    remote: boolean;
    seniority?: string;
    /** Number of applicants for this job */
    applicantCount?: number;
    /** Whether job has LinkedIn Easy Apply */
    easyApply?: boolean;
    /** Remote, Hybrid, or On-site */
    workplaceType?: string;
    /** Company logo URL */
    companyLogo?: string;
    /** Method used for extraction (normal, fallback, empty) */
    extractionMethod?: string;
    /** True if site is not supported */
    unsupportedSite?: boolean;
  };
}

export interface AutofillProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    experience: string;
    education: string;
    skills: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
  };
  preferences: {
    salaryExpectation: string;
    availableStartDate: string;
    workAuthorization: string;
    relocate: boolean;
    coverLetter: string;
  };
}

export interface HighlightableJob {
  element: Element;
  data: JobData;
}

export interface HighlightStyle {
  status: "eligible" | "ineligible" | "neutral";
  message?: string;
  accentColor?: string;
}

export interface HighlightConfig extends HighlightStyle {
  iconName?: string;
  tooltip?: string;
}
