"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Star, Zap, PlayCircle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/providers/subscription-provider";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";
import { dispatchUpgradeIntent } from "@/utils/upgradeIntent";
import { analytics } from "@/firebase/analytics";
import { useTourContext } from "@/providers/onboarding-tour-provider";

interface FeaturesSettingsProps {
  showBillingButton: boolean;
  billingPortalLoading: boolean;
  onBillingPortalClick: () => void;
}

export function FeaturesSettings({ showBillingButton, billingPortalLoading, onBillingPortalClick }: FeaturesSettingsProps) {
  const { plan } = useSubscription();
  const isPaidPlan = plan !== "free";
  const router = useRouter();
  const tour = useTourContext();

  const handleStartTour = () => {
    analytics.logFeatureUsed("onboarding_tour", "settings_help_section");
    router.push('/dashboard');
    setTimeout(() => {
      tour?.startDashboardTour?.();
    }, 500);
  };

  const handlePriorityUpgrade = () => {
    analytics.logFeatureUsed("priority_support_upgrade_cta", "settings_priority_support_row");
    const handled = dispatchUpgradeIntent({
      feature: "prioritySupport",
      title: "Priority Support",
      description: "Upgrade to Premium for 24h response times and dedicated support.",
      source: "settings_priority_support_row",
    });

    if (!handled) {
      router.push("/upgrade");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {!isPaidPlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PremiumUpgradeBanner className="shadow-premium-lg" />
        </motion.div>
      )}

      <Card variant="premium-elevated" className="border-0 bg-surface">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              {isPaidPlan && <Crown className="h-6 w-6 text-warning" />}
              Features & Plan
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Manage your subscription and access premium features
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Current Plan</h3>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                    {isPaidPlan ? <Crown className="h-6 w-6 text-white" /> : <Star className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground capitalize">{plan || 'Free'}</div>
                    <div className="text-sm text-muted-foreground">
                      {isPaidPlan ? 'Premium Plan' : 'Basic Features'}
                    </div>
                  </div>
                </div>
                <Badge variant={isPaidPlan ? "default" : "secondary"}>
                  {isPaidPlan ? "Active" : "Free"}
                </Badge>
              </div>
            </div>
          </motion.div>

          {showBillingButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card variant="premium" className="border border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Manage Billing</div>
                        <div className="text-sm text-muted-foreground">
                          Update payment method or cancel subscription
                        </div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={onBillingPortalClick}
                        disabled={billingPortalLoading}
                        variant="premium"
                        size="lg"
                        className="font-semibold"
                      >
                        {billingPortalLoading ? (
                          <>
                            <Star className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                            "Manage Billing"
                          )}
                        </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Premium Features</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Advanced ATS Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    In-depth resume scoring and optimization
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">Priority Support</div>
                  <div className="text-sm text-muted-foreground">
                    Get help when you need it most
                  </div>
                </div>
                {!isPaidPlan && (
                  <Button size="sm" variant="gradient-secondary" className="whitespace-nowrap" onClick={handlePriorityUpgrade}>
                    Upgrade
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Unlimited Analyses</div>
                  <div className="text-sm text-muted-foreground">
                    Analyze unlimited CVs per month
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Help & Onboarding Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Help & Onboarding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="premium" className="border border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <PlayCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Dashboard Tour</div>
                        <div className="text-sm text-muted-foreground">
                          Guide for job tracking
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        tour?.resetTour?.("dashboard");
                        router.push('/dashboard');
                        setTimeout(() => tour?.startDashboardTour?.(), 500);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                    >
                      Start Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="premium" className="border border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">CV Tools Tour</div>
                        <div className="text-sm text-muted-foreground">
                          Guide for AI CV tools
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        tour?.resetTour?.("cv_evaluator");
                        router.push('/career-tools');
                        setTimeout(() => tour?.startCvEvaluatorTour?.(), 500);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                    >
                      Start Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
