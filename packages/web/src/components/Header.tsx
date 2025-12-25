"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Menu, Settings, LogOut, Search, Keyboard } from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { authApi } from "@/utils/api/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Dark mode removed; ModeToggle no longer used
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/GlobalSearch";
import { KeyboardShortcutsDialog } from "@/components/dashboard/KeyboardShortcutsDialog";
import { createDashboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function Header() {
  const { user, signOut, loading: authLoading } = useFirebaseAuth();
  const toast = useToast();
  const isSignedIn = !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Create shortcuts for the dialog (minimal set for display)
  const shortcuts = createDashboardShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onHelp: () => setIsShortcutsOpen(true),
  });

  // Keyboard shortcut for search (Cmd/Ctrl + K) and help (?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Help: ? key (when not in input)
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      // Check if user is admin
      authApi.isAdmin(user.uid)
        .then((isAdmin) => setIsAdmin(isAdmin))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard", requiresAuth: true },
    { href: "/career-tools", label: "Career Tools", requiresAuth: false },
  ];

  const accountLinks = [{ href: "/settings", label: "Settings", requiresAuth: true }];

  const adminLinks = [{ href: "/admin", label: "Admin Panel" }];

  const visibleMainLinks = mainLinks.filter((link) => !link.requiresAuth || isSignedIn || authLoading);
  const visibleAdminLinks = isSignedIn && isAdmin ? adminLinks : [];

  const mobileMainLinks = visibleMainLinks.filter(
    (link) => !(isSignedIn && link.href === "/dashboard")
  );

  const renderMobileLink = (link: { href: string; label: string }) => (
    <Link
      key={link.href}
      href={link.href}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <span>{link.label}</span>
      <span className="text-xs text-muted-foreground">&gt;</span>
    </Link>
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast.success("Signed Out", "You have been successfully signed out.");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Logout Failed", "There was an issue signing you out. Please try again.");
    }
  }, [signOut, toast]);

  const NavItems = () => (
    <>
      {visibleMainLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-fit text-center py-2 flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}

      {visibleAdminLinks.map((link) => (
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

  const AuthButtons = () => {
    return (
      <>
        {isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Avatar className="h-10 w-10 border border-border transition-shadow hover:shadow">
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
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.displayName && (
                    <p className="font-medium">{user.displayName}</p>
                  )}
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center justify-center space-x-2 w-full">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border safe-area-inset-top"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-inset-left safe-area-inset-right">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/Hire-logo.svg"
              alt="HireAll"
              width={120}
              height={28}
              priority
              className="w-20 h-auto md:w-[140px] md:h-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavItems />
          </nav>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search (⌘K)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Search <kbd className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsShortcutsOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Keyboard className="h-5 w-5" />
                    <span className="sr-only">Keyboard shortcuts</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Keyboard shortcuts <kbd className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">?</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                className="w-full sm:w-full bg-background safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Image
                        src="/Hire-logo.svg"
                        alt="HireAll"
                        width={140}
                        height={32}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-6 mt-6 min-h-full">
                  {isSignedIn && (
                    <Button asChild size="lg" className="w-full" variant="secondary">
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsSearchOpen(true);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsShortcutsOpen(true);
                      }}
                    >
                      <Keyboard className="mr-2 h-4 w-4" />
                      Shortcuts
                    </Button>
                  </div>

                  <nav className="flex flex-col space-y-6 flex-1">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Main</p>
                      <div className="flex flex-col space-y-2">
                        {mobileMainLinks.map(renderMobileLink)}
                      </div>
                    </div>

                    {isSignedIn && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Account</p>
                        <div className="flex flex-col space-y-2">
                          {accountLinks.map(renderMobileLink)}
                          {visibleAdminLinks.map(renderMobileLink)}
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleLogout();
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </Button>
                        </div>
                      </div>
                    )}
                  </nav>

                  {!isSignedIn && (
                    <div className="pt-4 border-t space-y-2">
                      <Button asChild variant="ghost" size="lg" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/sign-in">Sign In</Link>
                      </Button>
                      <Button asChild size="lg" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/sign-up">Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>

    {/* Global Search Modal */}
    <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    
    {/* Keyboard Shortcuts Dialog */}
    <KeyboardShortcutsDialog
      open={isShortcutsOpen}
      onOpenChange={setIsShortcutsOpen}
      shortcuts={shortcuts}
    />
    </>
  )
}