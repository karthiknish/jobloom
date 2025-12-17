"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Crown, Star, Zap, Shield, Users, Loader2, HelpCircle } from "lucide-react";
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
      id: "free",
      name: "Free",
      price: 0,
      description: "Essential tools to start your job search journey.",
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
    },
    {
      id: "premium",
      name: "Premium",
      price: 5.99,
      description: "Everything you need to accelerate your job search.",
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
    },
  ];

  const faqs = [
    {
      question: "Can I cancel my subscription at any time?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. You will continue to have access to your plan's features until the end of your current billing period."
    },
    {
      question: "What happens if I upgrade my plan in the middle of the month?",
      answer: "If you upgrade your plan, the change will take effect immediately. You will be charged the prorated amount for the remainder of the month."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 7-day money-back guarantee for all new subscriptions. If you're not satisfied with our service, please contact our support team within 7 days of your purchase."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, all payments are processed securely through Stripe. We do not store your credit card information on our servers."
    }
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
          {plans.map((planData, index) => {
            const isCurrentPlan = plan === planData.id;
            return (
              <motion.div
                key={planData.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.6, duration: 0.5 }}
                className="h-full"
              >
                <Card
                  className={`h-full border-0 bg-card transition-all duration-300 flex flex-col ${
                    planData.popular
                      ? "ring-2 ring-primary shadow-xl scale-105 lg:scale-105 z-10"
                      : "hover:shadow-lg border border-border/50"
                  }`}
                >
                  {planData.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg border-0 text-sm font-medium">
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
                        <span className="text-4xl font-bold text-foreground">
                          £{planData.price}
                        </span>
                        {planData.price > 0 && (
                          <span className="text-muted-foreground ml-1">
                            /month
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-base">{planData.description}</CardDescription>
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
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-8">
                    <div className="w-full">
                      <Separator className="mb-6" />
                      {isCurrentPlan ? (
                        <Button disabled className="w-full h-12 font-semibold bg-muted text-muted-foreground" variant="secondary">
                          Current Plan
                        </Button>
                      ) : planData.id === "free" ? (
                        <Button variant="outline" disabled className="w-full h-12 font-semibold">
                          Current Plan
                        </Button>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="w-full h-12 font-bold text-base shadow-md hover:shadow-lg transition-all"
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
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison / Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-border/50 bg-card/30 backdrop-blur-sm rounded-xl px-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">Get immediate access to all premium features upon upgrading.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">Your payment information is encrypted and processed securely by Stripe.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Satisfaction Guaranteed</h3>
              <p className="text-sm text-muted-foreground">Join thousands of satisfied job seekers who found their dream job.</p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-24 max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our premium plans.</p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border/50 rounded-lg px-2">
                <AccordionTrigger className="text-left hover:no-underline px-4">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <div className="text-center text-sm text-muted-foreground mt-16 pb-8">
          <p>Prices are in GBP. Taxes may apply.</p>
          <p className="mt-2">Need help? <a href="mailto:support@hireall.app" className="text-primary hover:underline">Contact Support</a></p>
        </div>

      </div>
    </div>
  );
}
