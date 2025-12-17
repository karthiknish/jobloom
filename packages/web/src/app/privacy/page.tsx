"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Users, Database, Cookie, Mail, ShieldCheck, Share2, ChevronRight, Info } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const sections = [
  { id: "collection", title: "1. Information We Collect", icon: Database },
  { id: "usage", title: "2. How We Use Information", icon: Eye },
  { id: "cookies", title: "3. Cookies & Analytics", icon: Cookie },
  { id: "providers", title: "4. Service Providers", icon: Share2 },
  { id: "security", title: "5. Data Security", icon: Lock },
  { id: "choices", title: "6. Your Choices", icon: Users },
  { id: "retention", title: "7. Data Retention", icon: Shield },
  { id: "changes", title: "8. Changes to This Policy", icon: ShieldCheck },
  { id: "contact", title: "9. Contact Us", icon: Mail },
];

const summaryPoints = [
  { title: "Data Ownership", description: "You own your data. We only process it to provide our services.", icon: Database },
  { title: "No Selling", description: "We never sell your personal information to third parties.", icon: Shield },
  { title: "Security First", description: "We use industry-standard encryption to keep your data safe.", icon: Lock },
  { title: "Transparency", description: "We are clear about what we collect and why we collect it.", icon: Eye },
];

export default function PrivacyPolicy() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950/50 border-b border-border pb-16 pt-24 sm:pb-20 sm:pt-32 lg:pb-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-primary" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8 shadow-sm border border-primary/20"
            >
              <ShieldCheck className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6"
            >
              Privacy <span className="text-primary">Policy</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed mb-10"
            >
              At HireAll, we take your privacy seriously. This policy outlines how we handle your data with the respect and security you deserve.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                Last updated: December 18, 2025
              </Badge>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 px-4">Contents</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                  >
                    <section.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {section.title.split(". ")[1]}
                  </button>
                ))}
              </nav>

              <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Need Help?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Have questions about your data? Our privacy team is here to help.
                </p>
                <Link 
                  href="mailto:privacy@hireall.app"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Contact Privacy Team <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-16">
            {/* Quick Summary */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight">Quick Summary</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {summaryPoints.map((point, idx) => (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <point.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{point.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                Your privacy is important to us. This Privacy Policy explains how
                HireAll (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, and protects your personal information when you use our website, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;).
              </p>

              <div className="space-y-20">
                <section id="collection" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">1. Information We Collect</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We collect information you provide directly, such as your name and email address when you create an account, plus any content you submit (for example, resumes, job descriptions, and notes). We also automatically collect certain information when you use the Service, such as log data and device information.
                      Our Chrome extension may access the pages you visit in order to identify job listings and provide features like sponsored-label detection and application tracking.
                    </p>
                  </div>
                </section>

                <section id="usage" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">2. How We Use Information</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We use your information to deliver and improve the Service, provide customer support, communicate updates, prevent abuse, and maintain security.
                      <strong> We do not sell your personal information.</strong>
                    </p>
                  </div>
                </section>

                <section id="cookies" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Cookie className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">3. Cookies & Analytics</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We may use cookies and similar technologies to keep you signed in, remember preferences, measure performance, and improve the Service. You can control cookies through your browser settings; some features may not function properly if cookies are disabled.
                    </p>
                  </div>
                </section>

                <section id="providers" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Share2 className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">4. Service Providers</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We use trusted third-party service providers to operate the Service (for example, hosting, authentication, email delivery, analytics, payments, and AI processing). These providers may process personal information on our behalf to provide their services, subject to appropriate safeguards.
                    </p>
                  </div>
                </section>

                <section id="security" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">5. Data Security</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We employ industry-standard security measures—encryption in transit and at rest—to protect your data from unauthorized access. Our systems are regularly audited for security vulnerabilities.
                    </p>
                  </div>
                </section>

                <section id="choices" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">6. Your Choices</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      You may access, update, or delete your personal information at any time from your account dashboard or by contacting us. You also have the right to export your data in a machine-readable format.
                    </p>
                  </div>
                </section>

                <section id="retention" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">7. Data Retention</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We retain personal information for as long as needed to provide the Service and for legitimate business purposes (such as security, dispute resolution, and compliance). You can request deletion of your account data by contacting us.
                    </p>
                  </div>
                </section>

                <section id="changes" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">8. Changes to This Policy</h2>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We may update this Privacy Policy from time to time. We will post the updated version on this page and update the “Last updated” date. For material changes, we will notify you via email or a prominent notice on our Service.
                    </p>
                  </div>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-border">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">9. Contact Us</h2>
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      If you have questions about this policy or our privacy practices, please reach out to our dedicated privacy team at
                      <Link
                        href="mailto:privacy@hireall.app"
                        className="text-primary hover:underline font-bold ml-1"
                      >
                        privacy@hireall.app
                      </Link>
                      . We aim to respond to all inquiries within 48 hours.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
