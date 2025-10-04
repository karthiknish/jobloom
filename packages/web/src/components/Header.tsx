"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
// Dark mode removed; ModeToggle no longer used
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const { user } = useFirebaseAuth();
  const isSignedIn = !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      // Check if user is admin
      user.getIdToken().then((token) => {
        fetch("/api/app/admin/is-admin/" + user.uid, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => setIsAdmin(data))
          .catch(() => setIsAdmin(false));
      });
    } else {
      setIsAdmin(false);
    }
  }, [user?.uid]);

  const navLinks = [
    { href: "#how-it-works", label: "How it Works" },
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/portfolio", label: "Portfolio Builder" },
    { href: "/application", label: "Application Workspace" },
    { href: "/companies", label: "Company Research" },
    { href: "/interview-prep", label: "Interview Prep" },
    { href: "/cv-evaluator", label: "CV Evaluator" },

  ];

  const adminLinks = [{ href: "/admin/blog", label: "Blog Admin" }];

  const NavItems = () => (
    <>
      {!isSignedIn &&
        navLinks.map((link) => (
          <motion.div
            key={link.href}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-premium text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 focus-visible"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          </motion.div>
        ))}

      {isSignedIn &&
        userLinks.map((link) => (
          <motion.div
            key={link.href}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-premium text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 focus-visible"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          </motion.div>
        ))}

      {isSignedIn &&
        isAdmin &&
        adminLinks.map((link) => (
          <motion.div
            key={link.href}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-premium text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 focus-visible"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          </motion.div>
        ))}
    </>
  );

  const AuthButtons = () => (
    <>
      {isSignedIn ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible focus:outline-none shadow-premium hover:shadow-premium-lg transition-premium"
          >
            <span className="sr-only">Go to settings</span>
            <Avatar className="h-11 w-11 border-2 border-primary/20 transition-all group-hover:border-primary/40 group-hover:shadow-lg">
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={user?.displayName || "User"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {user?.displayName?.charAt(0) ||
                  user?.email?.charAt(0) ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
          </Link>
        </motion.div>
      ) : (
        <div className="flex items-center justify-center space-x-3 w-full">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/sign-in">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 font-medium"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/sign-up">
              <Button 
                size="sm" 
                className="rounded-xl shadow-premium hover:shadow-premium-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      )}
    </>
  );

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="fixed top-0 w-full surface-premium-elevated z-50 border-b border-border/50 safe-area-inset-top bg-background/95 backdrop-saturate-180"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-inset-left safe-area-inset-right">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-3 group transition-premium">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="/hireall-logo.svg"
                alt="HireAll"
                width={120}
                height={28}
                priority
                className="w-24 h-auto md:w-[140px] md:h-auto filter drop-shadow-sm"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavItems />
          </nav>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6 text-muted-foreground" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-full surface-premium-elevated safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right bg-background"
              >
                <SheetHeader>
                  <SheetTitle className="text-center">
                    <Link
                      href="/"
                      className="flex items-center justify-center space-x-3"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Image
                          src="/hireall-logo.svg"
                          alt="HireAll"
                          width={140}
                          height={32}
                          className="filter drop-shadow-sm"
                        />
                      </motion.div>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col items-center space-y-8 mt-8 h-full">
                  <nav className="flex flex-col space-y-2 items-center w-full">
                    <NavItems />
                  </nav>
                  <div className="pt-6 border-t border-border/50 mt-auto flex justify-center w-full">
                    <AuthButtons />
                  </div>
                  {isSignedIn && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="pt-6 border-t border-border/50 w-full"
                    >
                      <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50 shadow-premium">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-premium">
                              <AvatarImage
                                src={user?.photoURL || undefined}
                                alt={user?.displayName || "User"}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {user?.displayName?.charAt(0) ||
                                  user?.email?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user?.displayName || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                            <span className="text-xs text-green-600 font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
