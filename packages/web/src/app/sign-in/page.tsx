"use client";

import { Suspense, useEffect, useState } from "react";
import { AuthSkeleton } from "@/components/auth/AuthSkeletons";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth, getLastAuthMethod } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Chrome, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { animations } from "@/styles/animations";

function SignInInner() {
  const router = useRouter();
  const search = useSearchParams();
  const {
    signIn,
    signInWithGoogle,
    signInWithGoogleRedirect,
    loading: authLoading,
    user,
    isInitialized,
    refreshToken,
  } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lastAuthMethod, setLastAuthMethod] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const isLoading = authLoading || isSubmitting;
  const { toast } = useToast();

  const fromExtension = search.get("from") === "extension";
  const redirectUrlComplete = search.get("redirect_url") || "/dashboard";

  // Get last used auth method and remember me preference
  useEffect(() => {
    const lastMethod = getLastAuthMethod();
    setLastAuthMethod(lastMethod);
    // Load remember me preference from localStorage
    const savedRememberMe = localStorage.getItem("hireall-remember-me");
    if (savedRememberMe !== null) {
      setRememberMe(savedRememberMe === "true");
    }
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
    if (email.length > 254) return "Email address is too long";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password.length > 128) return "Password is too long";
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return "Please choose a stronger password";
    }
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
    if (typeof window === "undefined") return;

    const providerParam = search.get("provider");
    const googleFlag = search.get("google");
    const shouldTriggerGoogle =
      providerParam === "google" || googleFlag === "1";

    if (!shouldTriggerGoogle) {
      return;
    }

    setIsSubmitting(true);

    (async () => {
      try {
        // Use popup auth for both extension and regular flows for smoother experience
        await signInWithGoogle();
        await refreshToken();
        router.replace(redirectUrlComplete);
      } catch (err) {
        console.error("Auto-sign-in error:", err);
        setIsSubmitting(false);
      }
    })();
  }, [redirectUrlComplete, refreshToken, router, search, signInWithGoogle]);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace(redirectUrlComplete);
    }
  }, [isInitialized, user, router, redirectUrlComplete]);

  if (authLoading) {
    return <AuthSkeleton />;
  }

  async function handlePasswordSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Store remember me preference
      localStorage.setItem("hireall-remember-me", String(rememberMe));
      await signIn(email, password);
      await refreshToken();
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Surface errors via toast for consistent messaging
      const message = (() => {
        switch (error.code) {
          case 'auth/user-not-found':
            return "No account found with this email address";
          case 'auth/wrong-password':
            return "Incorrect password. Please try again";
          case 'auth/too-many-requests':
            return "Too many failed attempts. Please try again later or reset your password";
          case 'auth/user-disabled':
            return "This account has been disabled. Please contact support";
          case 'auth/invalid-email':
            return "Invalid email address format";
          case 'auth/network-request-failed':
            return "Network error. Please check your connection and try again";
          default:
            return error?.message || "Sign in failed. Please try again";
        }
      })();

      toast({
        variant: "destructive",
        title: "Authentication error",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setIsSubmitting(true);
    try {
      // Store remember me preference for Google sign-in too
      localStorage.setItem("hireall-remember-me", String(rememberMe));
      await signInWithGoogle();
      await refreshToken();
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const message = (() => {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            return "Sign-in popup was closed before completion";
          case 'auth/popup-blocked':
            return "Sign-in popup was blocked by your browser. Please allow popups";
          case 'auth/cancelled-popup-request':
            return "Sign-in was cancelled";
          case 'auth/network-request-failed':
            return "Network error. Please check your connection and try again";
          default:
            return error?.message || "Google sign-in failed. Please try again";
        }
      })();

      toast({
        variant: "destructive",
        title: "Authentication error",
        description: message,
      });
      setIsSubmitting(false);
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animations.duration.slow }}
        className="w-full max-w-md sm:max-w-lg space-y-8 relative z-10"
      >
    
        <Card variant="premium-elevated" className="bg-surface p-8">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: animations.duration.normal, delay: 0.1 }}
            >
              <CardTitle className="text-3xl font-bold text-gradient-premium">Welcome back</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: animations.duration.normal, delay: 0.2 }}
            >
              <CardDescription className="text-muted-foreground text-lg">
                Sign in to your Hireall account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.form
              onSubmit={handlePasswordSignIn}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: animations.duration.normal, delay: 0.3 }}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground cursor-pointer select-none flex items-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Keep me signed in
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                variant="premium"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center">
                      <span>Sign in</span>
                      {lastAuthMethod === "email" && (
                        <div className="ml-2 flex items-center text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">
                          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                          <span>Last used</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Button>
            </motion.form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <Button
              variant="gradient-secondary"
              onClick={handleGoogle}
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Redirecting to Google...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <Chrome className="mr-2 h-5 w-5" />
                    {lastAuthMethod === "google" && (
                      <div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                        title="Last used method"
                      />
                    )}
                  </div>
                  <span>{lastAuthMethod === "google" ? "Continue with Google (Last used)" : "Continue with Google"}</span>
                </div>
              )}
            </Button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: animations.duration.normal, delay: 0.4 }}
              className="text-center text-sm space-y-4 pt-6 border-t border-border/50"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link
                  href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors duration-fast"
                >
                  Sign up
                </Link>
              </div>
              <div>
                <Link
                  href={`/auth/forgot?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-fast inline-flex items-center gap-1"
                >
                  Forgot your password?
                </Link>
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
