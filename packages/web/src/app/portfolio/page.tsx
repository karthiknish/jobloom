"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Smartphone,
  Rocket,
  Settings,
  BarChart3,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Helper to get icon component by name
const getFeatureIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    palette: Palette,
    smartphone: Smartphone,
    rocket: Rocket,
    settings: Settings,
    "bar-chart": BarChart3,
    lock: Lock,
  };
  return icons[iconName] || Palette;
};

export default function PortfolioPage() {
  const { user } = useFirebaseAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
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
        className="bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-xl"
      >
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">Portfolio Builder</h1>
            <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-3xl leading-relaxed">
              Create stunning portfolio websites to showcase your work and attract opportunities
            </p>
          </div>
        </div>
      </motion.div>

       {/* Main Content */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <div className="max-w-4xl mx-auto">
            {/* Portfolio Builder Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-muted/20 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl sm:text-4xl font-bold">
                    Advanced Portfolio Builder
                  </CardTitle>
                  <CardDescription className="text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
                    Create professional portfolio websites with custom templates, sections, and themes. Perfect for showcasing your work, projects, and professional journey.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button asChild size="lg" className="px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                    <a href="/portfolio-builder">
                      Start Building Your Portfolio
                      <svg
                        className="ml-3 w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
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
              className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: "palette",
                  title: "Custom Templates",
                  description:
                    "Choose from professional templates designed for different careers and industries",
                },
                {
                  icon: "smartphone",
                  title: "Mobile Responsive",
                  description:
                    "Your portfolio looks perfect on all devices and screen sizes",
                },
                {
                  icon: "rocket",
                  title: "Fast & SEO Ready",
                  description: "Lightning-fast performance with built-in SEO optimization",
                },
                {
                  icon: "settings",
                  title: "Easy Customization",
                  description:
                    "Customize colors, fonts, layouts, and content with our intuitive editor",
                },
                {
                  icon: "bar-chart",
                  title: "Analytics Integration",
                  description:
                    "Track visits and engagement with integrated analytics tools",
                },
                {
                  icon: "lock",
                  title: "Privacy Controls",
                  description:
                    "Control who can view your portfolio with password protection",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-[1.02]">
                    <CardContent className="p-8 text-center">
                      <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                          {(() => {
                            const Icon = getFeatureIcon(feature.icon);
                            return <Icon className="w-8 h-8 text-primary" />;
                          })()}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
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
              className="mt-16"
            >
              <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-muted/20 to-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    Resume Builder
                  </CardTitle>
                  <CardDescription className="text-base">
                    Need to update your resume? Our professional resume builder is available at /application
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                    <a href="/application" className="inline-flex items-center">
                      Go to Resume Builder
                      <svg
                        className="ml-3 w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
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