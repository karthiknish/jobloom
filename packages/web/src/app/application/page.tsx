"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to the consolidated Career Tools page
export default function ApplicationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/career-tools");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to Career Tools...</p>
    </div>
  );
}
