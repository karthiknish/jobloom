"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, FileText, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Marquee from "@/components/ui/Marquee";

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
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Kinetic Typography */}
          <div className="space-y-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-800"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              v2.0 Now Live
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1]">
              DON'T JUST APPLY. <br />
              GET <span className="text-primary inline-block min-w-[300px]">
                {words[index]}
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              The job market is noisy. We provide the signal. 
              Our AI tools cut through the ATS clutter and put your profile on top of the stack.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
                Start Building Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-slate-50">
                View Demo
              </Button>
            </div>

            <div className="pt-8 flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Joined by 40,000+ job seekers</p>
            </div>
          </div>

          {/* Right: Bento-style Hero Visual */}
          <div className="relative h-[600px] w-full hidden lg:block">
            {/* Abstract Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-50" />

            {/* Floating Cards Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-4 p-4 h-full">
              
              {/* Card 1: Resume Score */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-800">Resume Score</h3>
                  <p className="text-slate-500 text-sm">Optimized for ATS</p>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-bold text-xl text-primary">
                  98
                </div>
              </motion.div>

              {/* Card 2: AI Generation */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
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
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col justify-center"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Perfect Match</h4>
                    <p className="text-xs text-slate-500">Senior Developer</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[92%]"></div>
                </div>
              </motion.div>

              {/* Card 4: Upload */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-white text-center cursor-pointer hover:scale-[1.02] transition-transform"
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
      <div className="mt-20 border-y border-slate-100 bg-slate-50/50 py-8">
        <Marquee pauseOnHover className="[--duration:30s]">
          {["Google", "Microsoft", "Amazon", "Netflix", "Meta", "Spotify", "Airbnb", "Uber"].map((company) => (
            <div key={company} className="mx-8 text-xl font-bold text-slate-300 uppercase tracking-widest">
              {company}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
