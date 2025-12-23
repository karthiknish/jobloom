"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion.
 * Use this with Framer Motion's Variants to respect accessibility preferences.
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * const variants = {
 *   hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
 *   visible: { opacity: 1, y: 0 }
 * };
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window and matchMedia are available (SSR safety)
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Legacy support (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Utility object for Framer Motion that respects reduced motion preference.
 * Use with variants prop on motion components.
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const animation = getReducedMotionVariants(prefersReducedMotion);
 * 
 * <motion.div
 *   initial="hidden"
 *   animate="visible"
 *   variants={animation.fadeInUp}
 * />
 */
export function getReducedMotionVariants(prefersReducedMotion: boolean) {
  return {
    fadeInUp: {
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.3 },
      },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      },
    },
    slideInFromRight: {
      hidden: { opacity: 0, x: prefersReducedMotion ? 0 : 30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      },
    },
  };
}

/**
 * Get motion props that respect reduced motion preference.
 * Use this for whileHover, whileTap, etc.
 */
export function getReducedMotionProps(prefersReducedMotion: boolean) {
  return {
    whileHover: prefersReducedMotion ? {} : { scale: 1.02 },
    whileTap: prefersReducedMotion ? {} : { scale: 0.98 },
    hoverLift: prefersReducedMotion ? {} : { scale: 1.02, y: -2 },
  };
}
