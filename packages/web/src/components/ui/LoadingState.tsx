"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** Whether to show the loading state */
  loading: boolean;
  /** Text to display while loading */
  message?: string;
  /** Whether to cover the entire container */
  overlay?: boolean;
  /** Size of the spinner */
  size?: "sm" | "default" | "lg";
  children?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: { spinner: "h-4 w-4", text: "text-xs" },
  default: { spinner: "h-6 w-6", text: "text-sm" },
  lg: { spinner: "h-8 w-8", text: "text-base" },
};

/**
 * LoadingState - Shared loading overlay/component
 * 
 * Usage:
 * <LoadingState loading={isLoading} message="Loading data...">
 *   <YourContent />
 * </LoadingState>
 */
export function LoadingState({
  loading,
  message,
  overlay = true,
  size = "default",
  children,
  className,
}: LoadingStateProps) {
  const styles = sizeClasses[size];

  return (
    <div className={cn("relative", className)}>
      {children}
      
      <AnimatePresence>
        {loading && overlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-inherit"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn("animate-spin text-primary", styles.spinner)} />
              {message && (
                <p className={cn("text-muted-foreground", styles.text)}>{message}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * LoadingSpinner - Inline loading indicator
 */
export function LoadingSpinner({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const styles = sizeClasses[size];
  
  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", styles.spinner, className)} 
      aria-label="Loading"
    />
  );
}

/**
 * LoadingDots - Animated dots for text loading states
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.5,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

export default LoadingState;
