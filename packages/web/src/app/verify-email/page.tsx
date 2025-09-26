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
    router.replace(redirectUrlComplete);
  };

  if (verificationStatus === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">Checking verification status...</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4"
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-green-600">Email verified!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your email address has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>You can now access all features of Hireall.</p>
              </div>

              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4"
            >
              <Mail className="h-6 w-6 text-yellow-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription className="text-muted-foreground">
              We sent a verification link to <strong>{user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-md border border-red-200 bg-red-50 p-3"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="text-center text-sm text-muted-foreground space-y-4">
              <p>
                Click the verification link in the email to verify your account.
              </p>
              <p>
                Didn&apos;t receive the email? Check your spam folder or click below to resend.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend email
                  </>
                )}
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                Continue anyway
              </Button>
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