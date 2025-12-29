"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, InputProps } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PasswordInputProps extends Omit<InputProps, "type"> {
  /** Label text for the input */
  label?: string;
  /** Initial visibility state */
  defaultVisible?: boolean;
  /** Whether to show the toggle button */
  showToggle?: boolean;
  /** Help text to show below the input */
  helpText?: string;
  /** Error message to display */
  error?: string;
}

/**
 * PasswordInput - Password field with visibility toggle
 * 
 * Features:
 * - Toggle button with clear icon and label
 * - Accessible with proper ARIA attributes
 * - Integrated label and error states
 * 
 * Usage:
 * <PasswordInput 
 *   label="Password"
 *   helpText="Must be at least 8 characters"
 *   error={errors.password}
 * />
 */
export function PasswordInput({
  label,
  defaultVisible = false,
  showToggle = true,
  helpText,
  error,
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const generatedId = React.useId();
  const inputId = id || `password-${generatedId}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={inputId}
          type={isVisible ? "text" : "password"}
          className={cn(
            "pr-12",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            [
              helpText ? helpId : null,
              error ? errorId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...props}
        />
        
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-muted-foreground hover:text-foreground"
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" aria-hidden="true" />
                <span className="text-xs">Hide</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                <span className="text-xs">Show</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      {helpText && !error && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-xs text-destructive font-medium flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export default PasswordInput;
