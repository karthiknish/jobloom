"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, HelpCircle, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 text-center bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="text-[12rem] font-bold text-primary/5 select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            404
          </div>
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary mb-8 relative z-10">
            <AlertTriangle className="h-16 w-16" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-gradient-premium mb-6"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed"
        >
          It looks like you&apos;ve wandered off the job search path. The page you&apos;re
          looking for doesn&apos;t exist or has been moved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button asChild variant="premium" size="xl" className="min-w-[160px]">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="h-12 px-8 font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary min-w-[160px]">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Dashboard
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 text-muted-foreground text-sm flex items-center justify-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          <p>
            Need help?{" "}
            <Link
              href="/contact"
              className="text-primary hover:underline font-medium transition-colors"
            >
              Contact Support
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}