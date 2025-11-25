"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Users, Database, Cookie, Mail, ShieldCheck, Share2 } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary/5 pb-12 pt-16 sm:pb-16 sm:pt-24 lg:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-8"
            >
              <ShieldCheck className="h-10 w-10" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-gradient-premium"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-lg leading-8 text-muted-foreground"
            >
              Learn how Hireall collects, uses, and safeguards your data. Your privacy matters to us.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8"
            >
              <Badge variant="outline" className="px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
                Last updated: June 28, 2025
              </Badge>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="card-premium-elevated border-0 bg-surface overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="lead text-xl text-muted-foreground mb-12">
                  Your privacy is important to us. This Privacy Policy explains how
                  Hireall (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, and protects your personal information when you use our website, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;).
                </p>

                <div className="grid gap-12">
                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Database className="mr-3 h-6 w-6 text-primary" />
                      1. Information We Collect
                    </h2>
                    <p className="text-muted-foreground">
                      We collect information you provide directly, such as your name and email address when you create an account. We also automatically collect certain information when you use the Service, such as log data and device information. Our Chrome extension may collect the URLs of job listings you visit to identify sponsored postings.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Eye className="mr-3 h-6 w-6 text-primary" />
                      2. How We Use Information
                    </h2>
                    <p className="text-muted-foreground">
                      We use your information to deliver and improve the Service, provide customer support, and communicate updates. We never sell your data.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Lock className="mr-3 h-6 w-6 text-primary" />
                      3. Data Security
                    </h2>
                    <p className="text-muted-foreground">
                      We employ industry-standard security measures—encryption in transit and at rest—to protect your data from unauthorized access.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Users className="mr-3 h-6 w-6 text-primary" />
                      4. Your Choices
                    </h2>
                    <p className="text-muted-foreground">
                      You may access, update, or delete your personal information at any time from your account dashboard or by contacting us.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Mail className="mr-3 h-6 w-6 text-primary" />
                      5. Contact Us
                    </h2>
                    <p className="text-muted-foreground">
                      If you have questions about this policy, email us at
                      <Link
                        href="mailto:privacy@hireall.app"
                        className="text-primary hover:underline font-medium ml-1"
                      >
                        privacy@hireall.app
                      </Link>
                      .
                    </p>
                  </section>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
