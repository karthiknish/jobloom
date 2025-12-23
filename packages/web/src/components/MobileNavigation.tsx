"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  FileText,
  User,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";

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
    requiresAuth: false,
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

export default function MobileNavigation() {
  const { user } = useFirebaseAuth();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      apiClient.get<boolean>(`/app/admin/is-admin/${user.uid}`)
        .then((res) => setIsAdmin(res))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Only show authenticated navigation items if user is logged in
  const visibleItems = navigationItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresAdmin && !isAdmin) return false;
    return true;
  });

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
      <div className="flex items-center justify-around py-3 px-3 safe-area-inset-left safe-area-inset-right">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={`Navigate to ${item.name}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2 rounded-lg motion-control min-w-0 flex-1 mobile-full-width",
                isActive
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center w-full"
              >
                <item.icon
                  className={cn(
                    "h-6 w-6 mb-1",
                    isActive ? "text-primary" : "text-current"
                  )}
                  aria-hidden="true"
                />
                <span className={cn(
                  "text-xs font-medium w-full text-center",
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
