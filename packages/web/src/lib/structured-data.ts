import { SITE_URL } from "@/seo.config";

/**
 * JSON-LD Structured Data Types
 */
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email?: string;
  };
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}

export interface BlogPostingSchema {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    "@type": "Person" | "Organization";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

export interface SoftwareApplicationSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
}

/**
 * Generate Organization schema for the website
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HireAll",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "HireAll helps job seekers discover sponsored opportunities, track applications, and accelerate their career with AI-powered tools.",
    sameAs: [
      "https://twitter.com/hireall",
      "https://www.linkedin.com/company/hireall",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "noreply@hireall.app",
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HireAll",
    url: SITE_URL,
    description:
      "Track sponsored jobs, build ATS-optimized resumes, and accelerate your job search with AI-powered career tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Breadcrumb schema from path segments
 */
export function generateBreadcrumbSchema(
  pathname: string,
  labels?: Record<string, string>
): BreadcrumbSchema {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbSchema["itemListElement"] = [
    {
      "@type": "ListItem" as const,
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label =
      labels?.[segment] ||
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const isLast = index === segments.length - 1;
    
    // For the last item, don't include the item URL (per schema.org spec)
    if (isLast) {
      items.push({
        "@type": "ListItem" as const,
        position: index + 2,
        name: label,
      });
    } else {
      items.push({
        "@type": "ListItem" as const,
        position: index + 2,
        name: label,
        item: `${SITE_URL}${currentPath}`,
      });
    }
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Generate BlogPosting schema
 */
export function generateBlogPostingSchema(post: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
}): BlogPostingSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image || `${SITE_URL}/og-image.png`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author || "HireAll Team",
    },
    publisher: {
      "@type": "Organization",
      name: "HireAll",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

/**
 * Generate FAQPage schema from question/answer pairs
 */
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Software Application schema for the Chrome extension
 */
export function generateExtensionSchema(): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HireAll Chrome Extension",
    description:
      "Highlight sponsored job listings on LinkedIn, track applications, and sync with your HireAll dashboard.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Chrome",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
