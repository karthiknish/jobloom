import type { ResumeData } from "@/types/resume";
import type { Job } from "@/utils/api/dashboard";
import type { CoverLetterData } from "./types";
import { getTemplateStyle, getToneStyle } from "./templates";

interface FormatLetterOptions {
  includeAchievements?: boolean;
  selectedJob?: Job | null;
}

const DEFAULT_NAME = "Your Name";
const DEFAULT_EMAIL = "your.email@example.com";
const DEFAULT_PHONE = "(555) 000-0000";
const DEFAULT_LOCATION = "City, State";

const YEARS_IN_MS = 1000 * 60 * 60 * 24 * 365;

const getYearsBetween = (startDate?: string | null): number => {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / YEARS_IN_MS));
};

const findMatchingSkills = (resumeSkills: string[] = [], jobSkills: string[] = []): string[] => {
  const normalizedJobSkills = jobSkills.map((skill) => skill.toLowerCase());
  return resumeSkills.filter((skill) => {
    const normalized = skill.toLowerCase();
    return normalizedJobSkills.some((jobSkill) =>
      normalized.includes(jobSkill) || jobSkill.includes(normalized)
    );
  });
};

export const formatLetter = (
  data: CoverLetterData,
  resume: Partial<ResumeData>,
  opts: FormatLetterOptions = {},
): string => {
  const personalInfo = resume.personalInfo;
  const name = personalInfo?.fullName?.trim() || DEFAULT_NAME;
  const email = personalInfo?.email?.trim() || DEFAULT_EMAIL;
  const phone = personalInfo?.phone?.trim() || DEFAULT_PHONE;
  const location = personalInfo?.location?.trim() || DEFAULT_LOCATION;

  const jobTitle = data.jobTitle.trim() || "the role";
  const companyName = data.companyName.trim() || "your company";
  const companyLocation = data.companyLocation.trim();
  const hiringManager = data.hiringManager.trim() || "Hiring Team";

  const formattedDate = new Date(data.applicationDate || Date.now()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const toneStyle = getToneStyle(data.tone);
  const templateStyle = getTemplateStyle(data.template);

  const generateOpening = () => {
    if (data.customOpening?.trim()) return data.customOpening;

    const experience = resume.experience?.[0];
    const yearsOfExperience = getYearsBetween(experience?.startDate);

    let opening = `${toneStyle.opening} ${jobTitle} position at ${companyName}. `;

    if (opts.selectedJob) {
      const job = opts.selectedJob;
      if (job.jobType) {
        opening += `This ${job.jobType.toLowerCase()} role particularly interests me because `;
      }

      const resumeSkills = resume.skills?.flatMap((set) => set.skills) || [];
      const matchingSkills = findMatchingSkills(resumeSkills, job.skills || []);

      if (matchingSkills.length > 0) {
        opening += `my expertise in ${matchingSkills.slice(0, 3).join(", ")} directly aligns with your requirements. `;
      }
    }

    if (templateStyle.includeObjective && yearsOfExperience > 0) {
      const role = resume.experience?.[0]?.position || "professional";
      opening += `With ${yearsOfExperience}+ years of experience as a ${role}, `;
    }

    if (!opts.selectedJob) {
      const topSkills = resume.skills?.flatMap((set) => set.skills).slice(0, 3).join(", ");
      opening += `I bring expertise in ${topSkills || "various technologies"}. `;
    }

    if (data.companyValues[0]) {
      opening += `My commitment to ${data.companyValues[0]} aligns perfectly with ${companyName}'s mission.`;
    }

    return opening;
  };

  const generateBody = () => {
    if (data.customBody?.trim()) return data.customBody;

    const strengths: string[] = [];

    if (opts.includeAchievements && resume.experience) {
      for (const experience of resume.experience) {
        if (experience.achievements?.length) {
          strengths.push(experience.achievements[0]);
        }
        if (strengths.length >= 3) break;
      }
    }

    if (data.keyRequirements.length) {
      strengths.push(`my experience with ${data.keyRequirements.slice(0, 2).join(", ")}`);
    }

    const summary = personalInfo?.summary?.trim();
    if (summary) {
      strengths.push(summary);
    }

    const bodyIntro = `${toneStyle.body} ${companyName || "your organization"}. `;
    const bulletPoints = strengths
      .filter(Boolean)
      .slice(0, 3)
      .map((point) => `• ${point}`)
      .join("\n");

    return `${bodyIntro}\n${bulletPoints}`;
  };

  const generateClosing = () => {
    if (data.customClosing?.trim()) return data.customClosing;

    const closing = `${toneStyle.closing} ${companyName}. `;
    const followUp = `Please feel free to contact me at ${email} or ${phone} to arrange a conversation.`;

    const signoff = `${toneStyle.signoff},\n${name}`;

    return `${closing}${followUp}\n\n${signoff}`;
  };

  const paragraphs = [generateOpening(), generateBody(), generateClosing()]
    .filter(Boolean)
    .join("\n\n");

  const headerLines = [
    `${name} | ${email} | ${phone} | ${location}`,
    companyLocation ? `${companyName} • ${companyLocation}` : companyName,
    formattedDate,
    `Dear ${hiringManager},`,
  ];

  return `${headerLines.join("\n")}\n\n${paragraphs}`.trim();
};
