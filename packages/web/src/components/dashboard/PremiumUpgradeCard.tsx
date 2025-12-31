"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/providers/subscription-provider";
import { Crown, Zap, TrendingUp, FileText, BarChart3, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PremiumUpgradeCardProps {
  className?: string;
  variant?: "default" | "compact" | "inline" | "floating";
  feature?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const featureMessages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  cvAnalysis: {
    title: "Unlimited CV Analysis",
    description: "Get unlimited AI-powered Resume reviews and ATS optimization tips",
    icon: <FileText className="h-5 w-5" />,
  },
  analytics: {
    title: "Advanced Analytics",
    description: "Track your job search performance with detailed insights",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  jobAlerts: {
    title: "Smart Job Alerts",
    description: "Get notified when jobs matching your criteria are posted",
    icon: <Zap className="h-5 w-5" />,
  },
  default: {
    title: "Unlock Premium Features",
    description: "Supercharge your job search with advanced tools",
    icon: <Crown className="h-5 w-5" />,
  },
};

export function PremiumUpgradeCard({
  className = "",
  variant = "default",
  feature = "default",
  dismissible = false,
  onDismiss,
}: PremiumUpgradeCardProps) {
  const { plan } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  if (plan === "premium" || isDismissed) {
    return null;
  }

  const featureInfo = featureMessages[feature] || featureMessages.default;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Inline variant - minimal, fits within other content
  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-full">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-amber-900">
            {featureInfo.title}
          </span>
        </div>
        <Link href="/upgrade">
          <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 text-xs">
            Upgrade
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Compact variant - smaller card for sidebars
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative ${className}`}
      >
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-white/70" />
          </button>
        )}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-secondary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <Badge className="bg-white/20 text-white text-xxs border-0">
                Premium
              </Badge>
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">
              {featureInfo.title}
            </h3>
            <p className="text-white/80 text-xs mb-3 line-clamp-2">
              {featureInfo.description}
            </p>
            <Link href="/upgrade" className="block">
              <Button size="sm" className="w-full bg-white text-primary hover:bg-white/90 text-xs font-semibold border border-primary/10">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Floating variant - for bottom-right corner prompts
  if (variant === "floating") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={`fixed bottom-6 right-6 z-50 max-w-sm ${className}`}
      >
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800">
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          )}
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                {featureInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">
                  {featureInfo.title}
                </h3>
                <p className="text-slate-300 text-sm mb-3">
                  {featureInfo.description}
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/upgrade">
                    <Button size="sm" className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 font-semibold">
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade
                    </Button>
                  </Link>
                  <span className="text-slate-400 text-xs">£5.99/month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default variant - full card for main content areas
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <Card className="overflow-hidden border-amber-200/50 bg-gradient-to-r from-amber-50/80 via-orange-50/80 to-amber-50/80">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-foreground">
                    Upgrade to Premium
                  </h3>
                  <Badge className="bg-amber-100 text-amber-700 text-xxs border-0">
                    Limited Offer
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Get unlimited Resume analyses, advanced analytics, priority support, and more to accelerate your job search.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Unlimited CV Analysis
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    Advanced Analytics
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
                    Priority Support
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Link href="/upgrade">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">
                Starting at £5.99/month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
