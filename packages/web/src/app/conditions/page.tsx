"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  MessageSquare,
  Gavel,
  Ban,
  HelpCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ConditionsPage() {
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
              <FileText className="h-10 w-10" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-gradient-premium"
            >
              Usage Conditions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-lg leading-8 text-muted-foreground"
            >
              Guidelines for responsible and respectful use of Hireall services.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8"
            >
              <Badge variant="outline" className="px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
                Last updated: December 12, 2025
              </Badge>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Guidelines Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <Card className="card-premium-elevated border-0 bg-surface text-center hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Respect Others</h3>
              <p className="text-sm text-muted-foreground">
                Treat all users with dignity and respect
              </p>
            </CardContent>
          </Card>
          <Card className="card-premium-elevated border-0 bg-surface text-center hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Data Integrity</h3>
              <p className="text-sm text-muted-foreground">
                Provide accurate and honest information
              </p>
            </CardContent>
          </Card>
          <Card className="card-premium-elevated border-0 bg-surface text-center hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Legal Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Follow all applicable laws and regulations
              </p>
            </CardContent>
          </Card>
          <Card className="card-premium-elevated border-0 bg-surface text-center hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Constructive Use</h3>
              <p className="text-sm text-muted-foreground">
                Use services for their intended purpose
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 text-sm sm:text-base">
                  These conditions ensure a safe, respectful, and productive
                  environment for all Hireall users. Violation of these
                  conditions may result in account suspension or termination.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="card-premium-elevated border-0 bg-surface overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="prose prose-lg max-w-none">
                <div className="grid gap-12">
                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Users className="mr-3 h-6 w-6 text-primary" />
                      1. Account and User Responsibilities
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-foreground">Account Security</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Maintain the confidentiality of your account credentials</li>
                          <li>Report any unauthorized access immediately</li>
                          <li>Use strong, unique passwords</li>
                          <li>Enable two-factor authentication when available</li>
                          <li>Log out from shared or public devices</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-foreground">Accurate Information</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Provide truthful and accurate information during registration</li>
                          <li>Keep your profile and contact information current</li>
                          <li>Use real names and verifiable contact details</li>
                          <li>Do not create fake or duplicate accounts</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <FileText className="mr-3 h-6 w-6 text-primary" />
                      2. Content and Data Guidelines
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-green-600">Acceptable Content</h3>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <ul className="text-green-800 space-y-1 text-sm">
                            <li>• Professional CVs and resumes</li>
                            <li>• Job application data and notes</li>
                            <li>• Career-related discussions and advice</li>
                            <li>• Constructive feedback and reviews</li>
                            <li>• Educational and professional development content</li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-red-600">Prohibited Content</h3>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <ul className="text-red-800 space-y-1 text-sm">
                            <li>• False or misleading information</li>
                            <li>• Discriminatory or harassing content</li>
                            <li>• Copyrighted material without permission</li>
                            <li>• Malicious code or malware</li>
                            <li>• Spam or unsolicited commercial content</li>
                            <li>• Personal attacks or defamation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <MessageSquare className="mr-3 h-6 w-6 text-primary" />
                      3. Community and Interaction Guidelines
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-foreground">Respectful Communication</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Treat all users with respect and professionalism</li>
                          <li>Avoid discriminatory language or behavior</li>
                          <li>Engage in constructive dialogue</li>
                          <li>Report inappropriate behavior to our support team</li>
                          <li>Use appropriate language in all communications</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Ban className="mr-3 h-6 w-6 text-primary" />
                      4. Prohibited Activities
                    </h2>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <h4 className="font-medium text-red-900">Strictly Forbidden</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-red-800">
                        <div>
                          <h5 className="font-medium mb-2 text-sm uppercase tracking-wide opacity-80">Security Violations</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Attempting to gain unauthorized access</li>
                            <li>• Sharing account credentials</li>
                            <li>• Exploiting system vulnerabilities</li>
                            <li>• Distributing malware or viruses</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-sm uppercase tracking-wide opacity-80">Content Violations</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Harassment or bullying</li>
                            <li>• Hate speech or discrimination</li>
                            <li>• Copyright infringement</li>
                            <li>• Fraudulent or deceptive content</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-sm uppercase tracking-wide opacity-80">Abusive Behavior</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Spam or excessive messaging</li>
                            <li>• Impersonation of others</li>
                            <li>• Doxxing or privacy violations</li>
                            <li>• Threats or intimidation</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-sm uppercase tracking-wide opacity-80">Commercial Misuse</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Unauthorized commercial use</li>
                            <li>• Reselling or redistribution</li>
                            <li>• Competitive intelligence gathering</li>
                            <li>• Data scraping without permission</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <Gavel className="mr-3 h-6 w-6 text-primary" />
                      5. Enforcement and Consequences
                    </h2>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        We take violations seriously. Consequences may include:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                        <li><strong>Warning:</strong> First-time minor violations receive a written warning</li>
                        <li><strong>Temporary Suspension:</strong> Repeated or moderate violations result in account suspension</li>
                        <li><strong>Permanent Ban:</strong> Serious violations lead to permanent account termination</li>
                        <li><strong>Legal Action:</strong> Criminal activity may result in law enforcement involvement</li>
                      </ol>
                    </div>
                  </section>

                  <section className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <h2 className="flex items-center text-2xl font-bold text-foreground mt-0 mb-4">
                      <HelpCircle className="mr-3 h-6 w-6 text-primary" />
                      6. Reporting Violations
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <Card className="border border-border bg-background/50 hover:bg-background/80 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <Shield className="h-4 w-4 text-primary mr-2" />
                            <span className="font-medium text-foreground">Report Abuse</span>
                          </div>
                          <Link
                            href="mailto:abuse@hireall.app"
                            className="text-primary hover:underline text-sm"
                          >
                            abuse@hireall.app
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            For harassment, threats, or inappropriate content
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border border-border bg-background/50 hover:bg-background/80 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <MessageSquare className="h-4 w-4 text-primary mr-2" />
                            <span className="font-medium text-foreground">General Support</span>
                          </div>
                          <Link
                            href="mailto:support@hireall.app"
                            className="text-primary hover:underline text-sm"
                          >
                            support@hireall.app
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            For technical issues or general questions
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            These usage conditions were last updated on December 12, 2025. For
            the most current version, please visit this page regularly.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
