"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ShieldQuestion, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showError, showSuccess } from "@/components/ui/Toast";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requestPasswordReset(email: string, redirectUrl?: string) {
  const res = await fetch("/api/auth/password/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, redirectUrl }),
  });

  return res.json();
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!value) {
      setEmailError("Email is required");
    } else if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError(null);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined;
      const response = await requestPasswordReset(trimmed, redirectUrl);
      if (!response?.success) {
        if (response?.error) {
          showError(response.error);
        }
        return;
      }

      setSent(true);
      showSuccess("If your email exists, a reset link will arrive shortly.");
    } catch (error) {
      console.error("Failed to request password reset", error);
      showError("Unable to send password reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
              <ShieldQuestion className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Forgot password</CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
              Enter your email and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={submit} className="space-y-5">
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
                    disabled={loading || sent}
                    required
                  />
                </div>
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading || sent}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              {sent && (
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
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

