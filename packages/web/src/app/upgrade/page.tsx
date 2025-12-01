"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, Zap, Shield, Users, Loader2 } from "lucide-react";
import { useSubscription } from "@/providers/subscription-provider";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/components/ui/Toast";

export default function UpgradePage() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { plan } = useSubscription();
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
      const response = await fetch("/api/stripe/create-checkout-session", {
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
        if (data.url) {
          showSuccess(`Redirecting to secure checkout for ${targetPlan} plan`);
          window.location.href = data.url;
        } else {
          showError("Unable to start checkout session. Please contact support.");
        }
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
      price: 5.99,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-8"
          >
            <Crown className="h-10 w-10" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-gradient-premium"
          >
            Upgrade to Premium
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground"
          >
            Unlock unlimited CV analyses, advanced analytics, and priority
            support to supercharge your job search.
          </motion.p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((planData, index) => (
            <motion.div
              key={planData.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.6, duration: 0.5 }}
              className="h-full"
            >
              <Card
                className={`h-full border-0 bg-surface transition-all duration-300 ${
                  planData.popular
                    ? "card-premium-elevated ring-2 ring-primary/20 shadow-premium-lg scale-105 lg:scale-105 z-10"
                    : "card-premium-elevated hover:shadow-premium-lg opacity-90 hover:opacity-100"
                }`}
              >
                {planData.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 shadow-lg border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {planData.name}
                  </CardTitle>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gradient-premium">
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

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-6 flex-1">
                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2" />
                        What&apos;s included:
                      </h4>
                      <ul className="space-y-3">
                        {planData.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start text-sm text-muted-foreground"
                          >
                            <div className="mr-3 mt-0.5 h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5 text-green-500" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {planData.limitations &&
                      planData.limitations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-4">
                            Limitations:
                          </h4>
                          <ul className="space-y-3">
                            {planData.limitations.map(
                              (limitation, limitationIndex) => (
                                <li
                                  key={limitationIndex}
                                  className="flex items-start text-sm text-muted-foreground/70"
                                >
                                  <span className="w-4 h-4 mr-3 flex-shrink-0 text-center text-muted-foreground">
                                    •
                                  </span>
                                  {limitation}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  <Separator className="my-8" />

                  <div className="text-center mt-auto">
                    {planData.current ? (
                      <Button disabled className="w-full h-12 font-semibold bg-muted text-muted-foreground">
                        Current Plan
                      </Button>
                    ) : planData.name === "Free" ? (
                      <Button variant="outline" disabled className="w-full h-12 font-semibold">
                        Current Plan
                      </Button>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full h-12 font-bold btn-premium gradient-primary hover:shadow-premium-xl text-base"
                          onClick={() => handleUpgrade("premium")}
                          disabled={isUpgrading}
                        >
                          {isUpgrading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Upgrading...
                            </>
                          ) : (
                            <>
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade to {planData.name}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
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
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-24"
        >
          <Card className="card-premium-elevated border-0 bg-surface overflow-hidden">
            <CardHeader className="text-center pb-8 pt-10">
              <CardTitle className="text-3xl font-bold text-gradient-premium">
                Why Choose Premium?
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-12 px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Unlimited Usage</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Analyze as many CVs as you need and track unlimited job
                    applications without restrictions.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Advanced Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get deep insights into your job search performance with
                    detailed analytics and trends.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Priority Support</h3>
                  <p className="text-muted-foreground leading-relaxed">
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
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-muted/30 rounded-2xl p-8 max-w-2xl mx-auto border border-border/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Questions?</h3>
            <p className="text-muted-foreground mb-8">
              Have questions about our premium features or need help choosing
              the right plan?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="h-11 px-6 border-primary/20 hover:bg-primary/5 hover:text-primary">Contact Support</Button>
              <Button variant="outline" className="h-11 px-6 border-primary/20 hover:bg-primary/5 hover:text-primary">View Demo</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
