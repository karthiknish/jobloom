"use client";

import { ReactNode } from "react";
import { AppToaster } from "@/components/ui/Toast";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
