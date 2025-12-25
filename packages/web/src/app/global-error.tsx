"use client";

import "./globals.css";
import { useEffect } from "react";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { Button } from "@/components/ui/button";
import { errorTracking } from "@/lib/analytics/error-tracking";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
    void errorTracking.trackError(
      error,
      { digest: error.digest },
      {
        category: "server_error",
        severity: "critical",
        component: "global_error_boundary",
      }
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} bg-background text-foreground antialiased`}
      >
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="max-w-xl w-full text-center space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl font-semibold">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">We hit a snag</h1>
              <p className="text-muted-foreground">
                Something went wrong while loading HireAll. Try again below or head back home.
              </p>
              {error.digest ? (
                <p className="text-xs text-muted-foreground">Error code: {error.digest}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" asChild>
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
