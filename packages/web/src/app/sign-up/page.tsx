"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import {
  getClerkErrorMessage,
  getRedirectUrlComplete,
  getAfterPath,
} from "@/lib/auth";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoading, shouldRedirect } = useRedirectIfAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const afterPath = getAfterPath("sign-up");
  const redirectUrlComplete = getRedirectUrlComplete(afterPath);

  // Show loading state while checking authentication or redirecting
  if (isLoading || shouldRedirect) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-md border border-[var(--color-border,#e4e4e7)] bg-[var(--color-card,#fff)] p-6 shadow-sm">
          <div className="text-center text-sm text-[var(--color-muted-foreground,#71717a)]">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  // error handled via util

  async function handleStartSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, "Sign up failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        try {
          window.postMessage({ type: "CLERK_AUTH_SUCCESS" }, "*");
        } catch {}
        router.replace(redirectUrlComplete);
      } else {
        setError("Verification not complete");
      }
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!isLoaded) return;
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete,
      });
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, "Google sign-up failed"));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-md border border-[var(--color-border,#e4e4e7)] bg-[var(--color-card,#fff)] p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Sign up</h1>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!pendingVerification ? (
          <form onSubmit={handleStartSignUp} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-muted-foreground,#71717a)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-[var(--color-input,#e4e4e7)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring,#b86e37)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-muted-foreground,#71717a)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-[var(--color-input,#e4e4e7)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring,#b86e37)]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded bg-[var(--color-primary,#b86e37)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground,#fff)] hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-muted-foreground,#71717a)]">
                Verification code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full rounded border border-[var(--color-input,#e4e4e7)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring,#b86e37)]"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded bg-[var(--color-primary,#b86e37)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground,#fff)] hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
          </form>
        )}
        <div className="my-3 text-center text-xs text-[var(--color-muted-foreground,#71717a)]">
          or
        </div>
        <button
          onClick={handleGoogle}
          className="w-full rounded border border-[var(--color-input,#e4e4e7)] bg-white px-3 py-2 text-sm font-medium hover:bg-[var(--color-accent,#f4f4f5)]"
        >
          Continue with Google
        </button>
        <div className="mt-4 text-center text-xs text-[var(--color-muted-foreground,#71717a)]">
          Already have an account?{" "}
          <a
            className="underline"
            href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
          >
            Sign in
          </a>
        </div>
      </div>
    </main>
  );
}
