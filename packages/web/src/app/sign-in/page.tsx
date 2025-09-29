"use client";

import { Suspense, useEffect, useState } from "react";
import { Skeleton, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Chrome, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function SignInInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { signIn, signInWithGoogle, loading: authLoading } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const redirectUrlComplete = search.get("redirect_url") || "/dashboard";

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  // Real-time validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  // Auto-trigger Google sign-in if requested via query
  useEffect(() => {
    const qp = search;
    const provider = qp.get("provider");
    const googleFlag = qp.get("google");
    if (
      (provider === "google" || googleFlag === "1") &&
      typeof window !== "undefined"
    ) {
      (async () => {
        try {
          await signInWithGoogle();
          router.replace(redirectUrlComplete);
        } catch {
          // Ignore; user can use the button manually
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="w-full max-w-md sm:max-w-lg space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 mx-auto rounded-full" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-6">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-72 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-6">
              <SkeletonInput className="h-11" />
              <SkeletonInput className="h-11" />
              <SkeletonButton className="h-11 w-full" />
              <div className="relative my-6">
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-4 w-32 mx-auto -mt-2" />
              </div>
              <SkeletonButton className="h-11 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  async function handlePasswordSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Google sign-in failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-lg space-y-6"
      >
        {/* Logo and Branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center"
        >
          <Link href="/" className="inline-block">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <div className="relative w-full h-full bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Hireall</h1>
          <p className="text-muted-foreground mt-2">Your smart job search companion</p>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your Hireall account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <XIcon className="h-3 w-3 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Authentication Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handlePasswordSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={`pl-10 h-11 bg-muted/50 border-input focus:bg-background focus:border-primary focus:ring-primary transition-all ${emailError ? 'border-destructive focus:ring-destructive' : ''}`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    className={`pl-10 pr-10 h-11 bg-muted/50 border-input focus:bg-white focus:border-primary focus:ring-primary transition-all ${passwordError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-muted-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <span>Sign in</span>
                  </motion.div>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogle}
              className="w-full h-11 bg-background border-input hover:bg-muted/50 hover:border-border/80 font-medium shadow-sm transition-all duration-200"
              disabled={loading}
              size="lg"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-sm space-y-3 pt-4 border-t border-input">
              <div>
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <a
                  href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                  className="font-medium text-primary hover:underline transition-colors"
                >
                  Sign up
                </a>
              </div>
              <div>
                <Link
                  href={`/auth/forgot?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                  className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
