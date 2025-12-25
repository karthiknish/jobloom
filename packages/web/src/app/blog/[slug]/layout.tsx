import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { generatePageMetadata } from "@/metadata";
import type { BlogPost } from "@/types/api";
import { getOgImageUrl } from "@/seo.config";

async function getRequestBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "hireall.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const resolvedParams = (params as any)?.then ? await (params as Promise<{ slug?: string }>) : (params as { slug?: string });
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
  const pathname = slug ? `/blog/${slug}` : "/blog";

  if (!slug) {
    return generatePageMetadata(pathname);
  }

  try {
    const baseUrl = await getRequestBaseUrl();
    const res = await fetch(`${baseUrl}/api/blog/posts/${encodeURIComponent(slug)}`, {
      // Blog metadata can be cached briefly
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      // withApi wraps responses as { success, data, meta }
      const post = ((json?.data ?? json) as BlogPost) ?? ({} as BlogPost);
      const ogImage = post.featuredImage ? getOgImageUrl(post.featuredImage) : undefined;
      return generatePageMetadata(pathname, {
        title: `${post.title} | HireAll`,
        description: post.excerpt,
        ogImage,
      });
    }
  } catch {
    // Fall back to rule-based metadata
  }

  return generatePageMetadata(pathname);
}

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return children;
}
