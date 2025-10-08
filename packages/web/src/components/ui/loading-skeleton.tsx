"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  // Optional animation duration for skeleton component
  animationDuration?: number;
}

function Skeleton({ className, animationType = "pulse", ...props }: SkeletonProps) {
  const animationClass = animationType === "shimmer" ? "animate-shimmer" : "animate-pulse";
  
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        animationClass,
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "p-6 space-y-4 border border-border rounded-lg bg-background shadow-sm animate-shimmer",
        className
      )}
      {...props}
    >
      <div className="h-4 bg-muted rounded animate-pulse w-3/4 skeleton-shimmer" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2 skeleton-shimmer" />
      <div className="flex space-x-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded animate-pulse w-full skeleton-shimmer" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

function SkeletonText({ lines = 3, className, ...props }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = "default", className, ...props }: SkeletonProps & { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  );
}

function SkeletonButton({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24", className)} {...props} />;
}

function SkeletonInput({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-full", className)} {...props} />;
}

function SkeletonTable({ rows = 5, columns = 4, className, ...props }: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ items = 5, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonGrid({ items = 6, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          <Skeleton className="h-32 w-full rounded" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Job-specific skeleton components
function SkeletonJobCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "p-6 border border-border rounded-lg bg-background shadow-sm space-y-4 animate-shimmer",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse skeleton-shimmer" />
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse skeleton-shimmer" />
        <div className="h-6 w-14 rounded-full bg-muted animate-pulse skeleton-shimmer" />
      </div>
    </div>
  );
}

function SkeletonInterviewQuestion({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-6 border border-border rounded-lg bg-background shadow-sm space-y-4 animate-shimmer", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded-full bg-muted animate-pulse skeleton-shimmer" />
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse skeleton-shimmer" />
      </div>
      <div className="h-6 bg-muted rounded animate-pulse w-full skeleton-shimmer" />
      <div className="h-4 bg-muted rounded animate-pulse w-4/5 skeleton-shimmer" />
      <div className="flex space-x-2">
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse skeleton-shimmer" />
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse skeleton-shimmer" />
      </div>
    </div>
  );
}

// New enhanced shimmer skeleton components for better visibility
function SkeletonShimmer({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md animate-shimmer relative overflow-hidden",
        "after:absolute after:inset-0 after:bg-gradient-to-r",
        "after:from-transparent after:via-white/20 after:to-transparent",
        "after:animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  );
}

function SkeletonShimmerText({ lines = 3, className, ...props }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonShimmer
          key={i}
          className={cn(
            "h-4 bg-muted/50",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

function SkeletonShimmerCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "p-6 space-y-4 border border-border rounded-lg bg-background shadow-sm animate-shimmer",
        className
      )}
      {...props}
    >
      <SkeletonShimmer className="h-6 w-3/4 bg-muted/30" />
      <SkeletonShimmer className="h-4 w-1/2 bg-muted/30" />
      <div className="flex space-x-3">
        <SkeletonShimmer className="h-10 w-10 rounded-full bg-muted/30" />
        <div className="space-y-2 flex-1">
          <SkeletonShimmer className="h-4 w-full bg-muted/30" />
          <SkeletonShimmer className="h-4 w-2/3 bg-muted/30" />
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonTable,
  SkeletonList,
  SkeletonGrid,
  SkeletonJobCard,
  SkeletonInterviewQuestion,
  SkeletonShimmer,
  SkeletonShimmerText,
  SkeletonShimmerCard,
};
