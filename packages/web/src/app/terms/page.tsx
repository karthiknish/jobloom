"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Shield, ClipboardList, AlertTriangle, FileText, HelpCircle, Scale, Gavel, UserCheck, Ban, ChevronRight, Info, Zap } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  { id: "eligibility", title: "1. Eligibility", icon: UserCheck },
  { id: "account", title: "2. Account Responsibilities", icon: Shield },
  { id: "use", title: "3. Acceptable Use", icon: Gavel },
  { id: "extension", title: "4. Chrome Extension", icon: ClipboardList },
  { id: "termination", title: "5. Termination", icon: Ban },
  { id: "billing", title: "6. Subscriptions & Billing", icon: FileText },
  { id: "ai", title: "7. AI Features", icon: Zap },
  { id: "disclaimers", title: "8. Disclaimers", icon: AlertTriangle },
  { id: "liability", title: "9. Limitation of Liability", icon: Gavel },
  { id: "contact", title: "10. Contact", icon: HelpCircle },
  { id: "changes", title: "11. Changes to Terms", icon: Scale },
];

const summaryPoints = [
  { title: "Age Requirement", description: "You must be at least 18 years old to use HireAll.", icon: UserCheck },
  { title: "Account Safety", description: "You are responsible for keeping your account credentials secure.", icon: Shield },
  { title: "Fair Use", description: "Don't misuse our service or attempt to bypass our security.", icon: Gavel },
  { title: "AI Accuracy", description: "AI outputs should be reviewed; we don't guarantee 100% accuracy.", icon: Zap },
];

export default function TermsOfService() {
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
      <div className="relative overflow-hidden bg-slate-50  border-b border-border pb-16 pt-24 sm:pb-20 sm:pt-32 lg:pb-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-primary" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8 shadow-sm border border-primary/20"
            >
              <Scale className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6"
            >
              Terms of <span className="text-primary">Service</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed mb-10"
            >
              Please read these terms carefully. They govern your use of the HireAll platform and our commitment to you.
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
                  <Info className="w-4 h-4" /> Questions?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Need clarification on our terms? Our support team is here to help.
                </p>
                <Link 
                  href="mailto:support@hireall.app"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Contact Support <ChevronRight className="w-3 h-3" />
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
                <h2 className="text-2xl font-black tracking-tight">At a Glance</h2>
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

            <div className="prose prose-slate  max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                Welcome to HireAll! These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the HireAll platform, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;). By accessing or using the Service, you agree to be bound by these Terms.
              </p>

              <div className="space-y-20">
                <section id="eligibility" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">1. Eligibility</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this eligibility requirement. The Service is not available to any users previously removed from the Service by HireAll.
                    </p>
                  </div>
                </section>

                <section id="account" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">2. Account Responsibilities</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground mb-6">
                      You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                    </p>
                    <ul className="space-y-4 m-0 p-0 list-none">
                      {[
                        "Provide accurate and complete information when creating your account",
                        "Immediately notify us of any unauthorized use of your account",
                        "Ensure you exit from your account at the end of each session"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="use" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Gavel className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">3. Acceptable Use</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      You agree not to misuse the Service, including attempting to gain unauthorized access, interfering with the operation of the Service, or using the Service for any illegal purpose. You must not transmit any worms or viruses or any code of a destructive nature.
                    </p>
                  </div>
                </section>

                <section id="extension" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">4. Chrome Extension Usage</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      The HireAll Chrome extension highlights sponsored job listings and helps track applications. By installing the extension, you grant it permission to read the job listings you visit to provide this functionality. We respect your privacy and only collect data necessary for the Service's operation.
                    </p>
                  </div>
                </section>

                <section id="termination" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Ban className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">5. Termination</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We reserve the right to suspend or terminate your access to the Service at any time, without notice, if you violate these Terms or for any other reason at our sole discretion. Upon termination, your right to use the Service will immediately cease.
                    </p>
                  </div>
                </section>

                <section id="billing" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">6. Subscriptions & Billing</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      Some parts of the Service may require a paid subscription. Prices, billing periods, renewal rules, and any applicable trial terms will be shown at checkout or in your account. Payments may be processed by third-party payment providers.
                    </p>
                  </div>
                </section>

                <section id="ai" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">7. AI Features</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      The Service may offer AI-assisted features (for example, generating or improving resumes and cover letters). AI outputs may be inaccurate or incomplete and should be reviewed before you rely on them. You are responsible for the content you submit and the decisions you make based on any output.
                    </p>
                  </div>
                </section>

                <section id="disclaimers" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">8. Disclaimers</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0 italic">
                      The Service is provided on an “as is” and “as available” basis. To the maximum extent permitted by law, HireAll disclaims all warranties, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                    </p>
                  </div>
                </section>

                <section id="liability" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Gavel className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">9. Limitation of Liability</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      To the maximum extent permitted by law, HireAll will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of the Service.
                    </p>
                  </div>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">10. Contact</h2>
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      If you have questions about these Terms, please contact our legal and support team at
                      <Link
                        href="mailto:support@hireall.app"
                        className="text-primary hover:underline font-bold ml-1"
                      >
                        support@hireall.app
                      </Link>
                      .
                    </p>
                  </div>
                </section>

                <section id="changes" className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100  flex items-center justify-center border border-border">
                      <Scale className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black m-0">11. Changes to These Terms</h2>
                  </div>
                  <div className="bg-slate-50  rounded-2xl p-8 border border-border">
                    <p className="text-muted-foreground leading-relaxed m-0">
                      We may update these Terms from time to time. If we make material changes, we will take reasonable steps to notify you (for example, by posting an updated version on this page). Your continued use of the Service after changes become effective means you accept the updated Terms.
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
