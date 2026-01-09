import type { MetadataRoute } from "next";
import { SITE_URL } from "@/seo.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/settings/",
          "/auth/",
          "/application/",
          "/cv-evaluator",
          "/extension/connect",
          "/sign-in",
          "/sign-up",
          "/verify-email",
          "/welcome",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
