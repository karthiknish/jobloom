"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { errorTracking } from "@/lib/analytics/error-tracking";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
    void errorTracking.trackError(
      error,
      { digest: error.digest },
      {
        category: "client_error",
        severity: "high",
        component: "app_error_boundary",
      }
    );
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive text-lg font-semibold">
          !
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">
            The page had a hiccup. Try again or return to the dashboard.
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
  );
}
