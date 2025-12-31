"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <div className="absolute inset-0 h-10 w-10 text-primary/20 animate-pulse rounded-full border-2 border-current"></div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default PageLoading;
