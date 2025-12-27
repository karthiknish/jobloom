"use client";

import React from "react";

interface SkipToContentProps {
  /** ID of the main content element to skip to */
  contentId?: string;
  /** Custom link text */
  children?: React.ReactNode;
}

/**
 * SkipToContent - Provides a skip navigation link for keyboard users.
 * 
 * This link is visually hidden until focused, allowing keyboard users
 * to skip repetitive navigation and jump directly to main content.
 * 
 * @example
 * // In your layout.tsx
 * <body>
 *   <SkipToContent />
 *   <Header />
 *   <main id="main-content">...</main>
 * </body>
 */
export function SkipToContent({
  contentId = "main-content",
  children = "Skip to main content",
}: SkipToContentProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(contentId);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus();
      target.removeAttribute("tabindex");
    }
  };

  return (
    <a
      href={`#${contentId}`}
      className="skip-to-content"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default SkipToContent;
