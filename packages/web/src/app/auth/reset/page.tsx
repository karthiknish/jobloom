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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <CardHeader className="text-center space-y-1 pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {headerIcon}
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isTokenMode && (
              <form onSubmit={submitResetRequest} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => handleEmailChange(event.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-11"
                      disabled={loading || requestSuccess}
                      required
                    />
                  </div>
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading || requestSuccess}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                {requestSuccess && (
                  <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-secondary">Check your inbox</p>
                      <p className="text-secondary/80">
                        We sent instructions to {email}. The link is valid for 30 minutes.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-center text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/sign-in" className="text-primary hover:underline">
                    Go back to sign in
                  </Link>
                </div>
              </form>
            )}

            {isTokenMode && view === "form" && (
              <form onSubmit={submitPasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(event) => handlePasswordChange(event.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11"
                      disabled={loading}
                      required
                    />
                  </div>
                  {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => handleConfirmChange(event.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11"
                      disabled={loading}
                      required
                    />
                  </div>
                  {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  This link expires in 30 minutes. For security, never share it.
                </div>
              </form>
            )}

            {view === "success" && (
              <div className="space-y-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Password updated</h2>
                  <p className="text-muted-foreground text-sm">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Button onClick={() => router.push("/sign-in")} className="w-full sm:w-auto">
                  Go to sign in
                </Button>
              </div>
            )}

            {view === "invalid" && (
              <div className="space-y-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Invalid link</h2>
                  <p className="text-muted-foreground text-sm">
                    The reset link is invalid or may have been used already.
                  </p>
                </div>
                <Button onClick={() => router.replace("/reset-password")} className="w-full sm:w-auto" variant="outline">
                  Request a new link
                </Button>
              </div>
            )}

            {view === "expired" && (
              <div className="space-y-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Link expired</h2>
                  <p className="text-muted-foreground text-sm">
                    Looks like this reset link has expired. Request a fresh one below.
                  </p>
                </div>
                <Button onClick={() => router.replace("/reset-password")} className="w-full sm:w-auto">
                  Send me a new link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

