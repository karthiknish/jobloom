"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useEffect } from "react";

function SignUpInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { signUp, signInWithGoogle } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUrlComplete = search.get("redirect_url") || "/dashboard";

  // Auto-trigger Google sign-up if requested via query
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

  async function handleStartSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, name || undefined);
      router.replace(redirectUrlComplete);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Sign up failed");
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
      setError(e?.message || "Google sign-up failed");
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
        <form onSubmit={handleStartSignUp} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-muted-foreground,#71717a)]">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-[var(--color-input,#e4e4e7)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring,#b86e37)]"
              placeholder="Your name"
            />
          </div>
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
            href={`/sign-in?redirect_url=${encodeURIComponent(
              redirectUrlComplete
            )}`}
          >
            Sign in
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}
