"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { triggerHaptic } from "@/lib/haptics";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Threshold distance to trigger refresh (default: 80px) */
  threshold?: number;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
  /** Container className */
  className?: string;
  /** Whether pull-to-refresh is enabled */
  enabled?: boolean;
}

/**
 * PullToRefresh - Pull-to-refresh component for mobile
 * 
 * @example
 * <PullToRefresh onRefresh={async () => { await fetchData(); }}>
 *   <ContentList />
 * </PullToRefresh>
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  loadingIndicator,
  className = "",
  enabled = true,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  
  const y = useMotionValue(0);
  const controls = useAnimation();
  
  // Transform y position to opacity and scale for the indicator
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    // Only enable pull when at top of scroll
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      setCanPull(false);
      return;
    }
    
    setCanPull(true);
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !canPull || isRefreshing || !isPulling.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make it feel native
      const resistance = 0.5;
      const pullDistance = Math.min(diff * resistance, threshold * 1.5);
      y.set(pullDistance);
      
      // Haptic feedback when crossing threshold
      if (pullDistance >= threshold && y.get() < threshold) {
        triggerHaptic('medium');
      }
    }
  }, [enabled, canPull, isRefreshing, threshold, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPulling.current) return;
    isPulling.current = false;
    
    const currentY = y.get();
    
    if (currentY >= threshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      triggerHaptic('success');
      
      // Animate to refresh position
      await controls.start({ y: 60 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
        y.set(0);
      }
    } else {
      // Snap back
      controls.start({ y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
      y.set(0);
    }
  }, [enabled, threshold, isRefreshing, onRefresh, controls, y]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className="absolute left-1/2 -translate-x-1/2 top-0 z-10 flex items-center justify-center w-10 h-10 -mt-2"
      >
        {isRefreshing ? (
          loadingIndicator || (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )
        ) : (
          <motion.div 
            style={{ rotate: indicatorRotate }}
            className="text-muted-foreground"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        animate={controls}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
