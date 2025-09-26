"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white">Portfolio Builder</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl">
            Create stunning portfolio websites to showcase your work and attract opportunities.
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <div className="max-w-4xl mx-auto">
            {/* Portfolio Builder Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Advanced Portfolio Builder</CardTitle>
                  <CardDescription className="text-base">
                    Create professional portfolio websites with custom templates, sections, and themes.
                    Perfect for showcasing your work, projects, and professional journey.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild size="lg" className="px-8 py-3">
                    <a href="/portfolio-builder">
                      Start Building Your Portfolio
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: "🎨",
                  title: "Custom Templates",
                  description: "Choose from professional templates designed for different careers"
                },
                {
                  icon: "📱",
                  title: "Mobile Responsive",
                  description: "Your portfolio looks great on all devices and screen sizes"
                },
                {
                  icon: "🚀",
                  title: "Fast & SEO Ready",
                  description: "Optimized performance with built-in SEO tools"
                },
                {
                  icon: "🔧",
                  title: "Easy Customization",
                  description: "Customize colors, fonts, layouts, and content with our intuitive editor"
                },
                {
                  icon: "📊",
                  title: "Analytics Integration",
                  description: "Track visits and engagement with integrated analytics"
                },
                {
                  icon: "🔒",
                  title: "Privacy Controls",
                  description: "Control who can view your portfolio with password protection"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-4">{feature.icon}</div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Resume Builder Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-12"
            >
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resume Builder
                  </CardTitle>
                  <CardDescription>
                    Need to update your resume? Our resume builder is available at /application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <a href="/application" className="inline-flex items-center">
                      Go to Resume Builder
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}