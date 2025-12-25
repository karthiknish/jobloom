"use client";

// components/UpgradePrompt.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Database,
  Zap,
  Bell,
  FileText,
  Target,
  TrendingUp,
  Lightbulb,
  Save,
  Sparkles,
  Users,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/providers/subscription-provider";
import { SUBSCRIPTION_LIMITS } from "@/types/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Helper to get icon component by name
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    "bar-chart": BarChart3,
    bot: Bot,
    database: Database,
    zap: Zap,
    bell: Bell,
    "file-text": FileText,
    target: Target,
    "trending-up": TrendingUp,
    lightbulb: Lightbulb,
    save: Save,
    sparkles: Sparkles,
    users: Users,
    "file-check": FileCheck,
  };
  return icons[iconName] || FileText;
};

const FEATURES = [
  {
    title: "Advanced Analytics",
    description:
      "Get detailed insights into your job search progress and success rates",
    icon: "bar-chart",
  },
  {
    title: "AI-Powered Recommendations",
    description:
      "Receive personalized job recommendations based on your profile",
    icon: "bot",
  },
  {
    title: "Priority Support",
    description: "Get faster responses from our dedicated support team",
    icon: "zap",
  },
  {
    title: "Custom Alerts",
    description: "Set up custom job alerts for specific companies or roles",
    icon: "bell",
  },
];

export function UpgradePrompt({ feature, variant = "default" }: UpgradePromptProps) {
  const [isHovered, setIsHovered] = useState(false);
  useSubscription();

  // Define feature-specific messaging
  const getFeatureSpecificContent = () => {
    switch (feature) {
      case "cvAnalysesPerMonth":
        return {
          title: "Unlock Unlimited CV Analysis",
          description:
            "Get detailed insights into your resume with unlimited CV analyses and personalized improvement suggestions.",
          highlightFeatures: [
            {
              title: "Unlimited CV Analyses",
              description: "Analyze as many resumes as you need",
              icon: "file-text",
            },
            {
              title: "AI-Powered Insights",
              description:
                "Get detailed feedback on content, structure, and ATS compatibility",
              icon: "bot",
            },
            {
              title: "Industry-Specific Advice",
              description: "Tailored recommendations for your target industry",
              icon: "target",
            },
          ],
        };
      case "advancedAnalytics":
        return {
          title: "Advanced Analytics & Insights",
          description:
            "Transform your job search data into actionable insights with comprehensive analytics and reporting.",
          highlightFeatures: [
            {
              title: "Detailed Analytics Dashboard",
              description:
                "Track application success rates, response times, and trends",
              icon: "bar-chart",
            },
            {
              title: "Custom Reports",
              description:
                "Generate personalized reports on your job search progress",
              icon: "trending-up",
            },
            {
              title: "Performance Insights",
              description:
                "AI-powered recommendations to improve your job search strategy",
              icon: "lightbulb",
            },
          ],
        };
      case "exportFormats":
        return {
          title: "Premium Export Options",
          description:
            "Export your data in professional formats including PDF reports and JSON for advanced analysis.",
          highlightFeatures: [
            {
              title: "PDF Reports",
              description:
                "Generate beautiful, shareable PDF reports of your job search",
              icon: "file-text",
            },
            {
              title: "JSON Export",
              description:
                "Export all your data in JSON format for backup and analysis",
              icon: "database",
            },
            {
              title: "Professional Templates",
              description:
                "Access premium templates for reports and presentations",
              icon: "Sparkles",
            },
          ],
        };
      case "prioritySupport":
        return {
          title: "Priority Support & Coaching",
          description:
            "Get direct access to our career experts and priority support for faster response times.",
          highlightFeatures: [
            {
              title: "Priority Support",
              description: "Get responses within 24 hours from our expert team",
              icon: "zap",
            },
            {
              title: "Career Coaching",
              description: "1-on-1 sessions with experienced career counselors",
              icon: "users",
            },
            {
              title: "Resume Reviews",
              description:
                "Professional resume reviews and optimization advice",
              icon: "file-check",
            },
          ],
        };
      case "customAlerts":
        return {
          title: "Smart Job Alerts",
          description:
            "Set up intelligent job alerts that notify you of relevant opportunities based on your preferences.",
          highlightFeatures: [
            {
              title: "Custom Alerts",
              description:
                "Create personalized job alerts for specific companies and roles",
              icon: "bell",
            },
            {
              title: "Smart Filtering",
              description:
                "AI-powered filtering to surface the best opportunities",
              icon: "target",
            },
            {
              title: "Real-time Notifications",
              description:
                "Instant notifications when new jobs match your criteria",
              icon: "zap",
            },
          ],
        };
      default:
        return {
          title: "Unlock Premium Features",
          description:
            "Upgrade to Hireall Premium and access all advanced features to accelerate your job search.",
          highlightFeatures: FEATURES,
        };
    }
  };

  const content = getFeatureSpecificContent();

  return (
    <div
      className={cn(
        variant === "dialog" ? "w-full" : "max-w-4xl mx-auto p-6"
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-sm">
          <CardContent
            className={cn(
              "p-8",
              variant === "dialog" && "p-5 sm:p-6"
            )}
          >
            {variant !== "dialog" && (
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                  {content.title}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  {content.description}
                </p>
              </div>
            )}

            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6",
                variant === "dialog" ? "mb-5 sm:mb-6" : "mb-8"
              )}
            >
              {content.highlightFeatures.map((feature, index) => (
                <motion.div key={index} whileHover={{ y: -5 }}>
                  <Card className="bg-background border-border h-full">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        {(() => {
                          const Icon = getIcon(feature.icon);
                          return <Icon className="h-8 w-8 text-primary" />;
                        })()}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/upgrade">
                  <Button
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl text-lg"
                    size="lg"
                  >
                    {isHovered ? "Upgrade Now" : "Upgrade to Premium"}
                  </Button>
                </Link>
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">
                7-day free trial • Cancel anytime • $5.99/month
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

interface FeatureGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  requires?: boolean | number | string | Array<string | number>;
}

export function FeatureGate({
  children,
  feature,
  fallback,
  showUpgradePrompt = true,
  requires,
}: FeatureGateProps) {
  const { hasFeature, isLoading } = useSubscription();

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded-lg p-4">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
      </div>
    );
  }

  // Check if feature is available
  if (feature) {
    const isFeatureAvailable = hasFeature(
      feature as keyof typeof SUBSCRIPTION_LIMITS.free,
      requires
    );

    if (!isFeatureAvailable) {
      if (fallback) {
        return <>{fallback}</>;
      }

      if (showUpgradePrompt) {
        return (
          <div className="space-y-4">
            <UpgradePrompt feature={feature} />
          </div>
        );
      }

      return null;
    }
  }

  return <>{children}</>;
}

interface UpgradePromptProps {
  feature?: string;
  variant?: "default" | "dialog";
}
