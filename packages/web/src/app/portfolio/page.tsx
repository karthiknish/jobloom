"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

export default function PortfolioPage() {
  const { user } = useFirebaseAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access portfolio builder.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Resume Builder Moved</CardTitle>
                <CardDescription>Your resume editor, templates and export tools now live at /application.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <p>Your existing data is intact and accessible via the new page.</p>
                <p>
                  Continue editing here: <a href="/application" className="text-primary underline font-medium">/application</a>
                </p>
              </CardContent>
            </Card>
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>Manage public sections, case studies & media assets.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  This page will evolve to support curated public pages separate from resume content.
                </CardContent>
              </Card>
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}