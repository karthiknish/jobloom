"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  FileText,
  User,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { authApi } from "@/utils/api/auth";
import { useSubscription } from "@/providers/subscription-provider";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    requiresAuth: false,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    name: "Career Tools",
    href: "/career-tools",
    icon: FileText,
    requiresAuth: true,
  },
  {
    name: "Profile",
    href: "/settings",
    icon: User,
    requiresAuth: true,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    requiresAuth: true,
    requiresAdmin: true,
  },
];

// Haptic feedback utility
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10); // Light haptic feedback
  }
};

export default function MobileNavigation() {
  const { user } = useFirebaseAuth();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const { plan } = useSubscription();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorPosition, setIndicatorPosition] = useState({ left: 0, width: 0 });

  const isPremium = plan !== 'free';

  useEffect(() => {
    if (user?.uid) {
      authApi.isAdmin(user.uid)
        .then((res) => setIsAdmin(res))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Only show authenticated navigation items if user is logged in
  const visibleItems = useMemo(() => {
    return navigationItems.filter(item => {
      if (item.requiresAuth && !user) return false;
      if (item.requiresAdmin && !isAdmin) return false;
      return true;
    });
  }, [user, isAdmin]);

  // Update indicator position based on active tab
  useEffect(() => {
    if (!navRef.current) return;
    
    const activeIndex = visibleItems.findIndex(item => 
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    );
    
    if (activeIndex >= 0) {
      const navWidth = navRef.current.offsetWidth;
      const itemWidth = navWidth / visibleItems.length;
      const newLeft = activeIndex * itemWidth;
      
      // Only update if position changed significantly
      setIndicatorPosition(prev => {
        if (Math.abs(prev.left - newLeft) < 0.1 && Math.abs(prev.width - itemWidth) < 0.1) {
          return prev;
        }
        return {
          left: newLeft,
          width: itemWidth,
        };
      });
    }
  }, [pathname, visibleItems]);

  // Handle tab navigation with haptic feedback
  const handleTabPress = useCallback(() => {
    triggerHaptic();
  }, []);

  // Don't show mobile nav on auth pages
  const authPages = ["/sign-in", "/sign-up", "/verify-email"];
  if (authPages.includes(pathname) || pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom min-h-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))]"
    >
      {/* Upgrade Banner for non-premium users */}
      {user && !isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-2 right-2"
        >
          <Link
            href="/upgrade"
            onClick={handleTabPress}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-t-xl shadow-lg active:scale-[0.98] transition-transform"
          >
            <Crown className="h-3.5 w-3.5" />
            Upgrade to Premium
          </Link>
        </motion.div>
      )}

      <div 
        ref={navRef}
        className="relative flex items-center justify-around py-2 px-2 safe-area-inset-left safe-area-inset-right"
      >
        {/* Animated indicator */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-primary rounded-full"
          initial={false}
          animate={{
            left: indicatorPosition.left,
            width: indicatorPosition.width,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleTabPress}
              aria-label={`Navigate to ${item.name}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg motion-control min-w-0 flex-1",
                "min-h-[44px] min-w-[44px]", // Touch target minimum
                "active:scale-95 transition-transform duration-150", // Touch feedback
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center w-full"
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 mb-0.5",
                      isActive ? "text-primary" : "text-current"
                    )}
                    aria-hidden="true"
                  />
                </motion.div>
                <span className={cn(
                  "text-xxs font-medium w-full text-center truncate",
                  isActive ? "text-primary" : "text-current"
                )}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

