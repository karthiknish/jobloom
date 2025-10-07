"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
// Authentication handled by Firebase
import { Button } from "@/components/ui/button";
import FAQSection from "@/components/custom/FAQSection";
import TestimonialSection from "@/components/custom/TestimonialSection";
import { ArrowRight, Zap, Shield, Users, TrendingUp, CheckCircle, Sparkles, Target, Eye, ChevronDown, Play, Star, Award, Clock, Globe, Lock, Database, Cpu, BarChart3, Download, RefreshCw, Check } from "lucide-react";

export default function Home() {
  // TODO: Replace with Firebase server-side auth if needed. For now assume logged-out.
  const userId = null as string | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Geometric Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity/[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 60% 40%, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 80px 80px, 100px 100px, 120px 120px'
        }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-2 h-2 bg-primary rounded-full animate-ping opacity-20"></div>
          <div className="absolute bottom-32 left-40 w-3 h-3 bg-secondary rounded-full animate-ping opacity-15" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary rounded-full animate-ping opacity-25" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-12"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">500K+ Users</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">4.9 Rating</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">AI-Powered</div>
            </motion.div>
          </motion.div>

          <div className="text-center space-y-10 fade-in-up">

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              <div className="relative">
                <span className="relative z-10">Never Miss a</span>
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-primary/20 rounded-full -z-10 transform -rotate-1"></div>
              </div>
              <div className="block mt-4 relative">
                <span className="relative z-10 font-serif text-primary">Sponsored Opportunity</span>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>
              </div>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed px-4"
            >
              <div className="relative">
                <span className="relative z-10">Discover exactly which companies are investing thousands in hiring.</span>
                <div className="absolute -bottom-1 left-1/4 right-1/4 h-px bg-border"></div>
              </div>
              <div className="mt-3 text-lg text-foreground">
                Our AI-powered platform reveals sponsored jobs across all major job sites.
              </div>
            </motion.p>

            {/* Advanced Stats with Interactive Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto px-4"
            >
              <motion.div 
                whileHover={{ scale: 1.02, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <div className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-9 w-9 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">95%</div>
                    <div className="text-lg font-semibold text-foreground mb-1">More Responses</div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <div className="w-2 h-4 bg-primary rounded-sm"></div>
                      <span>+45% increase</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-secondary/5 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <div className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-lg">
                      <Zap className="h-9 w-9 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-secondary mb-2">3x</div>
                    <div className="text-lg font-semibold text-foreground mb-1">Faster Applications</div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <div className="w-2 h-4 bg-secondary rounded-sm"></div>
                      <span>Saves 6 hrs/week</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <div className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                      <Shield className="h-9 w-9 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-accent mb-2">100%</div>
                    <div className="text-lg font-semibold text-foreground mb-1">Privacy Protected</div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <div className="w-2 h-4 bg-accent rounded-sm"></div>
                      <span>Bank-level security</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            >
              {userId ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild size="lg" className="text-lg px-10 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full sm:w-auto shadow-sm hover:shadow-md transition-all">
                    <Link href="/dashboard" className="flex items-center gap-3">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full sm:w-auto shadow-sm hover:shadow-lg transition-all">
                      <Link href="/sign-up" className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6" />
                        Start Free Today
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="text-lg px-12 py-6 border-2 border-border hover:border-primary hover:bg-primary/5 text-foreground font-semibold rounded-xl transition-all w-full sm:w-auto"
                    >
                      <a href="#how-it-works" className="flex items-center gap-3">
                        <Eye className="h-5 w-5" />
                        See How It Works
                      </a>
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Chrome extension included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            asChild
            size="lg"
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Link href="/sign-up">
              <Sparkles className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-card border border-border px-5 py-2.5 rounded-full text-sm font-semibold mb-8">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              The Problem
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-serif mb-6 leading-tight">
              <div className="relative">
                You&apos;re Missing Out on the
                <div className="block mt-2 relative">
                  <span className="text-primary">Best Opportunities</span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20 rounded-lg -z-10"></div>
                </div>
              </div>
            </h2>
            <div className="relative max-w-3xl mx-auto">
              <p className="text-xl text-muted-foreground leading-relaxed">
                Companies spend thousands promoting jobs, but you can&apos;t tell which opportunities are real priorities.
              </p>
              <div className="mt-4 text-lg text-foreground">
                This information gap costs you time and opportunities.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-destructive/5 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="absolute -top-3 right-6">
                  <div className="px-3 py-1 bg-destructive text-white text-xs font-semibold rounded-full border border-destructive">
                    Critical Issue
                  </div>
                </div>
                <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-destructive">?</span>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Invisible Sponsorships</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-base mb-6">
                  Sponsored jobs look identical to regular listings. You can&apos;t tell which companies are actually investing in hiring.
                </p>
                <div className="flex flex-col items-center">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      <span>78% of applications ignored</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-orange-500/5 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="absolute -top-3 right-6">
                  <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full border border-orange-500">
                    Major Problem
                  </div>
                </div>
                <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-orange-600">!</span>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Scattered Applications</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-base mb-6">
                  Your job search is fragmented across platforms with no central place to track applications and follow-ups.
                </p>
                <div className="flex flex-col items-center">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold">
                      <Database className="h-4 w-4" />
                      <span>6-8 platforms to manage</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-muted/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="absolute -top-3 right-6">
                  <div className="px-3 py-1 bg-muted text-white text-xs font-semibold rounded-full border border-muted">
                    Time Wasted
                  </div>
                </div>
                <div className="w-20 h-20 bg-muted/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Wasted Time & Energy</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-base mb-6">
                  Hours spent applying to jobs without knowing which companies are serious about hiring.
                </p>
                <div className="flex flex-col items-center">
                  <div className="bg-muted/10 border border-muted/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
                      <RefreshCw className="h-4 w-4" />
                      <span>$2,500+ per opportunity</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-secondary rounded-2xl p-8 border border-primary/10">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-1">78%</div>
              <div className="text-sm text-secondary-foreground">applications get no response</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-primary/20"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary/80 mb-1">6-8</div>
              <div className="text-sm text-secondary-foreground">hours wasted per week</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-primary/20"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-foreground mb-1">$2,500+</div>
              <div className="text-sm text-secondary-foreground">average cost per hire</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              The Solution
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-serif mb-6 leading-tight">
              Three Simple Steps to
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">Job Search Success</span>
            </h2>
            <p className="text-xl text-secondary-foreground max-w-3xl mx-auto leading-relaxed">
              Our intelligent platform transforms how you approach job hunting, giving you the competitive advantage you deserve.
            </p>
          </div>

          {/* Enhanced 3-step process */}
          <div className="relative mb-20">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-secondary/20 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">1</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-md">
                        <Download className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        <span>30 seconds</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Install Extension</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Add our lightweight Chrome extension in seconds. Works with LinkedIn, Indeed, and 50+ job sites.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Chrome</div>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">LinkedIn</div>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Indeed</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-secondary/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">2</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Zap className="h-3 w-3" />
                        <span>Instant</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Spot Sponsored Jobs</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Instantly see which companies are investing in hiring with color-coded badges on job listings.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Sponsored companies highlighted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-secondary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Investment level displayed</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">3</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <BarChart3 className="h-3 w-3" />
                        <span>Dashboard</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Track Applications</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Sync jobs to your dashboard and track every application, interview, and follow-up in one place.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-primary/5 rounded-lg">
                      <div className="text-lg font-bold text-primary">95%</div>
                      <div className="text-xs text-muted-foreground">Response Rate</div>
                    </div>
                    <div className="text-center p-2 bg-secondary/5 rounded-lg">
                      <div className="text-lg font-bold text-secondary">3x</div>
                      <div className="text-xs text-muted-foreground">Faster</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
              <Link href="/sign-up" className="flex items-center gap-3">
                <Target className="h-5 w-5" />
                Start Finding Better Jobs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-muted/20 via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Key Features
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-serif mb-6 leading-tight">
              Everything You Need to
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">Win Your Job Search</span>
            </h2>
            <p className="text-xl text-secondary-foreground max-w-3xl mx-auto leading-relaxed">
              Built by job seekers, for job seekers. Every feature gives you a competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                    AI Powered
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Smart Detection</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  AI-powered identification of sponsored companies across 50+ job sites.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">50+ job sites supported</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">99% accuracy rate</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-secondary/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full border border-secondary/20">
                    Analytics
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Advanced Analytics</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Track response rates and identify which companies are most responsive.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-foreground">Real-time insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-foreground">Success tracking</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-500/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-semibold rounded-full border border-blue-500/20">
                    Sync
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Real-time Sync</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Instant data sync across all devices. Access your history anywhere.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Cross-platform sync</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Automatic backup</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-500/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-purple-500/10 text-purple-600 text-xs font-semibold rounded-full border border-purple-500/20">
                    Intelligence
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Company Intelligence</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Learn which companies are actively investing in hiring opportunities.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Investment tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Hiring patterns</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-green-500/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-500/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-semibold rounded-full border border-green-500/20">
                    Secure
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Privacy First</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Your data is encrypted and private. We never share with third parties.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Bank-level encryption</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">GDPR compliant</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-orange-500/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-500/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Cpu className="h-8 w-8 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-orange-500/10 text-orange-600 text-xs font-semibold rounded-full border border-orange-500/20">
                    Performance
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-foreground mb-4">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Ultra-lightweight extension with zero performance impact.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">&lt;100KB size</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Zero latency</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-secondary/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground font-playfair mb-6">
              Join <span className="text-primary">10,000+</span> Job Seekers
            </h2>
            <p className="text-xl text-secondary-foreground max-w-3xl mx-auto leading-relaxed">
              Real stories from people who transformed their job search with HireAll
            </p>
          </div>
        </div>
        <TestimonialSection />
      </section>

      {/* Final CTA Section */}
      <section className="py-28 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full text-sm font-semibold mb-10 backdrop-blur-sm border border-white/30">
              <Sparkles className="h-4 w-4" />
              Start Free Today
            </div>

            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 font-serif leading-tight">
              Stop Wasting Time on
              <span className="block text-white/95 mt-2">Dead-End Applications</span>
            </h2>

            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12">
              Join thousands landing interviews 3x faster with sponsored job intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-14">
            {userId ? (
              <Button
                asChild
                size="lg"
                className="text-2xl px-14 py-7 bg-white text-primary hover:bg-white/95 shadow-2xl font-bold rounded-2xl hover:scale-105 transition-transform"
              >
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Go to Dashboard
                  <ArrowRight className="h-6 w-6 text-primary" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="text-2xl px-14 py-7 bg-white text-primary hover:bg-white/95 shadow-2xl font-bold rounded-2xl hover:scale-105 transition-transform"
              >
                <Link href="/sign-up" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Start Free Today
                  <ArrowRight className="h-6 w-6 text-primary" />
                </Link>
              </Button>
            )}
          </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white" />
              <span>Chrome extension included</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
