import { ResumeData } from "@/types/resume";

type KeywordMap = Record<string, string[]>;

const ROLE_KEYWORDS: KeywordMap = {
  "software engineer": [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "APIs",
    "SQL",
    "Git",
    "Agile",
    "Unit Testing",
  ],
  "frontend developer": [
    "React",
    "TypeScript",
    "Next.js",
    "CSS",
    "Tailwind",
    "Accessibility",
    "Design Systems",
    "Performance Optimization",
    "Testing",
    "JavaScript",
  ],
  "backend engineer": [
    "Node.js",
    "TypeScript",
    "Databases",
    "API Design",
    "Microservices",
    "Testing",
    "CI/CD",
    "Cloud",
    "Security",
    "Scalability",
  ],
  "data scientist": [
    "Python",
    "Machine Learning",
    "Statistics",
    "SQL",
    "Pandas",
    "TensorFlow",
    "Data Visualization",
    "Modeling",
    "Experimentation",
    "Feature Engineering",
  ],
  "product manager": [
    "Product Strategy",
    "Roadmap",
    "User Research",
    "Analytics",
    "Stakeholder Management",
    "Prioritization",
    "Go-To-Market",
    "KPIs",
    "Agile",
    "Cross-functional",
  ],
  "marketing": [
    "SEO",
    "SEM",
    "Content Strategy",
    "Campaigns",
    "Analytics",
    "Lead Generation",
    "Email Marketing",
    "Brand",
    "Conversions",
    "Social Media",
  ],
  "sales": [
    "Pipeline",
    "CRM",
    "Quota",
    "Prospecting",
    "Negotiation",
    "Closing",
    "Revenue",
    "Account Management",
    "Forecasting",
    "Relationship Building",
  ],
  "designer": [
    "Figma",
    "Prototyping",
    "User Research",
    "UX",
    "UI",
    "Interaction Design",
    "Typography",
    "Accessibility",
    "Design Systems",
    "Visual Design",
  ],
  default: [
    "Leadership",
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Project Management",
    "Strategic Planning",
    "Stakeholder Management",
    "Results-Oriented",
    "Collaboration",
    "Adaptability",
  ],
};

const INDUSTRY_KEYWORDS: KeywordMap = {
  technology: [
    "Software Development",
    "Cloud",
    "DevOps",
    "API",
    "Agile",
    "Scalability",
    "Innovation",
    "Security",
    "Product Development",
    "Automation",
  ],
  finance: [
    "Financial Analysis",
    "Risk Management",
    "Compliance",
    "Budgeting",
    "Forecasting",
    "Portfolio",
    "Investment",
    "Audit",
    "Regulatory",
    "Accounting",
  ],
  healthcare: [
    "Clinical",
    "Patient Care",
    "HIPAA",
    "Medical Records",
    "Healthcare Management",
    "Treatment",
    "Diagnosis",
    "Quality Improvement",
    "Compliance",
    "Health Systems",
  ],
  marketing: [
    "Digital Marketing",
    "Campaigns",
    "Brand",
    "Audience",
    "Conversion",
    "Content",
    "Analytics",
    "Performance Marketing",
    "Demand Generation",
    "ROI",
  ],
  sales: [
    "Pipeline",
    "Revenue",
    "Territory",
    "Prospecting",
    "Closing",
    "Negotiation",
    "Lead Generation",
    "Account Management",
    "Retention",
    "Customer Success",
  ],
  education: [
    "Curriculum",
    "Instruction",
    "Assessment",
    "Student Engagement",
    "Learning Outcomes",
    "Instructional Design",
    "Professional Development",
    "Classroom Management",
    "Educational Technology",
    "Mentoring",
  ],
  consulting: [
    "Strategy",
    "Stakeholder",
    "Process Improvement",
    "Change Management",
    "Client",
    "Analysis",
    "Implementation",
    "Business Case",
    "Workshops",
    "Deliverables",
  ],
  default: [
    "Professional Experience",
    "Industry Knowledge",
    "Leadership",
    "Communication",
    "Problem Solving",
    "Team Collaboration",
    "Project Delivery",
    "Best Practices",
    "Continuous Improvement",
    "Stakeholders",
  ],
};

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  summary: [/(summary|objective|profile|about)\b/i],
  experience: [/(experience|employment|work history|professional experience)\b/i],
  education: [/(education|degree|university|college|academic)\b/i],
  skills: [/(skills|competencies|technical skills|expertise)\b/i],
  contact: [/(contact|email|phone|linkedin)\b/i],
};

const LINKEDIN_PATTERN = /linkedin\.com\/(in|company)\//i;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const LOCATION_PATTERN = /\b([A-Z][a-z]+\s?)+(city|town|state|country|,\s?[A-Z]{2})\b/;
const METRIC_PATTERN = /\b(\d+%|\$\d+[kKmM]?|\d+\s?(customers?|clients?|users?|projects?|deals?|revenue|growth|roi))\b/gi;

export interface AtsEvaluationBreakdown {
  structure: number;
  contact: number;
  keywords: number;
  formatting: number;
  readability: number;
  extras: number;
}

