"use client";

import React from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** If true, element becomes visible when focused (for skip links) */
  focusable?: boolean;
}

/**
 * VisuallyHidden - Hides content visually while keeping it accessible to screen readers.
 * 
 * @example
 * // Hidden text for screen readers
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Close menu</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({
  children,
  focusable = false,
  className = "",
  ...props
}: VisuallyHiddenProps) {
  const baseClassName = focusable ? "sr-only-focusable" : "sr-only";
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <span className={combinedClassName} {...props}>
      {children}
    </span>
  );
}

export default VisuallyHidden;
