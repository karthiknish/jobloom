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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary via-primary/90 to-secondary/80 text-white"
      >
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6"
            >
              <FileText className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl font-bold sm:text-5xl lg:text-6xl"
            >
              Usage Conditions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-6 max-w-2xl mx-auto text-xl text-primary-foreground/90"
            >
              Guidelines for responsible and respectful use of Hireall services.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-8"
            >
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                Last updated: September 21, 2025
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Key Guidelines Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Respect Others</h3>
              <p className="text-sm text-muted-foreground">
                Treat all users with dignity and respect
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Data Integrity</h3>
              <p className="text-sm text-muted-foreground">
                Provide accurate and honest information
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Legal Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Follow all applicable laws and regulations
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Constructive Use</h3>
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
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800">
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
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <section className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        1
                      </span>
                      Account and User Responsibilities
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Account Security
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Maintain the confidentiality of your account
                            credentials
                          </li>
                          <li>Report any unauthorized access immediately</li>
                          <li>Use strong, unique passwords</li>
                          <li>
                            Enable two-factor authentication when available
                          </li>
                          <li>Log out from shared or public devices</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Accurate Information
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Provide truthful and accurate information during
                            registration
                          </li>
                          <li>
                            Keep your profile and contact information current
                          </li>
                          <li>Use real names and verifiable contact details</li>
                          <li>Do not create fake or duplicate accounts</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        2
                      </span>
                      Content and Data Guidelines
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-green-700">
                          ✅ Acceptable Content
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <ul className="text-green-800 space-y-1">
                            <li>• Professional CVs and resumes</li>
                            <li>• Job application data and notes</li>
                            <li>• Career-related discussions and advice</li>
                            <li>• Constructive feedback and reviews</li>
                            <li>
                              • Educational and professional development content
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2 text-red-700">
                          ❌ Prohibited Content
                        </h3>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <ul className="text-red-800 space-y-1">
                            <li>• False or misleading information</li>
                            <li>• Discriminatory or harassing content</li>
                            <li>• Copyrighted material without permission</li>
                            <li>• Malicious code or malware</li>
                            <li>• Spam or unsolicited commercial content</li>
                            <li>• Personal attacks or defamation</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          CV and Resume Guidelines
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Only upload your own CVs or those you have
                            permission to share
                          </li>
                          <li>
                            Ensure CVs contain accurate and verifiable
                            information
                          </li>
                          <li>
                            Remove sensitive personal information before
                            uploading
                          </li>
                          <li>
                            Respect intellectual property rights of others
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        3
                      </span>
                      Community and Interaction Guidelines
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Respectful Communication
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Treat all users with respect and professionalism
                          </li>
                          <li>Avoid discriminatory language or behavior</li>
                          <li>Engage in constructive dialogue</li>
                          <li>
                            Report inappropriate behavior to our support team
                          </li>
                          <li>
                            Use appropriate language in all communications
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Collaboration Guidelines
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Share knowledge and experiences constructively
                          </li>
                          <li>Provide honest and helpful feedback</li>
                          <li>Respect diverse perspectives and experiences</li>
                          <li>Contribute positively to the community</li>
                          <li>Help other users when possible</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        4
                      </span>
                      Service Usage and Limitations
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Fair Usage</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Use services for their intended career development
                            purposes
                          </li>
                          <li>Do not abuse or overuse system resources</li>
                          <li>Respect rate limits and usage guidelines</li>
                          <li>Report system issues through proper channels</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Technical Restrictions
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Do not attempt to reverse engineer or hack the
                            service
                          </li>
                          <li>Respect API usage limits and guidelines</li>
                          <li>
                            Do not use automated tools to access the service
                            excessively
                          </li>
                          <li>Report security vulnerabilities responsibly</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Chrome Extension Usage
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>
                            Use the extension only on legitimate job sites
                          </li>
                          <li>
                            Do not use it to scrape or collect unauthorized data
                          </li>
                          <li>
                            Respect website terms of service when using the
                            extension
                          </li>
                          <li>
                            Report extension issues through official channels
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        5
                      </span>
                      Prohibited Activities
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                          <h4 className="font-medium text-red-900">
                            Strictly Forbidden
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-red-800">
                          <div>
                            <h5 className="font-medium mb-2">
                              Security Violations
                            </h5>
                            <ul className="text-sm space-y-1">
                              <li>• Attempting to gain unauthorized access</li>
                              <li>• Sharing account credentials</li>
                              <li>• Exploiting system vulnerabilities</li>
                              <li>• Distributing malware or viruses</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">
                              Content Violations
                            </h5>
                            <ul className="text-sm space-y-1">
                              <li>• Harassment or bullying</li>
                              <li>• Hate speech or discrimination</li>
                              <li>• Copyright infringement</li>
                              <li>• Fraudulent or deceptive content</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">
                              Abusive Behavior
                            </h5>
                            <ul className="text-sm space-y-1">
                              <li>• Spam or excessive messaging</li>
                              <li>• Impersonation of others</li>
                              <li>• Doxxing or privacy violations</li>
                              <li>• Threats or intimidation</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">
                              Commercial Misuse
                            </h5>
                            <ul className="text-sm space-y-1">
                              <li>• Unauthorized commercial use</li>
                              <li>• Reselling or redistribution</li>
                              <li>• Competitive intelligence gathering</li>
                              <li>• Data scraping without permission</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        6
                      </span>
                      Enforcement and Consequences
                    </h2>
                    <div className="ml-11 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Violation Process
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>
                            <strong>Warning:</strong> First-time minor
                            violations receive a written warning
                          </li>
                          <li>
                            <strong>Temporary Suspension:</strong> Repeated or
                            moderate violations result in account suspension
                          </li>
                          <li>
                            <strong>Permanent Ban:</strong> Serious violations
                            lead to permanent account termination
                          </li>
                          <li>
                            <strong>Legal Action:</strong> Criminal activity may
                            result in law enforcement involvement
                          </li>
                        </ol>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Appeals Process
                        </h3>
                        <p className="text-muted-foreground">
                          Users may appeal account suspensions or bans by
                          contacting our support team within 30 days of the
                          action. We review all appeals and may reinstate
                          accounts when appropriate.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        7
                      </span>
                      Reporting Violations
                    </h2>
                    <div className="ml-11 space-y-4">
                      <p className="text-muted-foreground">
                        If you encounter content or behavior that violates these
                        conditions, please report it immediately:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <Shield className="h-4 w-4 text-primary mr-2" />
                              <span className="font-medium">Report Abuse</span>
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

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 text-primary mr-2" />
                              <span className="font-medium">
                                General Support
                              </span>
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
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        8
                      </span>
                      Updates to Conditions
                    </h2>
                    <div className="ml-11">
                      <p className="text-muted-foreground">
                        We may update these Usage Conditions from time to time
                        to reflect changes in our services, legal requirements,
                        or community standards. We will notify users of
                        significant changes through our website or email
                        communications. Continued use of our services after such
                        updates constitutes acceptance of the revised
                        conditions.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            These usage conditions were last updated on September 21, 2025. For
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
