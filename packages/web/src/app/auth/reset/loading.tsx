"use client";

import { SkeletonCard, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";

export default function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl space-y-6">
        <SkeletonCard className="border-0 shadow-xl bg-white/70 backdrop-blur">
          <div className="space-y-4">
            <SkeletonInput className="h-11" />
            <SkeletonInput className="h-11" />
            <SkeletonInput className="h-11" />
            <SkeletonButton className="h-11 w-full" />
          </div>
        </SkeletonCard>
      </div>
    </main>
  );
}