export interface AtsEvaluation {
  score: number;
  breakdown: AtsEvaluationBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordDensity: number;
  missingSections: string[];
  issues: string[];
  suggestions: string[];
}

export interface EvaluateTextOptions {
  text: string;
  targetRole?: string | null;
  industry?: string | null;
  fileType?: string | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeKey = (value: string | null | undefined, map: KeywordMap): string => {
  if (!value) return "default";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "default";
  if (map[normalized]) return normalized;
  const match = Object.keys(map).find((key) =>
    key !== "default" && normalized.includes(key)
  );
  return match || "default";
};

const getKeywordsFor = (value: string | null | undefined, map: KeywordMap) => {
  const key = normalizeKey(value, map);
  return map[key] ?? map.default;
};

export const getRoleKeywordSet = (value?: string | null) =>
  getKeywordsFor(value, ROLE_KEYWORDS);

export const getIndustryKeywordSet = (value?: string | null) =>
  getKeywordsFor(value, INDUSTRY_KEYWORDS);

const tokenizeWords = (text: string): string[] => {
  return (text.match(/\b[\p{L}0-9\+#\.\-]+\b/gu) || []).map((word) =>
    word.toLowerCase()
  );
};

export function evaluateAtsCompatibilityFromText({
  text,
  targetRole,
  industry,
  fileType,
}: EvaluateTextOptions): AtsEvaluation {
  const safeText = text || "";
  const lowerText = safeText.toLowerCase();
  const words = tokenizeWords(safeText);
  const wordCount = words.length || 1;
  const sentences = safeText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : wordCount;

  const roleKeywords = getKeywordsFor(targetRole, ROLE_KEYWORDS);
  const industryKeywords = getKeywordsFor(industry, INDUSTRY_KEYWORDS);
  const combinedKeywords = Array.from(
    new Set([...roleKeywords, ...industryKeywords].map((k) => k.trim()))
  ).filter(Boolean);

  const matchedKeywords = combinedKeywords.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
  const missingKeywords = combinedKeywords.filter(
    (keyword) => !lowerText.includes(keyword.toLowerCase())
  );

  const keywordOccurrences = matchedKeywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi");
    const matches = safeText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  const keywordDensity = Number(((keywordOccurrences / wordCount) * 100).toFixed(2));

  let structureScore = 0;
  const missingSections: string[] = [];
  Object.entries(SECTION_PATTERNS).forEach(([section, patterns]) => {
    const found = patterns.some((pattern) => pattern.test(safeText));
    if (found) {
      structureScore += 5;
    } else {
      missingSections.push(section);
    }
  });
  structureScore = clamp(structureScore, 0, 25);

  let contactScore = 0;
  const issues: string[] = [];
  if (EMAIL_PATTERN.test(safeText)) {
    contactScore += 7;
  } else {
    issues.push("Add a professional email address to your header.");
  }

  if (PHONE_PATTERN.test(safeText)) {
    contactScore += 5;
  } else {
    issues.push("Include a phone number in an ATS-friendly format (e.g., 123-456-7890).");
  }

  if (LOCATION_PATTERN.test(safeText)) {
    contactScore += 3;
  } else {
    issues.push("Mention your location or preferred location to help recruiters filter candidates.");
  }

  if (LINKEDIN_PATTERN.test(lowerText) || /portfolio|github|behance/i.test(safeText)) {
    contactScore += 5;
  } else {
    issues.push("Add a LinkedIn profile or professional portfolio link.");
  }
  contactScore = clamp(contactScore, 0, 20);

  let formattingScore = 15;
  const tableIndicators = (safeText.match(/[|]/g) || []).length + (safeText.match(/\t/g) || []).length;
  if (tableIndicators > 10) {
    formattingScore -= 7;
    issues.push("Tables or tabbed layouts can break in ATS parsing. Use simple bullet lists instead.");
  } else if (tableIndicators > 0) {
    formattingScore -= 4;
  }

  const excessiveSpacing = /\s{4,}/.test(safeText);
  if (excessiveSpacing) {
    formattingScore -= 3;
    issues.push("Large spacing or multi-column layouts may not parse correctly in ATS.");
  }

  const bulletSymbols = (safeText.match(/[•◦▪■]/g) || []).length;
  if (bulletSymbols > 100) {
    formattingScore -= 2;
  }

  const specialCharRatio =
    (safeText.replace(/[\p{L}0-9\s.,;:'"()\-]/gu, "").length / safeText.length) || 0;
  if (specialCharRatio > 0.25) {
    formattingScore -= 3;
    issues.push("Reduce heavy use of special characters; they can confuse ATS parsers.");
  }
  formattingScore = clamp(formattingScore, 0, 15);

  let readabilityScore = 10;
  if (wordCount < 200) {
    readabilityScore -= 4;
    issues.push("Your resume looks brief. Expand experience details with impact statements.");
  } else if (wordCount > 1500) {
    readabilityScore -= 3;
    issues.push("Consider trimming content to keep the resume concise for recruiters.");
  }

  if (avgSentenceLength > 30) {
    readabilityScore -= 3;
    issues.push("Long sentences decrease readability. Break them into short action-driven bullet points.");
  } else if (avgSentenceLength >= 12 && avgSentenceLength <= 25) {
    readabilityScore += 1;
  }
  readabilityScore = clamp(readabilityScore, 0, 10);

  let extrasScore = 5;
  if (METRIC_PATTERN.test(safeText)) {
    extrasScore += 2;
  } else {
    issues.push("Add quantifiable metrics (%, $, #) to highlight achievements.");
  }

  if (fileType && /pdf/i.test(fileType)) {
    extrasScore += 1;
  }

  if (/\b(resume|curriculum vitae|cv)\b/i.test(safeText)) {
    extrasScore += 1;
  }
  extrasScore = clamp(extrasScore, 0, 15);

  const keywordCoverage = combinedKeywords.length
    ? (matchedKeywords.length / combinedKeywords.length) * 100
    : 0;

  const keywordScore = clamp((keywordCoverage / 100) * 25, 0, 25);
  if (keywordCoverage < 40) {
    issues.push("Incorporate more role-specific and industry keywords naturally throughout the resume.");
  }

  const breakdown: AtsEvaluationBreakdown = {
    structure: structureScore,
    contact: contactScore,
    keywords: keywordScore,
    formatting: formattingScore,
    readability: readabilityScore,
    extras: extrasScore,
  };

  const score = clamp(
    Math.round(
      breakdown.structure +
        breakdown.contact +
        breakdown.keywords +
        breakdown.formatting +
        breakdown.readability +
        breakdown.extras
    ),
    0,
    100
  );

  const suggestions: string[] = [];

  if (missingSections.length) {
    suggestions.push(
      `Add or strengthen these sections: ${missingSections
        .map((section) => section.charAt(0).toUpperCase() + section.slice(1))
        .join(", ")}.`
    );
  }

  if (missingKeywords.length) {
    suggestions.push(
      `We couldn't find ${missingKeywords
        .slice(0, 6)
        .join(", ")}. Integrate them where relevant to boost keyword matching.`
    );
  }

  if (!LINKEDIN_PATTERN.test(lowerText) && !/portfolio|github|behance/i.test(safeText)) {
    suggestions.push("Add a LinkedIn or professional portfolio link in the contact section.");
  }

  if (!METRIC_PATTERN.test(safeText)) {
    suggestions.push("Quantify achievements (e.g., grew revenue by 30%, managed 5-member team).");
  }

  if (tableIndicators > 0 || excessiveSpacing) {
    suggestions.push("Use a single-column layout with simple bullet lists for ATS safety.");
  }

  if (keywordCoverage < 60) {
    suggestions.push("Tailor your resume to the target role by mirroring terminology from job descriptions.");
  }

  const uniqueIssues = Array.from(new Set(issues));
  const uniqueSuggestions = Array.from(new Set(suggestions));

  return {
    score,
    breakdown,
    matchedKeywords,
    missingKeywords,
    missingSections,
    keywordDensity,
    issues: uniqueIssues,
    suggestions: uniqueSuggestions,
  };
}

export function evaluateAtsCompatibilityFromResume(
  resume: ResumeData,
  options?: { targetRole?: string | null; industry?: string | null }
): AtsEvaluation {
  const textChunks: string[] = [];

  textChunks.push(
    [
      resume.personalInfo.fullName,
      resume.personalInfo.summary,
      resume.personalInfo.location,
      resume.personalInfo.email,
      resume.personalInfo.phone,
      resume.personalInfo.linkedin,
      resume.personalInfo.github,
      resume.personalInfo.website,
    ]
      .filter(Boolean)
      .join("\n")
  );

  resume.experience.forEach((exp) => {
    textChunks.push(
      [
        exp.position,
        exp.company,
        exp.location,
        exp.startDate,
        exp.endDate,
        exp.current ? "Present" : "",
        exp.description,
        ...exp.achievements,
      ]
        .filter(Boolean)
        .join("\n")
    );
  });

  resume.education.forEach((edu) => {
    textChunks.push(
      [edu.institution, edu.degree, edu.field, edu.graduationDate]
        .filter(Boolean)
        .join("\n")
    );
  });

  resume.skills.forEach((skillGroup) => {
    textChunks.push(skillGroup.skills.join(", "));
  });

  resume.projects.forEach((project) => {
    textChunks.push(
      [
        project.name,
        project.description,
        project.technologies.join(", "),
        project.link,
        project.github,
      ]
        .filter(Boolean)
        .join("\n")
    );
  });

  resume.certifications?.forEach((cert) => {
    textChunks.push(
      [cert.name, cert.issuer, cert.date, cert.credentialId]
        .filter(Boolean)
        .join("\n")
    );
  });

  resume.languages?.forEach((lang) => {
    textChunks.push(`${lang.language} - ${lang.proficiency}`);
  });

  const resumeText = textChunks.filter(Boolean).join("\n\n");

  return evaluateAtsCompatibilityFromText({
    text: resumeText,
    targetRole: options?.targetRole ?? null,
    industry: options?.industry ?? null,
  });
}
