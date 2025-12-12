"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/providers/subscription-provider";
import { Crown, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

interface PremiumUpgradeBannerProps {
  className?: string;
  compact?: boolean;
}

export function PremiumUpgradeBanner({ className = "", compact = false }: PremiumUpgradeBannerProps) {
  const { plan } = useSubscription();

  if (plan === 'premium') {
    return null; // Don't show for premium users
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-lg p-3 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Upgrade to Premium</span>
          </div>
          <Link href="/upgrade">
            <Button size="sm" className="bg-primary text-primary-foreground text-xs">
              Upgrade
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">Unlock Premium Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Get unlimited CV analyses, advanced analytics, and priority support
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:ml-2">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm">Unlimited CV Analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm">Advanced Analytics</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start lg:justify-end">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 w-fit"
              >
                £5.99/month
              </Badge>
              <Link href="/upgrade" className="w-full sm:w-auto">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
