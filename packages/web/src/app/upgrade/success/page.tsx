"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Crown, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/providers/subscription-provider";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { subscriptionApi } from "@/utils/api/subscription";
import { PageLoading } from "@/components/ui/PageLoading";

function UpgradeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const { user } = useFirebaseAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    const finalizeUpgrade = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        if (user) {
          await subscriptionApi.confirmUpgrade(sessionId);
        }
      } catch (error) {
        console.error("Error confirming subscription:", error);
      } finally {
        await refreshSubscription();
        setIsLoading(false);
      }
    };

    finalizeUpgrade();
  }, [searchParams, refreshSubscription, user]);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return <PageLoading message="Processing your subscription..." />;
  }

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
              <CheckCircle className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-bold sm:text-5xl lg:text-6xl"
            >
              Welcome to Premium!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 max-w-2xl mx-auto text-xl text-primary-foreground/90"
            >
              Your subscription has been activated successfully. You now have access to all premium features!
            </motion.p>
          </div>
        </div>
      </div>

      {/* Success Content */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Premium Features Now Available
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-green-700">Now Available</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Unlimited Resume analyses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Advanced analytics dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      CSV, JSON & PDF exports
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Custom job alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Priority support
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-blue-700 flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    What&apos;s Next
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                      Explore advanced analytics in your dashboard
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                      Set up custom job alerts
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                      Export your data in multiple formats
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                      Contact support for personalized advice
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center pt-6 border-t">
                <Button
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 text-lg"
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Your subscription will automatically renew. You can manage it anytime from your account settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading..." />}>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
