"use client";

/**
 * Skip Navigation Component
 * 
 * Provides a "Skip to main content" link for keyboard navigation.
 * Hidden visually but accessible to screen readers and keyboard users.
 * Appears on focus (tab) at the top of the page.
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:bg-primary focus:text-primary-foreground
        focus:px-4 focus:py-2 focus:rounded-lg
        focus:font-medium focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-all duration-200
      "
    >
      Skip to main content
    </a>
  );
}

/**
 * Main Content Wrapper
 * 
 * Wrap your main page content with this to provide the skip navigation target.
 */
export function MainContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="main-content" tabIndex={-1} className={`outline-none ${className}`}>
      {children}
    </main>
  );
}
