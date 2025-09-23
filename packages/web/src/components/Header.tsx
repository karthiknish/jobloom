"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      fetch("/api/app/admin/is-admin/" + user.uid)
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false));
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
    { href: "/cv-evaluator", label: "CV Evaluator" },
    { href: "/settings", label: "Settings" },
    { href: "/blog", label: "Blog" },
    { href: "/account", label: "Account" },
  ];

  const adminLinks = [{ href: "/admin/blog", label: "Blog Admin" }];

  const NavItems = () => (
    <>
      {!isSignedIn &&
        navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-fit text-center py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

      {isSignedIn &&
        userLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-fit text-center py-2 flex"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

      {isSignedIn &&
        isAdmin &&
        adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-fit text-center py-2 flex"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
    </>
  );

  const AuthButtons = () => (
    <>
      {isSignedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.photoURL || undefined}
                  alt={user?.displayName || "User"}
                />
                <AvatarFallback>
                  {user?.displayName?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem>
              <Link href="/account" className="w-full">
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard" className="w-full">
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/cv-evaluator" className="w-full">
                CV Evaluator
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center justify-center space-x-2 w-full">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/jobloom-logo.svg"
              alt="JobBloom"
              width={140}
              height={32}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavItems />
          </nav>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-2">
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
                  <Menu className="h-6 w-6 text-gray-600" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-full bg-background"
              >
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Image
                        src="/jobloom-logo.svg"
                        alt="JobBloom"
                        width={140}
                        height={32}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col items-center space-y-6 mt-6 h-full">
                  <nav className="flex flex-col space-y-4 items-center">
                    <NavItems />
                  </nav>
                  <div className="pt-4 border-t mt-auto flex justify-center">
                    <AuthButtons />
                  </div>
                  {isSignedIn && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user?.photoURL || undefined}
                              alt={user?.displayName || "User"}
                            />
                            <AvatarFallback>
                              {user?.displayName?.charAt(0) ||
                                user?.email?.charAt(0) ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user?.displayName || user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        {/* Sign-out handled inside Account or via a simple button elsewhere */}
                      </div>
                    </div>
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
