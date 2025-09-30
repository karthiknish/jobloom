"use client";

import type { ReactElement } from "react";
import { Toaster, toast, ToastBar } from "react-hot-toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const DEFAULT_DURATION = 4000;

type ToastKind = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastKind, ReactElement> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
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
          border: "1px solid var(--border)",
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "var(--card)"
          },
          style: {
            borderLeft: "4px solid var(--success)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--card)"
          },
          style: {
            borderLeft: "4px solid var(--destructive)",
          },
        },
        loading: {
          iconTheme: {
            primary: "var(--info)",
            secondary: "var(--card)"
          },
          style: {
            borderLeft: "4px solid var(--info)",
          },
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
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-relaxed">
                  {message}
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
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
  showStructuredToast("error", message, description);

export const showInfo = (message: string, description?: string) =>
  showStructuredToast("info", message, description);

export const showWarning = (message: string, description?: string) =>
  showStructuredToast("warning", message, description);

export const showLoading = (message: string) =>
  toast.loading(buildContent(message), {
    icon: (
      <div
        className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "var(--info)", borderTopColor: "transparent" }}
      />
    ),
  });

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

