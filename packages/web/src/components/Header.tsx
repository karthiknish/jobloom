"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, Settings, LogOut } from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
  }, [user]);

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/career-tools", label: "Career Tools" },
  ];

  const adminLinks = [{ href: "/admin", label: "Admin Panel" }];

  const NavItems = () => (
    <>
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

  const AuthButtons = () => {
    const { signOut } = useFirebaseAuth();
    const toast = useToast();

    const handleLogout = async () => {
      try {
        await signOut();
        toast.success("Signed Out", "You have been successfully signed out.");
      } catch (error: any) {
        console.error("Logout error:", error);
        toast.error("Logout Failed", "There was an issue signing you out. Please try again.");
      }
    };

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
                className="w-full sm:w-full bg-background safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right"
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
                <div className="flex flex-col space-y-6 mt-6 h-full">
                  <nav className="flex flex-col space-y-4">
                    <NavItems />
                  </nav>
                  <div className="pt-4 border-t mt-auto">
                    <AuthButtons />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}