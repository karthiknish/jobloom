"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyEmailInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, sendEmailVerification } = useFirebaseAuth();

  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'not_verified' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUrlComplete = search.get("redirect_url") || "/dashboard";

  useEffect(() => {
    // Check if user is already verified
    if (user) {
      if (user.emailVerified) {
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('not_verified');
      }
    } else {
      setVerificationStatus('error');
      setError('No authenticated user found');
    }
  }, [user]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace(`/welcome?redirect_url=${encodeURIComponent(redirectUrlComplete)}`);
  };

  if (verificationStatus === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md sm:max-w-lg space-y-8 relative z-10"
        >
          <Card className="card-premium-elevated border-0 bg-surface p-8">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
              <p className="text-center text-lg font-medium text-muted-foreground">Checking verification status...</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md sm:max-w-lg space-y-8 relative z-10"
        >
          <Card className="card-premium-elevated border-0 bg-surface p-8">
            <CardHeader className="space-y-4 text-center pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-green-600">Email verified!</CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Your email address has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center text-base text-muted-foreground">
                <p>You can now access all features of Hireall.</p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleContinue} className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base" size="lg">
                  Continue to Welcome
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md sm:max-w-lg space-y-8 relative z-10"
      >
        <Card className="card-premium-elevated border-0 bg-surface p-8">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4"
            >
              <Mail className="h-10 w-10 text-yellow-600" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gradient-premium">Verify your email</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              We sent a verification link to <strong className="text-foreground">{user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3"
              >
                <p className="text-sm font-medium text-destructive">{error}</p>
              </motion.div>
            )}

            <div className="text-center text-base text-muted-foreground space-y-4">
              <p>
                Click the verification link in the email to verify your account.
              </p>
              <p>
                Didn&apos;t receive the email? Check your spam folder or click below to resend.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="btn-premium w-full h-12 bg-surface border-2 hover:bg-muted/20 hover:border-primary/30 font-semibold text-base shadow-premium"
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Resend email</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleContinue} 
                  className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base"
                >
                  Continue to Welcome
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}