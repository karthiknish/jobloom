"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";

interface SwipeNavigationProps {
  children: React.ReactNode;
  /** Threshold distance to trigger navigation (default: 100px) */
  threshold?: number;
  /** Enable left edge swipe for back navigation */
  enableBack?: boolean;
  /** Custom back function (defaults to router.back()) */
  onBack?: () => void;
  /** Edge detection width (how far from edge the swipe must start) */
  edgeWidth?: number;
  /** Container className */
  className?: string;
}

/**
 * SwipeNavigation - Edge swipe gestures for back/forward navigation
 * 
 * @example
 * <SwipeNavigation onBack={() => router.back()}>
 *   <PageContent />
 * </SwipeNavigation>
 */
export function SwipeNavigation({
  children,
  threshold = 100,
  enableBack = true,
  onBack,
  edgeWidth = 20,
  className = "",
}: SwipeNavigationProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isEdgeSwipe = useRef(false);
  
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Visual feedback
  const opacity = useTransform(x, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(x, [0, threshold], [0.8, 1]);
  const indicatorX = useTransform(x, [0, threshold], [-30, 10]);

  const handleBack = useCallback(() => {
    triggerHaptic('medium');
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handlePanStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!enableBack) return;
    
    const clientX = 'touches' in event 
      ? event.touches[0].clientX 
      : (event as MouseEvent).clientX;
    
    // Check if starting from left edge
    isEdgeSwipe.current = clientX <= edgeWidth;
    startX.current = clientX;
  }, [enableBack, edgeWidth]);

  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableBack || !isEdgeSwipe.current) return;
    
    // Only allow right swipe (positive offset)
    if (info.offset.x > 0) {
      const resistance = 0.6;
      const swipeDistance = Math.min(info.offset.x * resistance, threshold * 1.5);
      x.set(swipeDistance);
      
      // Haptic feedback when crossing threshold
      if (swipeDistance >= threshold && (x.getPrevious() ?? 0) < threshold) {
        triggerHaptic('light');
      }
    }
  }, [enableBack, threshold, x]);

  const handlePanEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableBack) return;
    
    const currentX = x.get();
    
    if (currentX >= threshold && isEdgeSwipe.current) {
      // Trigger back navigation
      await controls.start({ 
        x: window.innerWidth, 
        transition: { type: "spring", stiffness: 400, damping: 30 } 
      });
      handleBack();
    } else {
      // Snap back
      controls.start({ 
        x: 0, 
        transition: { type: "spring", stiffness: 400, damping: 30 } 
      });
    }
    
    x.set(0);
    isEdgeSwipe.current = false;
  }, [enableBack, threshold, controls, x, handleBack]);

  // Prevent default swipe behavior on iOS
  useEffect(() => {
    const preventDefaultSwipe = (e: TouchEvent) => {
      if (isEdgeSwipe.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefaultSwipe, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventDefaultSwipe);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Back indicator */}
      {enableBack && (
        <motion.div
          style={{ opacity, scale, x: indicatorX }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-lg"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </motion.div>
      )}

      {/* Content with swipe handling */}
      <motion.div
        style={{ x }}
        animate={controls}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeNavigation;
