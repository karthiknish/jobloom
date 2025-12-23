"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/providers/subscription-provider";
import { Crown, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface FeatureHintProps {
  /**
   * Unique identifier for this hint (used for persistence)
   */
  id: string;
  /**
   * Title of the premium feature
   */
  title: string;
  /**
   * Description of what the feature offers
   */
  description: string;
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  /**
   * Whether the hint can be dismissed
   */
  dismissible?: boolean;
  /**
   * Variant style of the hint
   */
  variant?: "tooltip" | "card" | "banner";
  /**
   * Optional className
   */
  className?: string;
  /**
   * Callback when hint is dismissed
   */
  onDismiss?: () => void;
  /**
   * Whether to persist dismissal in localStorage
   */
  persistDismissal?: boolean;
}

export function PremiumFeatureHint({
  id,
  title,
  description,
  icon,
  dismissible = true,
  variant = "tooltip",
  className = "",
  onDismiss,
  persistDismissal = true,
}: FeatureHintProps) {
  const { plan } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if hint was previously dismissed
  useEffect(() => {
    if (persistDismissal && typeof window !== "undefined") {
      const dismissed = localStorage.getItem(`premium_hint_dismissed_${id}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [id, persistDismissal]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (persistDismissal && typeof window !== "undefined") {
      localStorage.setItem(`premium_hint_dismissed_${id}`, "true");
    }
    onDismiss?.();
  };

  // Don't show for premium users or if dismissed
  if (plan === "premium" || isDismissed) {
    return null;
  }

  const defaultIcon = icon || <Sparkles className="h-4 w-4" />;

  if (variant === "tooltip") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-full text-xs ${className}`}
        >
          <span className="text-amber-600">
            {defaultIcon}
          </span>
          <span className="font-medium text-amber-800">
            {title}
          </span>
          <Link href="/upgrade">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 px-2 text-[10px] font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-200/50"
            >
              Upgrade
            </Button>
          </Link>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="ml-1 p-0.5 rounded hover:bg-amber-200/50 text-amber-500"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === "card") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`relative p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl ${className}`}
        >
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-200/50 text-amber-500"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white">
              {defaultIcon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 mb-1">
                {title}
              </h4>
              <p className="text-sm text-amber-700 mb-3">
                {description}
              </p>
              <Link href="/upgrade">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={`overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              {defaultIcon}
            </div>
            <div>
              <span className="font-semibold">{title}</span>
              <span className="hidden sm:inline text-white/90 ml-2 text-sm">
                {description}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upgrade">
              <Button
                size="sm"
                className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
              >
                Upgrade
              </Button>
            </Link>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-white/20"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
