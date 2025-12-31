import { ResumeGeneratorFormData } from './types';

export const generateMockSummary = (data: ResumeGeneratorFormData): string => {
  const levelMap = {
    entry: "Ambitious and highly motivated",
    mid: "Dynamic and results-oriented", 
    senior: "Strategic and highly experienced",
    executive: "Visionary and multi-faceted"
  };

  const styleMap: Record<string, string> = {
    modern: "exceptional communication and analytical skills",
    classic: "demonstrated leadership and organizational excellence",
    creative: "a proven track record of innovative problem-solving",
    tech: "a passion for collaborative and agile environments",
  };

  const summary = `${levelMap[data.level] || "Dedicated"} ${data.industry || "industry"} professional with ${styleMap[data.style] || "a strong background in the field"}. 
Proven ability to drive efficiency and deliver high-quality results. Seeking a ${data.jobTitle || "challenging"} position to contribute to team success and organizational growth.`;

  return `PROFESSIONAL SUMMARY
${summary}`;
};

export const generateMockExperience = (data: ResumeGeneratorFormData): string => {
  return `PROFESSIONAL EXPERIENCE
${data.experience || "Senior Specialist | Previous Company"}
• Streamlined core operations resulting in a 20% increase in team productivity.
• Collaborated with cross-functional partners to implement strategic initiatives.
• Regularly exceeded performance targets and received commendations for excellence.
• Mentored junior team members and fostered a culture of continuous improvement.

[Upgrade to Premium for AI-tailored bullet points specific to your target job]`;
};

export const generateMockResumeContent = (data: ResumeGeneratorFormData): string => {
  return `${generateMockSummary(data)}

${generateMockExperience(data)}

SKILLS
${data.skills.join(", ")}

EDUCATION
${data.education || "Bachelor's Degree in relevant field"}

[This is a demo version. Upgrade for full AI-generated resume.]`;
};

export const extractKeywords = (data: ResumeGeneratorFormData): string[] => {
  const commonKeywords = [
    "leadership", "communication", "teamwork", "problem-solving", "analytical",
    "project management", "collaboration", "initiative", "adaptability", "creativity"
  ];

  const industryKeywords: Record<string, string[]> = {
    Technology: ["javascript", "python", "react", "aws", "docker", "agile"],
    healthcare: ["patient care", "medical terminology", "hipaa", "clinical"],
    finance: ["financial analysis", "reporting", "budgeting", "forecasting"],
    marketing: ["digital marketing", "seo", "content strategy", "analytics"],
  };

  const allKeywords = [
    ...commonKeywords,
    ...(industryKeywords[data.industry] || []),
    ...data.skills
  ];

  return allKeywords.slice(0, 8);
};

export const generateMockSuggestions = (data: ResumeGeneratorFormData): string[] => {
  const suggestions = [
    "Add specific metrics and quantifiable achievements",
    "Include more industry-specific keywords",
    "Strengthen your professional summary",
    "Add relevant certifications or training",
  ];

  return suggestions.slice(0, 3);
};

export const getAtsScoreLabel = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (score >= 80) return { label: "Very Good", color: "text-blue-500", bg: "bg-blue-500/10" };
  if (score >= 70) return { label: "Good", color: "text-amber-500", bg: "bg-amber-500/10" };
  return { label: "Needs Improvement", color: "text-rose-500", bg: "bg-rose-500/10" };
};
