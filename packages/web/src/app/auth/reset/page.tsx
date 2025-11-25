"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";
import { showError, showSuccess } from "@/components/ui/Toast";

type ViewState = "form" | "success" | "invalid" | "expired";

const PASSWORD_VALIDATION = {
  minLength: 8,
};

function validatePassword(password: string) {
  if (!password || password.length < PASSWORD_VALIDATION.minLength) {
    return `Password must be at least ${PASSWORD_VALIDATION.minLength} characters`;
  }
  return null;
}

async function requestPasswordReset(email: string, redirectUrl?: string) {
  const res = await fetch("/api/auth/password/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, redirectUrl }),
  });
  return res.json();
}

async function resetPasswordRequest(token: string, password: string) {
  const res = await fetch("/api/auth/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return res.json();
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>("form");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const token = searchParams?.get("token") || "";
  const initialEmail = searchParams?.get("email") || "";
  const redirect = searchParams?.get("redirect_url") || "/sign-in";

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setEmailError(null);
    }
  }, [initialEmail]);

  const isTokenMode = useMemo(() => Boolean(token), [token]);

  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email";
    return null;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword && value !== confirmPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError(null);
    }
  };

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    if (password && value !== password) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError(null);
    }
  };

  const submitResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailErr = validateEmail(email.trim());
    setEmailError(emailErr);
    if (emailErr) {
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email.trim(), typeof window !== "undefined" ? window.location.href : undefined);
      if (!response?.success) {
        if (response?.error) {
          showError(response.error);
        }
      } else {
        setRequestSuccess(true);
        showSuccess("Reset link sent!", "Check your inbox for password reset instructions.");
      }
    } catch (error) {
      console.error("Password reset request failed", error);
      showError("Failed to send reset email", "Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const passErr = validatePassword(password);
    const confirmErr = password !== confirmPassword ? "Passwords do not match" : null;
    setPasswordError(passErr);
    setConfirmError(confirmErr);
    if (passErr || confirmErr) {
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordRequest(token, password);
      if (!response?.success) {
        if (response?.error) {
          showError(response.error);
        }
        if (response?.error?.toLowerCase().includes("expired")) {
          setView("expired");
        } else if (response?.error?.toLowerCase().includes("invalid")) {
          setView("invalid");
        }
        return;
      }

      setView("success");
      showSuccess("Password changed!", "Your password has been updated successfully.");
      setTimeout(() => {
        router.push(redirect || "/sign-in");
      }, 2500);
    } catch (error) {
      console.error("Failed to reset password", error);
      showError("Password reset failed", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const headerIcon = isTokenMode ? <ShieldCheck className="h-5 w-5" /> : <Mail className="h-5 w-5" />;

  const title = isTokenMode ? "Set a new password" : "Forgot password";
  const description = isTokenMode
    ? "Create a strong password to secure your account."
    : "Enter your email and we'll send you a link to reset your password.";

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
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4"
            >
              {isTokenMode ? <ShieldCheck className="h-8 w-8" /> : <Mail className="h-8 w-8" />}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold text-gradient-premium">{title}</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-muted-foreground text-lg max-w-sm mx-auto">
                {description}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isTokenMode && (
              <motion.form 
                onSubmit={submitResetRequest} 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => handleEmailChange(event.target.value)}
                      placeholder="you@example.com"
                      className={`input-premium pl-12 h-12 ${emailError ? 'border-destructive focus:ring-destructive' : ''}`}
                      disabled={loading || requestSuccess}
                      required
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

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base" 
                    disabled={loading || requestSuccess}
                  >
                    {loading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Sending reset link...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <span>Send reset link</span>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {requestSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-primary">Check your inbox</p>
                      <p className="text-primary/80">
                        We sent instructions to {email}. The link is valid for 30 minutes.
                      </p>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center text-sm pt-6 border-t border-border/50"
                >
                  <span className="text-muted-foreground">Remember your password? </span>
                  <Link href="/sign-in" className="font-semibold text-primary hover:text-primary/80 transition-premium inline-block">
                    Go back to sign in
                  </Link>
                </motion.div>
              </motion.form>
            )}

            {isTokenMode && view === "form" && (
              <motion.form 
                onSubmit={submitPasswordReset} 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">New password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(event) => handlePasswordChange(event.target.value)}
                      placeholder="••••••••"
                      className={`input-premium pl-12 h-12 ${passwordError ? 'border-destructive focus:ring-destructive' : ''}`}
                      disabled={loading}
                      required
                    />
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

                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirm password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => handleConfirmChange(event.target.value)}
                      placeholder="••••••••"
                      className={`input-premium pl-12 h-12 ${confirmError ? 'border-destructive focus:ring-destructive' : ''}`}
                      disabled={loading}
                      required
                    />
                  </div>
                  {confirmError && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-destructive font-medium"
                    >
                      {confirmError}
                    </motion.p>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base" 
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Updating password...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <span>Update password</span>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
                <div className="text-xs text-muted-foreground text-center">
                  This link expires in 30 minutes. For security, never share it.
                </div>
              </motion.form>
            )}

            {view === "success" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Password updated</h2>
                  <p className="text-muted-foreground text-base">
                    You can now sign in with your new password.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => router.push("/sign-in")} 
                    className="btn-premium w-full sm:w-auto min-w-[200px] font-bold gradient-primary hover:shadow-premium-xl"
                  >
                    Go to sign in
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {view === "invalid" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Invalid link</h2>
                  <p className="text-muted-foreground text-base">
                    The reset link is invalid or may have been used already.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => router.replace("/auth/forgot")} 
                    className="btn-premium w-full sm:w-auto min-w-[200px] bg-surface border-2 hover:bg-muted/20 hover:border-primary/30 font-semibold text-base shadow-premium" 
                    variant="outline"
                  >
                    Request a new link
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {view === "expired" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Link expired</h2>
                  <p className="text-muted-foreground text-base">
                    Looks like this reset link has expired. Request a fresh one below.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => router.replace("/auth/forgot")} 
                    className="btn-premium w-full sm:w-auto min-w-[200px] font-bold gradient-primary hover:shadow-premium-xl"
                  >
                    Send me a new link
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

