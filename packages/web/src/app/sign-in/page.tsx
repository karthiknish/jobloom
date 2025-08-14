"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import {
  getClerkErrorMessage,
  getRedirectUrlComplete,
  getAfterPath,
} from "@/lib/auth";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoading, shouldRedirect } = useRedirectIfAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const afterPath = getAfterPath("sign-in");
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

  async function handlePasswordSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        try {
          window.postMessage({ type: "CLERK_AUTH_SUCCESS" }, "*");
        } catch {}
        router.replace(redirectUrlComplete);
      } else {
        setError("Additional steps required. Unsupported flow.");
      }
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, "Sign in failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!isLoaded) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete,
      });
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, "Google sign-in failed"));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-md border border-[var(--color-border,#e4e4e7)] bg-[var(--color-card,#fff)] p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handlePasswordSignIn} className="space-y-3">
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
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
          Don’t have an account?{" "}
          <a
            className="underline"
            href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
          >
            Sign up
          </a>
        </div>
      </div>
    </main>
  );
}
