"use client";

import type { ReactElement } from "react";
import { Toaster, toast, ToastBar } from "react-hot-toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_ERROR_MESSAGE = "We couldn't complete that request. Please try again.";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "You closed the sign-in window before it finished.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/cancelled-popup-request": "Another sign-in is already in progress.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment before trying again.",
  "auth/user-disabled": "Your account has been disabled. Contact support for help.",
  "auth/user-not-found": "We couldn't find an account with those details.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "firestore/permission-denied": "You don't have permission to perform that action.",
  "firestore/not-found": "We couldn't find the data you requested.",
  "firestore/unavailable": "The service is temporarily unavailable. Please try again shortly.",
};

const sanitizeMessage = (message?: string): string => {
  if (!message) return DEFAULT_ERROR_MESSAGE;

  const trimmed = message.trim();

  // If message includes a Firebase prefix, remove it and map friendly text
  if (/^firebase:/i.test(trimmed)) {
    let withoutPrefix = trimmed.replace(/^firebase:\s*/i, "").trim();
    withoutPrefix = withoutPrefix.replace(/^error\s*/i, "").trim();

    const codeMatch = withoutPrefix.match(/\(([^)]+)\)/);
    if (codeMatch?.[1]) {
      const code = codeMatch[1];
      if (ERROR_CODE_MESSAGES[code]) {
        return ERROR_CODE_MESSAGES[code];
      }
    }

    // Remove any remaining code notation like (auth/xxx)
    withoutPrefix = withoutPrefix.replace(/\([^)]*\)/g, "").trim();
    if (withoutPrefix) {
      return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
    }
    return DEFAULT_ERROR_MESSAGE;
  }

  return trimmed;
};

const DEFAULT_DURATION = 4000;

type ToastKind = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastKind, ReactElement> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-sky-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
};

const DURATIONS: Record<ToastKind, number> = {
  success: DEFAULT_DURATION,
  info: DEFAULT_DURATION,
  warning: 5000,
  error: 6000,
};

const buildContent = (title: string, description?: string) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm font-medium leading-relaxed">{title}</span>
    {description && (
      <span className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </span>
    )}
  </div>
);

const showStructuredToast = (
  kind: ToastKind,
  title: string,
  description?: string
) =>
  toast(buildContent(title, description), {
    duration: DURATIONS[kind],
    icon: ICONS[kind],
  });

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          border: "none",
          background: "transparent",
          color: "inherit",
          padding: "0",
          borderRadius: "0",
          boxShadow: "none",
          maxWidth: "400px",
          width: "100%",
        },
      }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            ...t.style,
            animation: t.visible
              ? "slideInFromRight 0.3s ease-out"
              : "slideOutToRight 0.3s ease-in",
          }}
        >
          {({ icon, message }) => (
            <div className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border ${
              t.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
              t.type === 'error' ? 'bg-red-50 border-red-200' :
              (t.type as any) === 'warning' ? 'bg-amber-50 border-amber-200' :
              'bg-sky-50 border-sky-200'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                <div className={`p-1 rounded-full ${
                  t.type === 'success' ? 'bg-emerald-100' :
                  t.type === 'error' ? 'bg-red-100' :
                  (t.type as any) === 'warning' ? 'bg-amber-100' :
                  'bg-sky-100'
                }`}>
                  {icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium leading-relaxed ${
                  t.type === 'success' ? 'text-emerald-900' :
                  t.type === 'error' ? 'text-red-900' :
                  (t.type as any) === 'warning' ? 'text-amber-900' :
                  'text-sky-900'
                }`}>
                  {message}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toast.dismiss(t.id)}
                className={
                  t.type === 'success'
                    ? 'text-emerald-600 hover:bg-emerald-100'
                    : t.type === 'error'
                    ? 'text-red-600 hover:bg-red-100'
                    : (t.type as any) === 'warning'
                    ? 'text-amber-600 hover:bg-amber-100'
                    : 'text-sky-600 hover:bg-sky-100'
                }
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

// Centralized toast functions with user-friendly messages
export const showSuccess = (message: string, description?: string) =>
  showStructuredToast("success", message, description);

export const showError = (message: string, description?: string) =>
  showStructuredToast("error", sanitizeMessage(message), description ? sanitizeMessage(description) : undefined);

export const showInfo = (message: string, description?: string) =>
  showStructuredToast("info", message, description);

export const showWarning = (message: string, description?: string) =>
  showStructuredToast("warning", message, description);

export const showLoading = (message: string) =>
  toast.loading(buildContent(message), {
    icon: (
      <div
        className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin border-sky-600"
        style={{ borderTopColor: "transparent" }}
      />
    ),
  });

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

