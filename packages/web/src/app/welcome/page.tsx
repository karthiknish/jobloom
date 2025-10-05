"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowRight, Sparkles, Target, Zap } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/3 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/3 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl space-y-8 relative z-10"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="space-y-6 text-center pb-8 pt-12 px-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
                Welcome to Hireall! 🎉
              </CardTitle>
              <CardDescription className="text-xl text-muted-foreground">
                Your account has been successfully verified
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-8 px-12 pb-12">
            {/* Welcome message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-lg text-muted-foreground">
                Hi <span className="font-semibold text-foreground">{user.displayName || user.email}</span>! 
                You're all set to start your job application journey.
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">Track Applications</h3>
                <p className="text-sm text-muted-foreground">Monitor all your job applications in one place</p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground">AI-Powered Tools</h3>
                <p className="text-sm text-muted-foreground">Resume analysis and cover letter generation</p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground">Browser Extension</h3>
                <p className="text-sm text-muted-foreground">Save jobs from any job board instantly</p>
              </div>
            </motion.div>

            {/* Main CTA - Dashboard Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <Button
                onClick={handleGoToDashboard}
                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
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
