"use client";

import * as React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Force light theme by removing any dark class and disabling automatic toggles
    try {
      document.documentElement.classList.remove("dark");
      // Optional: persist as light so any client code reading this stays consistent
      localStorage.setItem("theme", "light");
    } catch {}
  }, []);
  return <>{children}</>;
}
