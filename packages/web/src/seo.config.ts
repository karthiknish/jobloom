export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  noIndex?: boolean;
};

const DEFAULT_META: SeoMeta = {
  title: "HireAll | Track Sponsored Jobs & Accelerate Your Career",
  description:
    "Discover sponsored job opportunities, manage your applications, and accelerate your job search with HireAll's AI-powered toolkit.",
  keywords:
    "hireall, sponsored jobs, job tracker, job search, resume builder, interview prep",
};

type SeoRule = {
  pattern: RegExp;
  meta: Partial<SeoMeta>;
};

const SEO_RULES: SeoRule[] = [
  {
    pattern: /^\/$/,
    meta: {
      title: "HireAll | Never Miss a Sponsored Opportunity Again",
      description:
        "Reveal hidden sponsored job listings, organize your applications, and land interviews faster with HireAll.",
      keywords: "hireall, sponsored jobs, job search platform, job tracker"
    },
  },
  {
    pattern: /^\/dashboard/,
    meta: {
      title: "Dashboard | HireAll",
      description:
        "Monitor job applications, sponsorship insights, and follow-ups all in one powerful dashboard.",
    },
  },
  {
    pattern: /^\/resume-builder/,
    meta: {
      title: "Resume Builder | HireAll",
      description:
        "Craft ATS-friendly resumes using AI insights, section templates, and real-time scoring.",
      keywords: "resume builder, ATS resume, resume scoring, hireall"
    },
  },
  {
    pattern: /^\/portfolio-builder/,
    meta: {
      title: "Portfolio Builder | HireAll",
      description:
        "Build a polished public portfolio in minutes and share your best work with recruiters.",
    },
  },
  {
    pattern: /^\/templates/,
    meta: {
      title: "Application Templates | HireAll",
      description:
        "Access professional cover letters, email templates, and customizable documents to stand out.",
    },
  },
  {
    pattern: /^\/companies/,
    meta: {
      title: "Company Research | HireAll",
      description:
        "Dig into salaries, culture, and sponsorship signals to prioritize high-intent employers.",
    },
  },
  {
    pattern: /^\/career/,
    meta: {
      title: "Career Overview | HireAll",
      description:
        "Track career goals, salary targets, and progress metrics to stay on course.",
    },
  },
  {
    pattern: /^\/jobs/,
    meta: {
      title: "Job Search | HireAll",
      description:
        "Explore curated job listings with sponsorship insights and save the best matches instantly.",
    },
  },
  {
    pattern: /^\/contact/,
    meta: {
      title: "Contact HireAll",
      description:
        "Get in touch with the HireAll team for support, partnerships, or product feedback.",
    },
  },
  {
    pattern: /^\/settings/,
    meta: {
      title: "Settings | HireAll",
      description:
        "Manage your HireAll preferences, notifications, and account integrations.",
    },
  },
  {
    pattern: /^\/sign-in/,
    meta: {
      title: "Sign In | HireAll",
      description:
        "Access your HireAll dashboard and continue tracking sponsored job opportunities.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/sign-up/,
    meta: {
      title: "Create your HireAll account",
      description:
        "Join HireAll to highlight sponsored jobs, build applications, and accelerate your job search.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/upgrade\//,
    meta: {
      title: "Upgrade to HireAll Premium",
      description:
        "Unlock unlimited tracking, AI insights, and advanced analytics by upgrading your HireAll account.",
    },
  },
  {
    pattern: /^\/admin/,
    meta: {
      title: "Admin Panel | HireAll",
      description:
        "Administer user access, sponsored companies, and platform configuration in HireAll.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/privacy/,
    meta: {
      title: "Privacy Policy | HireAll",
      description:
        "Learn how HireAll collects, uses, and safeguards your data. Your privacy matters to us.",
      keywords: "privacy policy, data protection, GDPR, CCPA, HireAll privacy",
    },
  },
  {
    pattern: /^\/terms/,
    meta: {
      title: "Terms of Service | HireAll",
      description:
        "Review the terms that govern your use of the HireAll job tracking platform and Chrome extension.",
      keywords: "terms of service, user agreement, HireAll terms",
    },
  },
  {
    pattern: /^\/p\//,
    meta: {
      title: "Candidate Portfolio | HireAll",
      description:
        "Explore a candidate portfolio powered by HireAll. View experience, projects, and contact information.",
    },
  },
];

export function resolveSeoMeta(
  pathname: string,
  override?: Partial<SeoMeta>
): SeoMeta {
  const match = SEO_RULES.find((rule) => rule.pattern.test(pathname));
  const base = match ? { ...DEFAULT_META, ...match.meta } : DEFAULT_META;
  return { ...base, ...override };
}
