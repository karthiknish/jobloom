"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/utils/api/dashboard";
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Application } from "@/types/dashboard";

export interface SearchResult {
  id: string;
  type: "job" | "cv-analysis" | "resume" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon?: string;
  score?: number;
}

interface SearchCategory {
  label: string;
  results: SearchResult[];
}

const RECENT_SEARCHES_KEY = "hireall_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Quick navigation pages
const QUICK_PAGES: SearchResult[] = [
  { id: "dashboard", type: "page", title: "Dashboard", subtitle: "View your job applications", href: "/dashboard" },
  { id: "career-tools", type: "page", title: "Career Tools", subtitle: "Resume builder & Resume evaluator", href: "/career-tools" },
  { id: "settings", type: "page", title: "Settings", subtitle: "Manage your account", href: "/settings" },
  { id: "upgrade", type: "page", title: "Upgrade to Premium", subtitle: "Unlock all features", href: "/upgrade" },
];

export function useGlobalSearch() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch user record using TanStack Query
  const { data: userRecord, isLoading: isLoadingUser } = useQuery({
    queryKey: ["dashboard", "user", user?.uid],
    queryFn: () => dashboardApi.getUserByFirebaseUid(user!.uid),
    enabled: !!user?.uid,
    staleTime: 60 * 1000,
  });

  // Fetch applications for search using TanStack Query
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["dashboard", "applications", userRecord?._id],
    queryFn: () => dashboardApi.getApplicationsByUser(userRecord!._id),
    enabled: !!userRecord?._id,
    staleTime: 30 * 1000,
  });

  // Fetch Resume analyses for search using TanStack Query
  const { data: cvAnalyses, isLoading: isLoadingCvAnalyses } = useQuery({
    queryKey: ["dashboard", "cvAnalyses", userRecord?._id],
    queryFn: () => cvEvaluatorApi.getCvAnalysesByUser(userRecord!._id),
    enabled: !!userRecord?._id,
    staleTime: 60 * 1000,
  });

  // Filter and search results
  const searchResults = useMemo((): SearchCategory[] => {
    const normalizedQuery = query.toLowerCase().trim();
    const categories: SearchCategory[] = [];

    // Always show quick pages (filtered if query exists)
    const filteredPages = QUICK_PAGES.filter(
      (page) =>
        !normalizedQuery ||
        page.title.toLowerCase().includes(normalizedQuery) ||
        page.subtitle?.toLowerCase().includes(normalizedQuery)
    );
    if (filteredPages.length > 0) {
      categories.push({ label: "Quick Navigation", results: filteredPages });
    }

    // Search jobs
    if (applications && applications.length > 0) {
      const jobResults: SearchResult[] = applications
        .filter((app) => {
          if (!normalizedQuery) return true;
          const job = app.job;
          return (
            job?.title?.toLowerCase().includes(normalizedQuery) ||
            job?.company?.toLowerCase().includes(normalizedQuery) ||
            job?.location?.toLowerCase().includes(normalizedQuery)
          );
        })
        .slice(0, 5)
        .map((app) => ({
          id: app._id,
          type: "job" as const,
          title: app.job?.title || "Untitled Job",
          subtitle: app.job?.company || "Unknown Company",
          href: `/dashboard?job=${app._id}`,
        }));

      if (jobResults.length > 0) {
        categories.push({ label: "Jobs", results: jobResults });
      }
    }

    // Search Resume analyses
    if (cvAnalyses && cvAnalyses.length > 0) {
      const cvResults: SearchResult[] = cvAnalyses
        .filter((analysis: any) => {
          if (!normalizedQuery) return true;
          return (
            analysis.fileName?.toLowerCase().includes(normalizedQuery) ||
            analysis.targetRole?.toLowerCase().includes(normalizedQuery)
          );
        })
        .slice(0, 5)
        .map((analysis: any) => ({
          id: analysis._id || analysis.id,
          type: "cv-analysis" as const,
          title: analysis.fileName || "Resume Analysis",
          subtitle: `Score: ${analysis.overallScore || analysis.score || "N/A"}%`,
          href: "/career-tools",
          score: analysis.overallScore || analysis.score,
        }));

      if (cvResults.length > 0) {
        categories.push({ label: "Resume Analyses", results: cvResults });
      }
    }

    return categories;
  }, [query, applications, cvAnalyses]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return searchResults.flatMap((cat) => cat.results);
  }, [searchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(flatResults[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [flatResults, selectedIndex]
  );

  // Save to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query);
      setIsOpen(false);
      setQuery("");
      setSelectedIndex(0);
      router.push(result.href);
    },
    [query, router, saveRecentSearch]
  );

  // Open/Close handlers
  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return {
    isOpen,
    query,
    setQuery,
    searchResults,
    flatResults,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    open,
    close,
    handleKeyDown,
    handleSelect,
    isLoading: isLoadingUser || isLoadingApplications || isLoadingCvAnalyses,
  };
}
