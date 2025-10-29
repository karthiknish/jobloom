import type { CoverLetterData, CoverLetterTemplate, CoverLetterTone } from "./types";

const toneStyles: Record<CoverLetterTone, {
  opening: string;
  body: string;
  closing: string;
  signoff: string;
}> = {
  professional: {
    opening: "I am writing to express my strong interest in the",
    body: "My professional background aligns well with",
    closing: "I look forward to discussing how my qualifications can benefit",
    signoff: "Sincerely",
  },
  enthusiastic: {
    opening: "I'm thrilled to apply for the",
    body: "I'm excited about the opportunity to bring my",
    closing: "I can't wait to discuss how my passion and skills can contribute to",
    signoff: "Best regards",
  },
  formal: {
    opening: "I wish to submit my application for the",
    body: "My qualifications and experience make me an excellent candidate for",
    closing: "I would welcome the opportunity to further discuss my candidacy for",
    signoff: "Yours faithfully",
  },
  casual: {
    opening: "I'd love to apply for the",
    body: "I think my background would be a great fit for",
    closing: "I'm excited to chat more about how I can help with",
    signoff: "Cheers",
  },
};

const templateStyles: Record<CoverLetterTemplate, {
  headerFormat: string;
  paragraphStyle: string;
  includeObjective: boolean;
}> = {
  modern: {
    headerFormat: "clean",
    paragraphStyle: "concise",
    includeObjective: true,
  },
  classic: {
    headerFormat: "traditional",
    paragraphStyle: "formal",
    includeObjective: false,
  },
  creative: {
    headerFormat: "bold",
    paragraphStyle: "storytelling",
    includeObjective: true,
  },
  executive: {
    headerFormat: "prestigious",
    paragraphStyle: "strategic",
    includeObjective: false,
  },
};

export const getToneStyle = (tone: CoverLetterTone) => toneStyles[tone];
export const getTemplateStyle = (template: CoverLetterTemplate) => templateStyles[template];

export const DEFAULT_LETTER_DATA: CoverLetterData = {
  jobTitle: "",
  companyName: "",
  companyLocation: "",
  hiringManager: "Hiring Team",
  jobDescription: "",
  keyRequirements: [""],
  companyValues: [""],
  applicationDate: new Date().toISOString().split("T")[0],
  customOpening: "",
  customBody: "",
  customClosing: "",
  tone: "professional",
  template: "modern",
};
