"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Star, Cpu, Sparkles, Zap, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-2 h-2 bg-primary rounded-full animate-ping opacity-20"></div>
        <div className="absolute bottom-32 left-40 w-3 h-3 bg-secondary rounded-full animate-ping opacity-15" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary rounded-full animate-ping opacity-25" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-accent rounded-full animate-pulse opacity-10" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-primary rounded-full animate-ping opacity-20" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Enhanced Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">500K+ Users</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-orange-25 transition-all">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-foreground group-hover:text-yellow-600 transition-colors">4.9 Rating</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-25 transition-all">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">AI-Powered</div>
          </motion.div>
        </motion.div>

        <div className="text-center space-y-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight"
          >
            <div className="relative">
              <span className="relative z-10 text-foreground">Never Miss a</span>
              <div className="absolute -bottom-2 left-0 right-0 h-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full -z-10 transform -rotate-1 blur-sm"></div>
            </div>
            <div className="block mt-4 relative">
              <span className="relative z-10 font-serif text-primary">Sponsored Opportunity</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur-sm"></div>
              <Sparkles className="absolute -top-2 -right-8 h-6 w-6 text-primary animate-pulse" />
            </div>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed px-4"
          >
            <div className="relative">
              <span className="font-semibold text-foreground">Highlight sponsored jobs on any job board</span> and get instant 
              <span className="text-primary font-bold"> UK sponsorship eligibility</span>, 
              <span className="text-secondary font-bold"> ATS optimization</span>, and 
              <span className="text-accent font-bold"> AI-powered improvements</span> — 
              all in one seamless workflow.
            </div>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
          >
            <Link href="/sign-in">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 h-14 group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300">
                <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 h-14 border-2 hover:bg-accent/10 hover:border-accent/50 hover:shadow-accent/10 transition-all duration-300">
                <Shield className="mr-2 h-5 w-5" />
                Create Account
              </Button>
            </Link>
          </motion.div>

          {/* Enhanced Extension Install CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 flex justify-center"
          >
            <Link 
              href="https://chrome.google.com/webstore/detail/hireall-sponsored-job-fin/xxxxx"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground group hover:bg-accent/5 transition-all duration-300">
                <div className="w-6 h-6 mr-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-blue-700 transition-all">
                  <div className="w-3.5 h-3.5 bg-white rounded-sm"></div>
                </div>
                <span className="font-medium">Install Chrome Extension</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
