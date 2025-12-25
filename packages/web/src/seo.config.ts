export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
};

const SITE_URL = "https://hireall.app";
const DEFAULT_OG_IMAGE = "/og-image.png";

const DEFAULT_META: SeoMeta = {
  title: "HireAll | Track Sponsored Jobs & Accelerate Your Career",
  description:
    "Discover sponsored job opportunities, manage your applications, and accelerate your job search with HireAll's AI-powered toolkit.",
  keywords:
    "hireall, sponsored jobs, job tracker, job search, resume builder, career tools, ATS optimization",
  ogImage: DEFAULT_OG_IMAGE,
  ogType: "website",
};

type SeoRule = {
  pattern: RegExp;
  meta: Partial<SeoMeta>;
};

const SEO_RULES: SeoRule[] = [
  // ============ PUBLIC PAGES ============
  {
    pattern: /^\/$/,
    meta: {
      title: "HireAll | Never Miss a Sponsored Opportunity Again",
      description:
        "Reveal hidden sponsored job listings, organize your applications, and land offers faster with HireAll's AI-powered career tools.",
      keywords: "hireall, sponsored jobs, job search platform, job tracker, career tools",
    },
  },
  {
    pattern: /^\/blog$/,
    meta: {
      title: "Career Blog | HireAll",
      description:
        "Expert career advice, job search tips, resume writing guides, and industry insights to help you land your dream job.",
      keywords: "career blog, job search tips, resume advice, career development",
      ogType: "website",
    },
  },
  {
    pattern: /^\/blog\/.+/,
    meta: {
      title: "Blog Post | HireAll",
      description:
        "Read expert career advice and job search insights from HireAll.",
      ogType: "article",
    },
  },
  {
    pattern: /^\/contact$/,
    meta: {
      title: "Contact Us | HireAll",
      description:
        "Get in touch with the HireAll team for support, partnerships, feedback, or general inquiries. We're here to help!",
      keywords: "contact hireall, support, customer service, feedback",
    },
  },
  {
    pattern: /^\/privacy$/,
    meta: {
      title: "Privacy Policy | HireAll",
      description:
        "Learn how HireAll collects, uses, and safeguards your data. Your privacy matters to us. GDPR and CCPA compliant.",
      keywords: "privacy policy, data protection, GDPR, CCPA, HireAll privacy",
    },
  },
  {
    pattern: /^\/terms$/,
    meta: {
      title: "Terms of Service | HireAll",
      description:
        "Review the terms and conditions that govern your use of the HireAll job tracking platform and Chrome extension.",
      keywords: "terms of service, user agreement, HireAll terms, legal",
    },
  },
  {
    pattern: /^\/conditions$/,
    meta: {
      title: "Terms & Conditions | HireAll",
      description:
        "Read the full terms and conditions for using HireAll services, platform, and Chrome extension.",
      keywords: "terms and conditions, legal terms, HireAll conditions",
    },
  },
  {
    pattern: /^\/volunteer$/,
    meta: {
      title: "Volunteer Program | HireAll",
      description:
        "Join our volunteer program to help job seekers succeed. Make a difference in someone's career journey while gaining valuable experience.",
      keywords: "volunteer, career mentorship, job seeker support, community, give back",
    },
  },
  {
    pattern: /^\/volunteer\/apply$/,
    meta: {
      title: "Apply to Volunteer | HireAll",
      description:
        "Submit your volunteer application to join HireAll's community of career mentors and advisors.",
      keywords: "volunteer application, career mentor, join community",
      noIndex: true,
    },
  },

  // ============ AUTH PAGES ============
  {
    pattern: /^\/sign-in$/,
    meta: {
      title: "Sign In | HireAll",
      description:
        "Access your HireAll dashboard and continue tracking sponsored job opportunities.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/sign-up$/,
    meta: {
      title: "Create Your Account | HireAll",
      description:
        "Join HireAll to highlight sponsored jobs, build ATS-optimized resumes, and accelerate your job search with AI tools.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/auth\/forgot$/,
    meta: {
      title: "Forgot Password | HireAll",
      description:
        "Reset your HireAll password. We'll send you a link to recover your account.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/auth\/reset$/,
    meta: {
      title: "Reset Password | HireAll",
      description:
        "Create a new password for your HireAll account.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/verify-email$/,
    meta: {
      title: "Verify Your Email | HireAll",
      description:
        "Verify your email address to complete your HireAll account setup.",
      noIndex: true,
    },
  },
  {
    pattern: /^\/welcome$/,
    meta: {
      title: "Welcome to HireAll!",
      description:
        "Get started with HireAll. Set up your profile and discover your personalized job search dashboard.",
      noIndex: true,
    },
  },

  // ============ DASHBOARD & TOOLS ============
  {
    pattern: /^\/dashboard/,
    meta: {
      title: "Dashboard | HireAll",
      description:
        "Monitor job applications, sponsorship insights, analytics, and follow-ups all in one powerful dashboard.",
      keywords: "job dashboard, application tracker, job insights, career management",
    },
  },
  {
    pattern: /^\/career-tools$/,
    meta: {
      title: "AI Career Tools | HireAll",
      description:
        "Access AI-powered CV analysis, cover letter generation, resume building, and ATS optimization tools to supercharge your job search.",
      keywords: "career tools, AI resume, CV analyzer, cover letter generator, ATS score, job search tools",
    },
  },
  {
    pattern: /^\/cv-evaluator$/,
    meta: {
      title: "CV Evaluator | HireAll",
      description:
        "Upload your CV and get instant ATS compatibility analysis, keyword optimization suggestions, and actionable improvement tips.",
      keywords: "CV evaluator, resume checker, ATS scanner, resume analysis, CV optimization",
    },
  },
  {
    pattern: /^\/resume-builder$/,
    meta: {
      title: "Resume Builder | HireAll",
      description:
        "Craft ATS-friendly resumes using AI insights, professional templates, and real-time scoring to land more offers.",
      keywords: "resume builder, ATS resume, resume templates, resume scoring, professional resume",
    },
  },
  {
    pattern: /^\/application$/,
    meta: {
      title: "Application Manager | HireAll",
      description:
        "Track, organize, and manage all your job applications in one place. Never miss a follow-up deadline.",
      keywords: "job application tracker, application manager, job organizer",
    },
  },
  {
    pattern: /^\/portfolio-builder$/,
    meta: {
      title: "Portfolio Builder | HireAll",
      description:
        "Build a polished public portfolio in minutes. Showcase your best work and share with recruiters instantly.",
      keywords: "portfolio builder, professional portfolio, online portfolio, work showcase",
    },
  },
  {
    pattern: /^\/templates$/,
    meta: {
      title: "Application Templates | HireAll",
      description:
        "Access professional cover letter templates, email templates, and customizable documents to stand out to employers.",
      keywords: "cover letter templates, email templates, job application templates",
    },
  },
  {
    pattern: /^\/jobs$/,
    meta: {
      title: "Job Search | HireAll",
      description:
        "Explore curated job listings with sponsorship insights. Filter, save, and apply to the best matches instantly.",
      keywords: "job search, sponsored jobs, job listings, find jobs, job opportunities",
    },
  },
  {
    pattern: /^\/companies$/,
    meta: {
      title: "Company Research | HireAll",
      description:
        "Research companies, explore salaries, culture, and sponsorship signals to prioritize high-intent employers.",
      keywords: "company research, employer insights, company culture, salary data",
    },
  },
  {
    pattern: /^\/career$/,
    meta: {
      title: "Career Overview | HireAll",
      description:
        "Track career goals, salary targets, and progress metrics. Visualize your professional growth journey.",
      keywords: "career planning, career goals, salary tracker, career progress",
    },
  },
  {
    pattern: /^\/settings$/,
    meta: {
      title: "Settings | HireAll",
      description:
        "Manage your HireAll preferences, notifications, account settings, and integrations.",
      noIndex: true,
    },
  },

  // ============ UPGRADE & PREMIUM ============
  {
    pattern: /^\/upgrade$/,
    meta: {
      title: "Upgrade to Premium | HireAll",
      description:
        "Unlock unlimited tracking, AI insights, advanced analytics, and priority support by upgrading to HireAll Premium.",
      keywords: "hireall premium, upgrade, pro features, unlimited access",
    },
  },
  {
    pattern: /^\/upgrade\/success$/,
    meta: {
      title: "Welcome to Premium! | HireAll",
      description:
        "Congratulations! Your HireAll Premium subscription is now active. Explore all your new features.",
      noIndex: true,
    },
  },

  // ============ EXTENSION ============
  {
    pattern: /^\/extension\/connect$/,
    meta: {
      title: "Connect Chrome Extension | HireAll",
      description:
        "Link your HireAll Chrome extension to your account for seamless job tracking across the web.",
      keywords: "chrome extension, browser extension, job tracker extension",
      noIndex: true,
    },
  },

  // ============ PUBLIC PROFILES ============
  {
    pattern: /^\/p\/.+/,
    meta: {
      title: "Candidate Portfolio | HireAll",
      description:
        "View this candidate's professional portfolio, experience, projects, and contact information powered by HireAll.",
      ogType: "profile",
    },
  },

  // ============ ADMIN PAGES ============
  {
    pattern: /^\/admin/,
    meta: {
      title: "Admin Panel | HireAll",
      description:
        "Administer user access, content, analytics, and platform configuration.",
      noIndex: true,
    },
  },
  // ============ API ROUTES (no SEO) ============
  {
    pattern: /^\/api\//,
    meta: {
      title: "API | HireAll",
      description: "API route",
      noIndex: true,
    },
  },
];

/**
 * Resolve SEO metadata for a given pathname
 */
export function resolveSeoMeta(
  pathname: string,
  override?: Partial<SeoMeta>
): SeoMeta {
  const match = SEO_RULES.find((rule) => rule.pattern.test(pathname));
  const base = match ? { ...DEFAULT_META, ...match.meta } : DEFAULT_META;
  return { ...base, ...override };
}

/**
 * Get canonical URL for a pathname
 */
export function getCanonicalUrl(pathname: string): string {
  // Remove trailing slashes except for root
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Get Open Graph image URL
 */
export function getOgImageUrl(ogImage?: string): string {
  if (!ogImage) return `${SITE_URL}${DEFAULT_OG_IMAGE}`;
  if (ogImage.startsWith("http")) return ogImage;
  return `${SITE_URL}${ogImage}`;
}

export { SITE_URL, DEFAULT_OG_IMAGE };
