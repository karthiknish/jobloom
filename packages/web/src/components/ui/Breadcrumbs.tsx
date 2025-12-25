"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  labels?: Record<string, string>;
}

// Default labels for common paths
const defaultLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "career-tools": "Career Tools",
  settings: "Settings",
  admin: "Admin",
  blog: "Blog",
  upgrade: "Upgrade",
  "cv-evaluator": "CV Evaluator",
  application: "Application",
};

/**
 * Breadcrumbs component for navigation orientation.
 * Auto-generates breadcrumbs from the current URL path or accepts custom items.
 */
export function Breadcrumbs({
  items,
  className,
  showHome = true,
  labels = {},
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if no items provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items;

    const segments = pathname.split("/").filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get label from props, defaults, or format from segment
      const label =
        labels[segment] ||
        defaultLabels[segment] ||
        segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

      generatedItems.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return generatedItems;
  }, [items, pathname, labels]);

  // Don't render if on homepage or no items
  if (pathname === "/" || breadcrumbItems.length === 0) {
    return null;
  }

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/" }, ...breadcrumbItems]
    : breadcrumbItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className
      )}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = index === 0 && showHome;

          return (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center"
            >
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground/50 flex-shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "hover:text-foreground transition-colors inline-flex items-center gap-1",
                    isHome && "font-medium"
                  )}
                >
                  {isHome && <Home className="h-3.5 w-3.5" />}
                  <span className={cn(isHome && "hidden sm:inline")}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "text-foreground font-medium",
                    isLast && "truncate max-w-[200px]"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
