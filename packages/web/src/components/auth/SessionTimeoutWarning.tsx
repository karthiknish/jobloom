"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimeoutWarningProps {
  isVisible: boolean;
  onExtendSession: () => Promise<void>;
  onSignOut: () => Promise<void>;
  remainingMinutes?: number;
}

export function SessionTimeoutWarning({
  isVisible,
  onExtendSession,
  onSignOut,
  remainingMinutes = 60,
}: SessionTimeoutWarningProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [countdown, setCountdown] = useState(remainingMinutes * 60);
  const [dismissed, setDismissed] = useState(false);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setDismissed(false);
      setCountdown(remainingMinutes * 60);
    }
  }, [isVisible, remainingMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible || dismissed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, dismissed]);

  const handleExtendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
      setDismissed(true);
    } catch (error) {
      console.error("Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  }, [onExtendSession]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsSigningOut(false);
    }
  }, [onSignOut]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const isUrgent = countdown < 300; // Less than 5 minutes

  if (!isVisible || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <AlertDialog open={isVisible && !dismissed}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-3 rounded-full ${
                  isUrgent
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"
                }`}
              >
                <Clock className="h-6 w-6" />
              </motion.div>
              <div>
                <AlertDialogTitle className="text-xl">
                  Session Expiring Soon
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="pt-4 space-y-3">
              <p>
                Your session will expire in{" "}
                <span
                  className={`font-semibold ${
                    isUrgent ? "text-destructive" : "text-warning"
                  }`}
                >
                  {formatTime(countdown)}
                </span>
                . Would you like to stay signed in?
              </p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Extend Session&quot; to continue working, or sign out to
                securely end your session.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Progress bar showing time remaining */}
          <div className="my-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  isUrgent ? "bg-destructive" : "bg-warning"
                }`}
                initial={{ width: "100%" }}
                animate={{
                  width: `${(countdown / (remainingMinutes * 60)) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isExtending || isSigningOut}
              className="w-full sm:w-auto"
            >
              {isSigningOut ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
            <Button
              variant="premium"
              onClick={handleExtendSession}
              disabled={isExtending || isSigningOut}
              className="w-full sm:w-auto"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Extend Session
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}
