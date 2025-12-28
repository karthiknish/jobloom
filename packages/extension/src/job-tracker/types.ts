import { Job, type JobData } from "@hireall/shared";
export type { JobData };

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
