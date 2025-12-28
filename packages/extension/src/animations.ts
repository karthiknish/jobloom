/**
 * Centralized animation system for Chrome Extension
 * Provides consistent animations and transitions across all extension components
 */

import {
  DURATIONS,
  EASING,
  KEYFRAMES,
  ANIMATIONS,
  CSS_CLASSES,
  PRESETS,
  createTransition,
} from "@hireall/shared";

export {
  DURATIONS,
  EASING,
  KEYFRAMES,
  ANIMATIONS,
  CSS_CLASSES,
  PRESETS,
  createTransition,
};

// Utility function to apply animations to elements
export const applyAnimation = (
  element: HTMLElement,
  animationName: keyof typeof CSS_CLASSES,
  duration?: number,
  onComplete?: () => void
): void => {
  const className = CSS_CLASSES[animationName];
  if (!className) return;
  
  element.classList.add(className);
  
  if (duration) {
    element.style.animationDuration = `${duration}ms`;
  }
  
  if (onComplete) {
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      onComplete();
    };
    element.addEventListener('animationend', handleAnimationEnd);
  }
};

// Utility function to remove animations
export const removeAnimation = (
  element: HTMLElement,
  animationName: keyof typeof CSS_CLASSES
): void => {
  const className = CSS_CLASSES[animationName];
  if (!className) return;
  
  element.classList.remove(className);
  element.style.animationDuration = '';
};

// Performance optimization utilities
export const PERFORMANCE = {
  // Disable animations for reduced motion preferences
  shouldReduceMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Get optimized animation duration based on performance
  getOptimizedDuration: (baseDuration: number): number => {
    if (PERFORMANCE.shouldReduceMotion()) {
      return 0; // No animation for reduced motion
    }
    
    // Reduce duration on lower-end devices
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return Math.min(baseDuration, DURATIONS.fast);
    }
    
    return baseDuration;
  },
  
  // Apply performance-optimized animation
  applyOptimizedAnimation: (
    element: HTMLElement,
    animationName: keyof typeof CSS_CLASSES,
    baseDuration: number = DURATIONS.normal,
    onComplete?: () => void
  ): void => {
    const optimizedDuration = PERFORMANCE.getOptimizedDuration(baseDuration);
    
    if (optimizedDuration === 0) {
      // Skip animation entirely for reduced motion
      if (onComplete) onComplete();
      return;
    }
    
    applyAnimation(element, animationName, optimizedDuration, onComplete);
  },
} as const;

export default {
  DURATIONS,
  EASING,
  KEYFRAMES,
  createTransition,
  ANIMATIONS,
  CSS_CLASSES,
  PRESETS,
  applyAnimation,
  removeAnimation,
  PERFORMANCE,
};