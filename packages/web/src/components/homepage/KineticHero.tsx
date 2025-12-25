"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, FileText, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Marquee from "@/components/ui/Marquee";
import { animations } from "@/styles/animations";

const words = ["HIRED", "PROMOTED", "NOTICED", "CONFIDENT"];

export function KineticHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Kinetic Typography */}
          <div className="space-y-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: animations.duration.slow }}
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              v2.0 Now Live
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.1]">
              DON'T JUST APPLY. <br />
              GET <span className="text-primary inline-block min-w-0 sm:min-w-[300px]">
                {words[index]}
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              The job market is noisy. We provide the signal. 
              Our AI tools cut through the ATS clutter and put your profile on top of the stack.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 motion-button"
              >
                <Link href="/sign-up">
                  Start Building Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted transition-colors duration-fast"
              >
                <Link href="#features" scroll={false} onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}>View Features</Link>
              </Button>
            </div>

          </div>

          {/* Mobile: Horizontal Scrollable Feature Cards */}
          <div className="lg:hidden mt-8 -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {/* Card 1: Resume Score */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="min-w-[280px] snap-center bg-card rounded-2xl shadow-lg border border-border p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-foreground">Resume Score</h3>
                  <p className="text-muted-foreground text-sm">Optimized for ATS</p>
                </div>
                <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-bold text-lg text-primary">
                  98
                </div>
              </motion.div>

              {/* Card 2: AI Generation */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="min-w-[280px] snap-center bg-slate-900 text-white rounded-2xl shadow-lg p-5"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-bold mb-1">AI Cover Letter</h3>
                <p className="text-sm opacity-80 font-mono">Draft generated in seconds.</p>
              </motion.div>

              {/* Card 3: Job Match */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="min-w-[280px] snap-center bg-card rounded-2xl shadow-lg border border-border p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Perfect Match</h4>
                    <p className="text-xs text-muted-foreground">Senior Developer</p>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-success h-full w-[92%]"></div>
                </div>
              </motion.div>

              {/* Card 4: Upload */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="min-w-[280px] snap-center bg-gradient-to-br from-primary to-emerald-600 rounded-2xl shadow-lg p-5 flex flex-col items-center justify-center text-white text-center"
              >
                <FileText className="h-8 w-8 mb-2 opacity-90" />
                <h3 className="font-bold">Upload CV</h3>
                <p className="text-xs opacity-80 mt-1">PDF or DOCX</p>
              </motion.div>
            </div>
          </div>

          {/* Right: Bento-style Hero Visual (Desktop only) */}
          <div className="relative h-[600px] w-full hidden lg:block">
            {/* Abstract Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-50" />

            {/* Floating Cards Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-4 p-4 h-full">
              
              {/* Card 1: Resume Score */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: animations.duration.normal }}
                className="col-span-2 bg-card rounded-2xl shadow-xl border border-border p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-foreground">Resume Score</h3>
                  <p className="text-muted-foreground text-sm">Optimized for ATS</p>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-bold text-xl text-primary">
                  98
                </div>
              </motion.div>

              {/* Card 2: AI Generation */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: animations.duration.normal }}
                className="row-span-2 bg-slate-900 text-white rounded-2xl shadow-xl p-6 flex flex-col justify-between overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Sparkles className="h-24 w-24" />
                </div>
                <div>
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">AI Cover Letter</h3>
                  <div className="space-y-2 opacity-80 text-sm font-mono">
                    <p className="typing-effect">Analyzing job description...</p>
                    <p className="typing-effect delay-100">Matching skills...</p>
                    <p className="typing-effect delay-200 text-primary">Draft generated.</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-none">
                  Generate Now
                </Button>
              </motion.div>

              {/* Card 3: Job Match */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: animations.duration.normal }}
                className="bg-card rounded-2xl shadow-xl border border-border p-6 flex flex-col justify-center"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Perfect Match</h4>
                    <p className="text-xs text-muted-foreground">Senior Developer</p>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-success h-full w-[92%]"></div>
                </div>
              </motion.div>

              {/* Card 4: Upload */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: animations.duration.normal }}
                className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-white text-center cursor-pointer motion-surface"
              >
                <FileText className="h-10 w-10 mb-3 opacity-90" />
                <h3 className="font-bold">Upload CV</h3>
                <p className="text-xs opacity-80 mt-1">PDF or DOCX</p>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Marquee Strip */}
      <div className="mt-20 border-y border-border bg-muted/30 py-6">
        <Marquee pauseOnHover className="[--duration:40s]">
          {[
            { name: "Google", logo: "/logos/google.svg" },
            { name: "Microsoft", logo: "/logos/microsoft.svg" },
            { name: "Amazon", logo: "/logos/amazon.svg" },
            { name: "Netflix", logo: "/logos/netflix.svg" },
            { name: "Meta", logo: "/logos/meta.svg" },
            { name: "Spotify", logo: "/logos/spotify.svg" },
            { name: "Airbnb", logo: "/logos/airbnb.svg" },
            { name: "Uber", logo: "/logos/uber.svg" },
          ].map((company) => (
            <div key={company.name} className="mx-6 flex items-center justify-center">
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-10 max-w-[150px] object-contain opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-medium" 
              />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
