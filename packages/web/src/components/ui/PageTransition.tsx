"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Variants for different transition types
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
  }),
};

const fadeScaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

// Simple history tracking for direction detection
const pathHistory: string[] = [];

/**
 * PageTransition component provides smooth slide/scale animations
 * between page navigations for a native app-like feel.
 * 
 * @example
 * // In layout.tsx or page components
 * <PageTransition>
 *   {children}
 * </PageTransition>
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(1);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      // Determine direction based on path history
      const prevIndex = pathHistory.indexOf(prevPathRef.current);
      const currentIndex = pathHistory.indexOf(pathname);

      if (currentIndex === -1) {
        // New path - forward navigation
        pathHistory.push(pathname);
        setDirection(1);
      } else if (currentIndex < prevIndex) {
        // Going back in history
        pathHistory.length = currentIndex + 1;
        setDirection(-1);
      } else {
        // Forward to existing path
        setDirection(1);
      }

      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * FadeScaleTransition - Alternative transition for modals/overlays
 */
export function FadeScaleTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={fadeScaleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
