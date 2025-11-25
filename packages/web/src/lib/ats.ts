import { ResumeData } from "@/types/resume";

type KeywordMap = Record<string, string[]>;

const ROLE_KEYWORDS: KeywordMap = {
  "software engineer": [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "AWS",
    "Docker",
    "Kubernetes",
    "APIs",
    "SQL",
    "NoSQL",
    "Git",
    "CI/CD",
    "Agile",
    "Unit Testing",
    "System Design",
    "Algorithms",
    "Data Structures",
  ],
  "frontend developer": [
    "React",
    "Vue",
    "Angular",
    "TypeScript",
    "JavaScript",
    "HTML5",
    "CSS3",
    "Sass",
    "Tailwind CSS",
    "Redux",
    "Next.js",
    "Webpack",
    "Jest",
    "Cypress",
    "Accessibility",
    "Responsive Design",
    "Performance Optimization",
    "Figma",
  ],
  "backend engineer": [
    "Node.js",
    "Python",
    "Java",
    "Go",
    "Ruby",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "GraphQL",
    "REST APIs",
    "Microservices",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "System Design",
    "Security",
    "Scalability",
  ],
  "full stack developer": [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "Python",
    "Django",
    "SQL",
    "NoSQL",
    "AWS",
    "Docker",
    "Git",
    "REST APIs",
    "GraphQL",
    "CI/CD",
    "Agile",
    "Testing",
    "System Architecture",
  ],
  "devops engineer": [
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "Jenkins",
    "GitLab CI",
    "Linux",
    "Bash",
    "Python",
    "Monitoring",
    "Logging",
    "Security",
    "Networking",
    "CloudFormation",
    "Prometheus",
  ],
  "mobile developer": [
    "Swift",
    "Kotlin",
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "Objective-C",
    "Java",
    "Dart",
    "Mobile UI",
    "App Store",
    "Play Store",
    "Firebase",
    "GraphQL",
    "REST APIs",
    "Git",
    "Testing",
  ],
  "data scientist": [
    "Python",
    "R",
    "SQL",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Data Visualization",
    "Tableau",
    "Statistics",
    "Big Data",
    "Spark",
    "Hadoop",
    "NLP",
    "Computer Vision",
  ],
  "product manager": [
    "Product Strategy",
    "Roadmap",
    "User Research",
    "Agile",
    "Scrum",
    "Jira",
    "Data Analysis",
    "A/B Testing",
    "Stakeholder Management",
    "Go-To-Market",
    "KPIs",
    "Prioritization",
    "UX/UI",
    "Technical Writing",
  ],
  "project manager": [
    "Project Planning",
    "Risk Management",
    "Budgeting",
    "Agile",
    "Waterfall",
    "Scrum",
    "Kanban",
    "Jira",
    "Asana",
    "Stakeholder Communication",
    "Resource Allocation",
    "Timeline Management",
    "Scope Management",
    "Leadership",
  ],
  "business analyst": [
    "Requirements Gathering",
    "Data Analysis",
    "SQL",
    "Process Modeling",
    "UML",
    "Visio",
    "Stakeholder Management",
    "User Stories",
    "Agile",
    "Scrum",
    "Business Intelligence",
    "Tableau",
    "Power BI",
    "Excel",
  ],
  "marketing": [
    "SEO",
    "SEM",
    "Content Marketing",
    "Social Media",
    "Google Analytics",
    "Email Marketing",
    "CRM",
    "HubSpot",
    "Copywriting",
    "Brand Strategy",
    "Market Research",
    "PPC",
    "Campaign Management",
    "Growth Hacking",
  ],
  "sales": [
    "CRM",
    "Salesforce",
    "Prospecting",
    "Cold Calling",
    "Lead Generation",
    "Negotiation",
    "Closing",
    "Account Management",
    "B2B Sales",
    "SaaS",
    "Pipeline Management",
    "Presentation Skills",
    "Relationship Building",
  ],
  "designer": [
    "Figma",
    "Sketch",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
    "User Research",
    "Wireframing",
    "Prototyping",
    "Interaction Design",
    "Visual Design",
    "Design Systems",
    "Accessibility",
    "HTML/CSS",
    "User Testing",
  ],
  "hr specialist": [
    "Recruiting",
    "Onboarding",
    "Employee Relations",
    "HRIS",
    "Compliance",
    "Benefits Administration",
    "Talent Acquisition",
    "Performance Management",
    "Training",
    "Labor Laws",
    "Interviewing",
    "Diversity & Inclusion",
  ],
  default: [
    "Leadership",
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Project Management",
    "Strategic Planning",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
    "Collaboration",
    "Creativity",
    "Organization",
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

const ACTION_VERBS = [
  "achieved",
  "accelerated",
  "accomplished",
  "advanced",
  "amplified",
  "attained",
  "boosted",
  "built",
  "capitalized",
  "championed",
  "collaborated",
  "completed",
  "constructed",
  "created",
  "delivered",
  "demonstrated",
  "designed",
  "developed",
  "directed",
  "drove",
  "earned",
  "enhanced",
  "established",
  "exceeded",
  "expanded",
  "expedited",
  "facilitated",
  "formed",
  "generated",
  "guided",
  "headed",
  "implemented",
  "improved",
  "increased",
  "initiated",
  "innovated",
  "integrated",
  "introduced",
  "launched",
  "led",
  "managed",
  "maximized",
  "mentored",
  "modernized",
  "negotiated",
  "optimized",
  "orchestrated",
  "overhauled",
  "pioneered",
  "planned",
  "produced",
  "promoted",
  "propelled",
  "reduced",
  "resolved",
  "revitalized",
  "saved",
  "secured",
  "simplified",
  "spearheaded",
  "standardized",
  "streamlined",
  "strengthened",
  "structured",
  "succeeded",
  "surpassed",
  "transformed",
  "upgraded",
  "utilized",
  "won",
];

const CLICHES = [
  "hard worker",
  "team player",
  "go-getter",
  "synergy",
  "thought leader",
  "out of the box",
  "results-driven",
  "detail-oriented",
  "self-starter",
  "people person",
  "dynamic",
  "motivated",
  "passionate",
  "track record",
  "best of breed",
  "bottom line",
  "cutting edge",
  "guru",
  "ninja",
  "rockstar",
  "strategic thinker",
  "value add",
  "win-win",
];

const LINKEDIN_PATTERN = /linkedin\.com\/(in|company)\//i;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const LOCATION_PATTERN = /\b([A-Z][a-z]+\s?)+(city|town|state|country|,\s?[A-Z]{2})\b/;
const METRIC_PATTERN = /(\b\d+(\.\d+)?%|\b\$\d+(\.\d+)?[kKmM]?\b|\b\d+\s?(customers?|clients?|users?|projects?|deals?|revenue|growth|roi)\b)/gi;

export interface AtsEvaluationBreakdown {
  structure: number;
  contact: number;
  keywords: number;
  formatting: number;
  readability: number;
  extras: number;
  impact: number;
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

  // Structure Score (Max 15)
  let structureScore = 0;
  const missingSections: string[] = [];
  Object.entries(SECTION_PATTERNS).forEach(([section, patterns]) => {
    const found = patterns.some((pattern) => pattern.test(safeText));
    if (found) {
      structureScore += 3;
    } else {
      missingSections.push(section);
    }
  });
  structureScore = clamp(structureScore, 0, 15);

  // Contact Score (Max 10)
  let contactScore = 0;
  const issues: string[] = [];
  if (EMAIL_PATTERN.test(safeText)) {
    contactScore += 3;
  } else {
    issues.push("Add a professional email address to your header.");
  }

  if (PHONE_PATTERN.test(safeText)) {
    contactScore += 3;
  } else {
    issues.push("Include a phone number in an ATS-friendly format (e.g., 123-456-7890).");
  }

  if (LOCATION_PATTERN.test(safeText)) {
    contactScore += 2;
  } else {
    issues.push("Mention your location or preferred location to help recruiters filter candidates.");
  }

  if (LINKEDIN_PATTERN.test(lowerText) || /portfolio|github|behance/i.test(safeText)) {
    contactScore += 2;
  } else {
    issues.push("Add a LinkedIn profile or professional portfolio link.");
  }
  contactScore = clamp(contactScore, 0, 10);

  // Formatting Score (Max 10)
  let formattingScore = 10;
  const tableIndicators = (safeText.match(/[|]/g) || []).length + (safeText.match(/\t/g) || []).length;
  if (tableIndicators > 10) {
    formattingScore -= 5;
    issues.push("Tables or tabbed layouts can break in ATS parsing. Use simple bullet lists instead.");
  } else if (tableIndicators > 0) {
    formattingScore -= 2;
  }

  const excessiveSpacing = /\s{4,}/.test(safeText);
  if (excessiveSpacing) {
    formattingScore -= 2;
    issues.push("Large spacing or multi-column layouts may not parse correctly in ATS.");
  }

  const bulletSymbols = (safeText.match(/[•◦▪■]/g) || []).length;
  if (bulletSymbols > 100) {
    formattingScore -= 1;
  }

  const specialCharRatio =
    (safeText.replace(/[\p{L}0-9\s.,;:'"()\-]/gu, "").length / safeText.length) || 0;
  if (specialCharRatio > 0.25) {
    formattingScore -= 2;
    issues.push("Reduce heavy use of special characters; they can confuse ATS parsers.");
  }
  formattingScore = clamp(formattingScore, 0, 10);

  // Readability Score (Max 10)
  let readabilityScore = 10;
  if (wordCount < 200) {
    readabilityScore -= 3;
    issues.push("Your resume looks brief. Expand experience details with impact statements.");
  } else if (wordCount > 1500) {
    readabilityScore -= 2;
    issues.push("Consider trimming content to keep the resume concise for recruiters.");
  }

  if (avgSentenceLength > 30) {
    readabilityScore -= 2;
    issues.push("Long sentences decrease readability. Break them into short action-driven bullet points.");
  } else if (avgSentenceLength >= 12 && avgSentenceLength <= 25) {
    // Good range
  }

  // Check for clichés
  const foundCliches = CLICHES.filter((cliche) => lowerText.includes(cliche));
  if (foundCliches.length > 0) {
    readabilityScore -= Math.min(foundCliches.length, 3);
    issues.push(`Avoid overused clichés like "${foundCliches[0]}". Use specific examples instead.`);
  }
  readabilityScore = clamp(readabilityScore, 0, 10);

  // Impact Score (Max 20)
  let impactScore = 0;
  const foundActionVerbs = ACTION_VERBS.filter((verb) => lowerText.includes(verb));
  const actionVerbCount = foundActionVerbs.length;

  if (actionVerbCount > 15) impactScore += 15;
  else if (actionVerbCount > 10) impactScore += 10;
  else if (actionVerbCount >= 5) impactScore += 5;
  else
    issues.push(
      "Use more strong action verbs (e.g., 'led', 'developed', 'achieved') to describe your experience."
    );

  if (METRIC_PATTERN.test(safeText)) {
    impactScore += 5;
  } else {
    issues.push("Add quantifiable metrics (%, $, #) to highlight achievements.");
  }
  impactScore = clamp(impactScore, 0, 20);

  // Extras Score (Max 10)
  let extrasScore = 5;
  if (fileType && /pdf/i.test(fileType)) {
    extrasScore += 3;
  }

  if (/\b(resume|curriculum vitae|cv)\b/i.test(safeText)) {
    extrasScore += 2;
  }
  extrasScore = clamp(extrasScore, 0, 10);

  // Keywords Score (Max 25)
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
    impact: impactScore,
  };

  const score = clamp(
    Math.round(
      breakdown.structure +
        breakdown.contact +
        breakdown.keywords +
        breakdown.formatting +
        breakdown.readability +
        breakdown.extras +
        breakdown.impact
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

  if (actionVerbCount < 5) {
    suggestions.push("Start bullet points with strong action verbs to show impact.");
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
