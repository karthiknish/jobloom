"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";

const HIDDEN_PATH_PREFIXES = ["/sign-in", "/sign-up", "/verify-email", "/auth"];

const shouldHideForPath = (pathname: string | null | undefined) => {
  if (!pathname) return false;
  return HIDDEN_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

function formatCooldown(seconds: number) {
  return seconds > 0 ? `${seconds}s` : "";
}

export default function EmailVerificationBanner() {
  const { user, loading, sendEmailVerification, reloadUser } = useFirebaseAuth();
  const pathname = usePathname();
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const hideBanner = useMemo(() => {
    if (loading) return true;
    if (!user) return true;
    if (user.emailVerified) return true;
    if (shouldHideForPath(pathname)) return true;
    return false;
  }, [loading, pathname, user]);

  if (hideBanner) {
    return null;
  }

  const handleResend = async () => {
    try {
      setSending(true);
      await sendEmailVerification();
      setCooldown(60);
    } catch {
      // Errors are surfaced through FirebaseAuthProvider's toast handling
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await reloadUser();
    } catch {
      // Errors are surfaced through FirebaseAuthProvider's toast handling
    } finally {
      setRefreshing(false);
    }
  };

  const resendDisabled = sending || cooldown > 0;

  return (
    <div className="mt-16 md:mt-20 border-b border-warning/30 bg-warning-soft text-warning">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-tight sm:text-base text-foreground">
              Verify your email to keep your account secure
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              We sent a verification link to <span className="font-medium">{user?.email ?? "your email"}</span>. Confirm your address to unlock all features.
            </p>
            {cooldown > 0 && (
              <p className="text-xs text-warning sm:text-sm">
                You can request another email in {formatCooldown(cooldown)}.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-warning/50 text-foreground hover:bg-warning-soft"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : (
              "Check again"
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleResend}
            disabled={resendDisabled}
            className="bg-warning text-white hover:bg-warning/90"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${formatCooldown(cooldown)}`
            ) : (
              "Resend email"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-foreground hover:text-muted-foreground"
          >
            <Link href="/verify-email">Need help?</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
