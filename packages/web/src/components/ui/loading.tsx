"use client";

import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl";
  variant?: "spinner" | "refresh" | "dots" | "native";
  label?: string;
  inline?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = "default", variant = "spinner", label, inline = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    };

    // Native shadcn spinner variant
    if (variant === "native") {
      return (
        <div
          ref={ref}
          className={cn(
            inline ? "inline-flex" : "flex flex-col",
            "items-center justify-center gap-2",
            className
          )}
          {...props}
        >
          <Spinner className={cn(sizeClasses[size])} />
          {label && (
            <span className={cn(
              "text-muted-foreground font-medium",
              inline ? "text-xs ml-1.5" : "text-sm"
            )}>
              {label}
            </span>
          )}
        </div>
      );
    }

    const Icon = variant === "refresh" ? RefreshCw : Loader2;

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn(
            inline ? "inline-flex" : "flex",
            "items-center justify-center space-x-1",
            className
          )}
          {...props}
        >
          <div className={cn("animate-bounce rounded-full bg-primary", size === "sm" ? "h-1 w-1" : "h-2 w-2")} style={{ animationDelay: "0ms" }} />
          <div className={cn("animate-bounce rounded-full bg-primary", size === "sm" ? "h-1 w-1" : "h-2 w-2")} style={{ animationDelay: "150ms" }} />
          <div className={cn("animate-bounce rounded-full bg-primary", size === "sm" ? "h-1 w-1" : "h-2 w-2")} style={{ animationDelay: "300ms" }} />
          {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          inline ? "inline-flex" : "flex flex-col",
          "items-center justify-center gap-2",
          className
        )}
        {...props}
      >
        <Icon className={cn("animate-spin text-primary", sizeClasses[size])} />
        {label && (
          <span className={cn(
            "text-muted-foreground font-medium",
            inline ? "text-xs ml-1.5" : "text-sm"
          )}>
            {label}
          </span>
        )}
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingPageProps extends LoadingProps {
  fullHeight?: boolean;
}

const LoadingPage = ({ className, fullHeight = true, ...props }: LoadingPageProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-full",
        fullHeight ? "min-h-[60vh]" : "py-12",
        className
      )}
    >
      <LoadingSpinner size="lg" {...props} />
    </div>
  );
};

const LoadingOverlay = ({ className, ...props }: LoadingProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[1px]",
        className
      )}
    >
      <LoadingSpinner {...props} />
    </div>
  );
};

export { LoadingSpinner, LoadingPage, LoadingOverlay };
