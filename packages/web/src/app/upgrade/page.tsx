"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, Zap, Shield, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/components/ui/Toast";

export default function UpgradePage() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { plan, refreshSubscription } = useSubscription();
  const { user } = useFirebaseAuth();
  const router = useRouter();

  const handleUpgrade = async (targetPlan: string) => {
    if (!user) {
      showError("Please sign in to upgrade");
      router.push("/sign-in");
      return;
    }

    if (plan === targetPlan) {
      showError("You're already on this plan");
      return;
    }

    setIsUpgrading(true);
    try {
      // For now, simulate upgrade - Stripe integration coming soon
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          plan: targetPlan,
          billingCycle: "monthly",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          `Successfully upgraded to ${targetPlan} plan! (Stripe integration coming soon)`
        );
        await refreshSubscription();
        router.push("/upgrade/success");
      } else {
        const error = await response.json();
        showError(error.error || "Failed to upgrade subscription");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      showError("Failed to upgrade subscription. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      description: "Perfect for getting started",
      features: [
        "3 CV analyses per month",
        "50 job applications",
        "CSV export",
        "Basic dashboard",
        "Chrome extension access",
      ],
      limitations: [
        "Limited analytics",
        "No priority support",
        "No custom alerts",
      ],
      popular: false,
      current: plan === "free",
    },
    {
      name: "Premium",
      price: 9.99,
      description: "Everything you need to accelerate your job search",
      features: [
        "Unlimited CV analyses",
        "Unlimited job applications",
        "Advanced analytics & insights",
        "CSV, JSON & PDF exports",
        "Custom job alerts",
        "Priority support",
        "Team collaboration tools",
        "AI-powered recommendations",
        "Professional templates",
      ],
      popular: true,
      current: plan === "premium",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary/80 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6"
            >
              <Crown className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-bold sm:text-5xl lg:text-6xl"
            >
              Upgrade to Premium
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 max-w-2xl mx-auto text-xl text-primary-foreground/90"
            >
              Unlock unlimited CV analyses, advanced analytics, and priority
              support to supercharge your job search.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((planData, index) => (
            <motion.div
              key={planData.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card
                className={`relative h-full ${
                  planData.popular
                    ? "ring-2 ring-primary shadow-xl"
                    : "shadow-md"
                }`}
              >
                {planData.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">
                    {planData.name}
                  </CardTitle>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        £{planData.price}
                      </span>
                      {planData.price > 0 && (
                        <span className="text-muted-foreground ml-1">
                          /month
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">{planData.description}</p>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        What&apos;s included:
                      </h4>
                      <ul className="space-y-2">
                        {planData.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center text-sm"
                          >
                            <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {planData.limitations &&
                      planData.limitations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">
                            Limitations:
                          </h4>
                          <ul className="space-y-2">
                            {planData.limitations.map(
                              (limitation, limitationIndex) => (
                                <li
                                  key={limitationIndex}
                                  className="flex items-center text-sm text-muted-foreground"
                                >
                                  <span className="w-4 h-4 mr-3 flex-shrink-0 text-center">
                                    •
                                  </span>
                                  {limitation}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    <Separator className="my-6" />

                    <div className="text-center">
                      {planData.current ? (
                        <Button disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : planData.name === "Free" ? (
                        <Button variant="outline" disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                          onClick={() => handleUpgrade("premium")}
                          disabled={isUpgrading}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          {isUpgrading
                            ? "Upgrading..."
                            : `Upgrade to ${planData.name}`}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Why Choose Premium?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Unlimited Usage</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze as many CVs as you need and track unlimited job
                    applications without restrictions.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Get deep insights into your job search performance with
                    detailed analytics and trends.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Priority Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Get faster responses and dedicated support from our career
                    experts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-muted/30 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Have questions about our premium features or need help choosing
              the right plan?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">Contact Support</Button>
              <Button variant="outline">View Demo</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
