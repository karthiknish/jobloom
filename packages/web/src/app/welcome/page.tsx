"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles, Target, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function WelcomeInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useFirebaseAuth();

  const [redirectUrl] = useState(search.get("redirect_url") || "/dashboard");

  useEffect(() => {
    // If user is not authenticated, redirect to sign-in
    if (!user) {
      router.replace('/sign-in');
      return;
    }
  }, [user, router]);

  const handleGoToDashboard = () => {
    router.replace(redirectUrl);
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl space-y-8 relative z-10"
      >
        <Card className="card-premium-elevated border-0 bg-surface overflow-hidden">
          <CardHeader className="space-y-6 text-center pb-8 pt-12 px-8 sm:px-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary mb-6"
            >
              <CheckCircle className="h-12 w-12" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <CardTitle className="text-4xl font-bold text-gradient-premium mb-4">
                Welcome to Hireall!
              </CardTitle>
              <CardDescription className="text-xl text-muted-foreground">
                Your account has been successfully verified
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-10 px-8 sm:px-12 pb-12">
            {/* Welcome message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center"
            >
              <p className="text-lg text-muted-foreground">
                Hi <span className="font-semibold text-foreground">{user.displayName || user.email}</span>! 
                You&apos;re all set to start your job application journey.
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="text-center space-y-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-colors">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 dark:bg-blue-900/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground">Track Applications</h3>
                <p className="text-sm text-muted-foreground">Monitor all your job applications in one place</p>
              </div>
              <div className="text-center space-y-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-colors">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">AI-Powered Tools</h3>
                <p className="text-sm text-muted-foreground">Resume analysis and cover letter generation</p>
              </div>
              <div className="text-center space-y-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-colors">
                <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/10 dark:bg-purple-900/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-foreground">Browser Extension</h3>
                <p className="text-sm text-muted-foreground">Save jobs from any job board instantly</p>
              </div>
            </motion.div>

            {/* Main CTA - Dashboard Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-center pt-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleGoToDashboard}
                  className="btn-premium h-14 px-10 text-lg font-bold gradient-primary hover:shadow-premium-xl w-full sm:w-auto"
                  size="lg"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground mt-6">
                Start tracking your job applications and building your career
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeInner />
    </Suspense>
  );
}
