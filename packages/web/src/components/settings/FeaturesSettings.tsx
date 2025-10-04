"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Star, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumUpgradeBanner } from "@/components/dashboard/PremiumUpgradeBanner";

interface FeaturesSettingsProps {
  showBillingButton: boolean;
  billingPortalLoading: boolean;
  onBillingPortalClick: () => void;
}

export function FeaturesSettings({ showBillingButton, billingPortalLoading, onBillingPortalClick }: FeaturesSettingsProps) {
  const { plan } = useSubscription();
  const isPaidPlan = plan !== "free";

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

      <Card className="card-premium-elevated border-0 bg-surface">
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
              <Card className="card-premium border border-primary/20 bg-primary/5">
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
                        className="btn-premium gradient-primary font-semibold"
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
                <div>
                  <div className="font-medium text-foreground">Priority Support</div>
                  <div className="text-sm text-muted-foreground">
                    Get help when you need it most
                  </div>
                </div>
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
