"use client";

import { PageTransition } from "@/components/ui/PageTransition";
import { SwipeNavigation } from "@/components/ui/SwipeNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import React from "react";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
  /** Enable swipe navigation (default: true on mobile) */
  enableSwipe?: boolean;
}

/**
 * PageTransitionWrapper - Client component wrapper for PageTransition
 * Includes SwipeNavigation for mobile edge swipe back gestures
 * 
 * @example
 * // In layout.tsx
 * import { PageTransitionWrapper } from "@/components/ui/PageTransitionWrapper";
 * 
 * export default function Layout({ children }) {
 *   return <PageTransitionWrapper>{children}</PageTransitionWrapper>;
 * }
 */
export function PageTransitionWrapper({ 
  children,
  enableSwipe = true
}: PageTransitionWrapperProps) {
  const isMobile = useIsMobile();
  
  const content = (
    <PageTransition className="w-full">
      {children}
    </PageTransition>
  );

  // Only wrap with SwipeNavigation on mobile
  if (isMobile && enableSwipe) {
    return (
      <SwipeNavigation enableBack>
        {content}
      </SwipeNavigation>
    );
  }

  return content;
}

export default PageTransitionWrapper;
