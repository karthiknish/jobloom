"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Shield, ClipboardList, AlertTriangle, FileText, HelpCircle, Scale, Gavel, UserCheck, Ban } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
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
              <Scale className="h-10 w-10" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-gradient-premium"
            >
              Terms of Service
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-lg leading-8 text-muted-foreground"
            >
              Please read these terms carefully before using our platform. They govern your relationship with Hireall.
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
                  Welcome to Hireall! These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Hireall platform, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;). By accessing or using the Service, you agree to be bound by these Terms.
                </p>

                <div className="grid gap-12">
                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <UserCheck className="mr-3 h-6 w-6 text-primary" />
                      1. Eligibility
                    </h2>
                    <p className="text-muted-foreground">
                      You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this eligibility requirement. The Service is not available to any users previously removed from the Service by Hireall.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Shield className="mr-3 h-6 w-6 text-primary" />
                      2. Account Responsibilities
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Provide accurate and complete information when creating your account</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Immediately notify us of any unauthorized use of your account</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Ensure you exit from your account at the end of each session</span>
                      </li>
                    </ul>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Gavel className="mr-3 h-6 w-6 text-primary" />
                      3. Acceptable Use
                    </h2>
                    <p className="text-muted-foreground">
                      You agree not to misuse the Service, including attempting to gain unauthorized access, interfering with the operation of the Service, or using the Service for any illegal purpose. You must not transmit any worms or viruses or any code of a destructive nature.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <ClipboardList className="mr-3 h-6 w-6 text-primary" />
                      4. Chrome Extension Usage
                    </h2>
                    <p className="text-muted-foreground">
                      The Hireall Chrome extension highlights sponsored job listings and helps track applications. By installing the extension, you grant it permission to read the job listings you visit to provide this functionality. We respect your privacy and only collect data necessary for the Service's operation.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Ban className="mr-3 h-6 w-6 text-primary" />
                      5. Termination
                    </h2>
                    <p className="text-muted-foreground">
                      We reserve the right to suspend or terminate your access to the Service at any time, without notice, if you violate these Terms or for any other reason at our sole discretion. Upon termination, your right to use the Service will immediately cease.
                    </p>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <HelpCircle className="mr-3 h-6 w-6 text-primary" />
                      6. Contact
                    </h2>
                    <p className="text-muted-foreground">
                      If you have questions about these Terms, please contact us at
                      <Link
                        href="mailto:support@hireall.app"
                        className="text-primary hover:underline font-medium ml-1"
                      >
                        support@hireall.app
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