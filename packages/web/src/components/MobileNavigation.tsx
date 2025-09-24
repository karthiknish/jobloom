"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Briefcase,
  MessageSquare,
  FileText,
  User,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    requiresAuth: false,
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    requiresAuth: true,
  },
  {
    name: "Interview",
    href: "/interview-prep",
    icon: MessageSquare,
    requiresAuth: true,
  },
  {
    name: "Resume",
    href: "/portfolio",
    icon: FileText,
    requiresAuth: true,
  },
  {
    name: "Profile",
    href: "/account",
    icon: User,
    requiresAuth: true,
  },
];

export default function MobileNavigation() {
  const { user } = useFirebaseAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Only show authenticated navigation items if user is logged in
  const visibleItems = navigationItems.filter(item =>
    !item.requiresAuth || user
  );

  // Don't show mobile nav on auth pages
  const authPages = ['/sign-in', '/sign-up', '/verify-email'];
  if (authPages.includes(pathname)) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border"
    >
      <div className="flex items-center justify-around py-2 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 mb-1",
                    isActive ? "text-primary" : "text-current"
                  )}
                />
                <span className={cn(
                  "text-xs font-medium truncate",
                  isActive ? "text-primary" : "text-current"
                )}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </motion.div>
  );
}
