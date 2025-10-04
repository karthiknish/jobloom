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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/15 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/25 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-secondary/30 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>500K+ Users</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium">
              <Star className="h-4 w-4" />
              <span>4.9 Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <Award className="h-4 w-4" />
              <span>AI-Powered</span>
            </div>
          </motion.div>

          <div className="text-center space-y-10 fade-in-up">

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              Never Miss a{" "}
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent font-serif">
                Sponsored Opportunity
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed px-4"
            >
              Discover exactly which companies are investing thousands in hiring. Our AI-powered platform reveals sponsored jobs across all major job sites.
            </motion.p>

            {/* Premium Stats with Animated Counters */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto px-4"
            >
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 hover:border-primary/40 transition-all shadow-lg hover:shadow-2xl">
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center mb-4"
                  >
                    <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <div className="text-6xl font-serif font-bold text-primary mb-2">95%</div>
                  <div className="text-base text-foreground font-medium">More Responses</div>
                  <div className="mt-3 text-xs text-primary/70 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+45% increase</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm rounded-3xl p-8 border border-secondary/20 hover:border-secondary/40 transition-all shadow-lg hover:shadow-2xl">
                  <motion.div 
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="flex items-center justify-center mb-4"
                  >
                    <div className="p-3 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <div className="text-6xl font-serif font-bold text-secondary mb-2">3x</div>
                  <div className="text-base text-foreground font-medium">Faster Applications</div>
                  <div className="mt-3 text-xs text-secondary/70 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Saves 6 hrs/week</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 hover:border-primary/40 transition-all shadow-lg hover:shadow-2xl">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="flex items-center justify-center mb-4"
                  >
                    <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <div className="text-6xl font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">100%</div>
                  <div className="text-base text-foreground font-medium">Privacy Protected</div>
                  <div className="mt-3 text-xs text-primary/70 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Bank-level security</span>
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
                  <Button asChild size="lg" className="btn-premium text-lg px-10 py-4 gradient-primary hover:shadow-premium-xl font-bold rounded-2xl w-full sm:w-auto">
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
                    <Button asChild size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold rounded-2xl shadow-2xl hover:shadow-primary/50 transition-all w-full sm:w-auto">
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
                      className="text-lg px-12 py-6 border-2 border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground font-semibold rounded-2xl transition-all w-full sm:w-auto"
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
            className="rounded-full w-14 h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-xl"
          >
            <Link href="/sign-up">
              <Sparkles className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              The Problem
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-serif mb-6 leading-tight">
              You&apos;re Missing Out on the
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">Best Opportunities</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Companies spend thousands promoting jobs, but you can&apos;t tell which opportunities are real priorities. This information gap costs you time and opportunities.
            </p>
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
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-10 border border-border shadow-xl hover:shadow-2xl hover:border-destructive/30 transition-all duration-500">
                <div className="absolute top-0 right-0 -translate-y-2 translate-x-2">
                  <div className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-full border border-destructive/20">
                    Critical Issue
                  </div>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                >
                  <span className="text-4xl font-bold text-destructive">?</span>
                </motion.div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Invisible Sponsorships</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-lg mb-6">
                  Sponsored jobs look identical to regular listings. You can&apos;t tell which companies are actually investing in hiring.
                </p>
                <div className="flex items-center justify-center gap-2 text-destructive/60 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>78% of applications ignored</span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-10 border border-border shadow-xl hover:shadow-2xl hover:border-orange-500/30 transition-all duration-500">
                <div className="absolute top-0 right-0 -translate-y-2 translate-x-2">
                  <div className="px-3 py-1 bg-orange-500/10 text-orange-600 text-xs font-semibold rounded-full border border-orange-500/20">
                    Major Problem
                  </div>
                </div>
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                >
                  <span className="text-4xl font-bold text-orange-600">!</span>
                </motion.div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Scattered Applications</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-lg mb-6">
                  Your job search is fragmented across platforms with no central place to track applications and follow-ups.
                </p>
                <div className="flex items-center justify-center gap-2 text-orange-600/60 text-sm">
                  <Database className="h-4 w-4" />
                  <span>6-8 platforms to manage</span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-muted/10 via-muted/5 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl p-10 border border-border shadow-xl hover:shadow-2xl hover:border-muted-foreground/30 transition-all duration-500">
                <div className="absolute top-0 right-0 -translate-y-2 translate-x-2">
                  <div className="px-3 py-1 bg-muted/10 text-muted-foreground text-xs font-semibold rounded-full border border-muted/20">
                    Time Wasted
                  </div>
                </div>
                <motion.div 
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-gradient-to-br from-muted/20 to-muted/10 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                >
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </motion.div>
                <h3 className="text-2xl font-serif font-semibold text-foreground text-center mb-4">Wasted Time & Energy</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-lg mb-6">
                  Hours spent applying to jobs without knowing which companies are serious about hiring.
                </p>
                <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-sm">
                  <RefreshCw className="h-4 w-4" />
                  <span>$2,500+ per opportunity</span>
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
