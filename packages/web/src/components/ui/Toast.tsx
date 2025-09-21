"use client";

import { Toaster, toast, ToastBar } from "react-hot-toast";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          border: "1px solid var(--color-border, #e4e4e7)",
          background: "var(--color-popover, #fff)",
          color: "var(--color-popover-foreground, #18181b)",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: "#fff"
          },
          style: {
            borderLeft: "4px solid #16a34a",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff"
          },
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },
        loading: {
          iconTheme: {
            primary: "#3b82f6",
            secondary: "#fff"
          },
          style: {
            borderLeft: "4px solid #3b82f6",
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
                <p className="text-sm font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

// Centralized toast functions with user-friendly messages
export const showSuccess = (message: string, _description?: string) => {
  return toast.success(message, {
    duration: 4000,
    icon: <CheckCircle className="h-5 w-5" />,
  });
};

export const showError = (message: string, _description?: string) => {
  return toast.error(message, {
    duration: 5000,
    icon: <AlertCircle className="h-5 w-5" />,
  });
};

export const showInfo = (message: string, _description?: string) => {
  return toast(message, {
    duration: 4000,
    icon: <Info className="h-5 w-5" />,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    icon: <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />,
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};


