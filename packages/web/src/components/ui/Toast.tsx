"use client";

import { Toaster, toast, ToastBar } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          border: "1px solid var(--color-border, #e4e4e7)",
          background: "var(--color-popover, #fff)",
          color: "var(--color-popover-foreground, #18181b)",
        },
        success: {
          iconTheme: { primary: "#16a34a", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} />
      )}
    </Toaster>
  );
}

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showInfo = (message: string) => toast(message);


