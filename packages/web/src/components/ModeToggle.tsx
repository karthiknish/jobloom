"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";

export function ModeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const current = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setIsDark(current === "dark");
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setIsDark(next === "dark");
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
