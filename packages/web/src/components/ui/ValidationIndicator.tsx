"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

interface ValidationIndicatorProps {
  status: ValidationStatus;
  message?: string;
  className?: string;
  showOnlyOnValid?: boolean;
}

/**
 * Inline validation indicator that shows check/error icons
 * 
 * Usage:
 * ```tsx
 * <Input value={email} onChange={handleChange} />
 * <ValidationIndicator 
 *   status={emailValid ? "valid" : email ? "invalid" : "idle"} 
 *   message={emailError}
 * />
 * ```
 */
export function ValidationIndicator({ 
  status, 
  message,
  className,
  showOnlyOnValid = false,
}: ValidationIndicatorProps) {
  if (showOnlyOnValid && status !== "valid") return null;
  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        className={cn("flex items-center gap-1.5", className)}
      >
        {status === "validating" && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {status === "valid" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check className="h-4 w-4 text-green-600" />
          </motion.div>
        )}
        {status === "invalid" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        {message && status === "invalid" && (
          <span className="text-xs text-red-500">{message}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Input wrapper with integrated validation indicator
 */
export function ValidatedInputWrapper({
  children,
  status,
  message,
  className,
}: {
  children: React.ReactNode;
  status: ValidationStatus;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <ValidationIndicator status={status} message={message} showOnlyOnValid />
      </div>
      {status === "invalid" && message && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 mt-1"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Inline hint for optional but important fields
 */
export function InlineHint({
  children,
  variant = "info",
  className,
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning";
  className?: string;
}) {
  const variants = {
    info: {
      bg: "bg-blue-50 ",
      border: "border-blue-200 ",
      text: "text-blue-700 ",
      icon: "text-blue-500",
    },
    success: {
      bg: "bg-green-50 ",
      border: "border-green-200 ",
      text: "text-green-700 ",
      icon: "text-green-500",
    },
    warning: {
      bg: "bg-amber-50 ",
      border: "border-amber-200 ",
      text: "text-amber-700 ",
      icon: "text-amber-500",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg border text-sm",
        style.bg,
        style.border,
        style.text,
        className
      )}
    >
      <Info className={cn("h-4 w-4 mt-0.5 shrink-0", style.icon)} />
      <span>{children}</span>
    </div>
  );
}

/**
 * Common validation functions
 */
export const validators = {
  email: (value: string): ValidationStatus => {
    if (!value) return "idle";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "valid" : "invalid";
  },
  
  required: (value: string): ValidationStatus => {
    if (!value) return "idle";
    return value.trim().length > 0 ? "valid" : "invalid";
  },
  
  minLength: (min: number) => (value: string): ValidationStatus => {
    if (!value) return "idle";
    return value.length >= min ? "valid" : "invalid";
  },
  
  url: (value: string): ValidationStatus => {
    if (!value) return "idle";
    try {
      new URL(value);
      return "valid";
    } catch {
      return "invalid";
    }
  },
  
  phone: (value: string): ValidationStatus => {
    if (!value) return "idle";
    const phoneRegex = /^[\d\s\-+()]{7,}$/;
    return phoneRegex.test(value) ? "valid" : "invalid";
  },
};
