"use client";

import React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading";

interface SettingsHeaderProps {
  hasChanges: boolean;
  isLoading: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SettingsHeader({ hasChanges, isLoading, onSave, onReset }: SettingsHeaderProps) {
  const router = useRouter();

  return (
    <header className="surface-premium-elevated border-b border-border/50 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" label="Saving..." className="flex-row gap-2" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
