"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  SignOutButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const { isSignedIn, user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#how-it-works", label: "How it Works" },
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/cv-evaluator", label: "CV Evaluator" },
    { href: "/account", label: "Account" },
  ];

  const NavItems = () => (
    <>
      {!isSignedIn &&
        navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium w-fit text-center py-2"
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
            className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium w-fit text-center py-2 flex"
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
                  src={user?.imageUrl}
                  alt={user?.firstName || "User"}
                />
                <AvatarFallback>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
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
            <DropdownMenuItem asChild>
              <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                <div className="w-full flex items-center justify-center">
                  Log out
                </div>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center justify-center space-x-2 w-full">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Get Started</Button>
          </SignUpButton>
        </div>
      )}
    </>
  );

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100"
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

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
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
              <SheetContent side="right" className="w-full sm:w-full bg-white">
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
                  <div className="pt-4 border-t border-gray-200 mt-auto flex justify-center">
                    <AuthButtons />
                  </div>
                  {isSignedIn && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user?.imageUrl}
                              alt={user?.firstName || "User"}
                            />
                            <AvatarFallback>
                              {user?.firstName?.charAt(0)}
                              {user?.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "w-10 h-10",
                            },
                          }}
                        />
                      </div>
                      <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                        <Button variant="destructive" className="w-full mt-4">
                          Log out
                        </Button>
                      </SignOutButton>
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
