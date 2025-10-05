"use client";

import { Suspense, useEffect, useState } from "react";
import { Skeleton, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth, getLastAuthMethod } from "@/providers/firebase-auth-provider";
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
  const {
    signIn,
    signInWithGoogle,
    loading: authLoading,
    user,
    isInitialized,
    refreshToken,
  } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lastAuthMethod, setLastAuthMethod] = useState<string | null>(null);

  const redirectUrlComplete = search.get("redirect_url") || "/dashboard";

  // Get last used auth method
  useEffect(() => {
    const lastMethod = getLastAuthMethod();
    setLastAuthMethod(lastMethod);
  }, []);

  // Get auth method display info
  const getAuthMethodInfo = (method: string) => {
    switch (method) {
      case "google":
        return { icon: Chrome, label: "Google", color: "text-blue-600" };
      case "email":
        return { icon: Mail, label: "Email", color: "text-gray-600" };
      default:
        return { icon: Chrome, label: "Google", color: "text-blue-600" };
    }
  };

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
          await refreshToken();
          router.replace(redirectUrlComplete);
        } catch {
          // Ignore; user can use the button manually
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace(redirectUrlComplete);
    }
  }, [isInitialized, user, router, redirectUrlComplete]);

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
      await refreshToken();
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
    setLoading(true);
    try {
      await signInWithGoogle();
      await refreshToken();
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold text-gradient-premium">Welcome back</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-muted-foreground text-lg">
                Sign in to your Hireall account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-destructive/10 rounded-full flex items-center justify-center mt-0.5">
                  <XIcon className="h-3 w-3 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Authentication Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            <motion.form
              onSubmit={handlePasswordSignIn}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={`input-premium pl-12 h-12 ${emailError ? 'border-destructive focus:ring-destructive' : ''}`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive font-medium"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    className={`input-premium pl-12 pr-12 h-12 ${passwordError ? 'border-destructive focus:ring-destructive' : ''}`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground hover:text-primary transition-premium"
                    disabled={loading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </div>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive font-medium"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base"
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
                      <div className="flex items-center">
                        <span>Sign in</span>
                        {lastAuthMethod === "email" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2 flex items-center text-xs text-muted-foreground"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            <span>Last used</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={handleGoogle}
                className="btn-premium w-full h-12 bg-surface border-2 hover:bg-muted/20 hover:border-primary/30 font-semibold text-base shadow-premium hover:shadow-premium-lg"
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
                    <span>Redirecting to Google...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <div className="relative">
                      <Chrome className="mr-2 h-5 w-5" />
                      {lastAuthMethod === "google" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                          title="Last used method"
                        />
                      )}
                    </div>
                    <span>{lastAuthMethod === "google" ? "Continue with Google (Last used)" : "Continue with Google"}</span>
                  </motion.div>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center text-sm space-y-4 pt-6 border-t border-border/50"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <motion.a
                  href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                  className="font-semibold text-primary hover:text-primary/80 transition-premium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign up
                </motion.a>
              </div>
              <div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/auth/forgot?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                    className="text-muted-foreground hover:text-primary font-medium transition-premium inline-flex items-center gap-1"
                  >
                    Forgot your password?
                  </Link>
                </motion.div>
              </div>
            </motion.div>
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
