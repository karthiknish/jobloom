"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Text to show while loading (defaults to children) */
  loadingText?: string;
  /** Icon to show instead of spinner */
  loadingIcon?: React.ReactNode;
}

/**
 * LoadingButton - Button that automatically disables and shows spinner when loading
 * 
 * Features:
 * - Automatically disables when loading
 * - Shows spinner with optional custom text
 * - Prevents multiple clicks
 * 
 * Usage:
 * <LoadingButton loading={isSubmitting}>
 *   Save Changes
 * </LoadingButton>
 * 
 * <LoadingButton loading={isSubmitting} loadingText="Saving...">
 *   Save Changes
 * </LoadingButton>
 */
export function LoadingButton({
  loading = false,
  loadingText,
  loadingIcon,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        loading && "cursor-wait",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          {loadingIcon || (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export default LoadingButton;
