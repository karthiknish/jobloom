"use client";

import { Skeleton, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md sm:max-w-lg space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 mx-auto rounded-full" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <SkeletonInput className="h-11" />
            <SkeletonInput className="h-11" />
            <SkeletonInput className="h-11" />
            <SkeletonButton className="h-11 w-full" />
            <div className="relative my-6">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-32 mx-auto -mt-2" />
            </div>
            <SkeletonButton className="h-11 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
