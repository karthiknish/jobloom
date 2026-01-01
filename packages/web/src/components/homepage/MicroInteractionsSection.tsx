"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { animations } from "@/styles/animations";
import { 
  MousePointer2, 
  Sparkles, 
  FileCheck, 
  Target, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Search,
  Briefcase,
  Trophy
} from "lucide-react";

interface InteractionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

function InteractionCard({ title, description, children, delay = 0 }: InteractionCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: animations.duration.normal, delay }}
      className="group relative bg-card rounded-2xl border border-border p-6 motion-card overflow-hidden"
    >
      {/* Hover Glow Effect - Simplified */}
      <div className="absolute -inset-px bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-medium pointer-events-none" />
      
      <div className="relative z-10">
        <div className="mb-6">{children}</div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-xxs font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
            Live Demo
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Interactive demo: Resume Score Animation
function ResumeScoreDemo() {
  const [score, setScore] = useState(45);
  const [isAnimating, setIsAnimating] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "done">("idle");

  const handleClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStatus("scanning");
    
    // Simulate scanning phase
    setTimeout(() => {
      setStatus("done");
      const targetScore = score < 90 ? 95 : 45;
      const duration = 1000;
      const steps = 20;
      const increment = (targetScore - score) / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        setScore(prev => Math.round(prev + increment));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setScore(targetScore);
          setIsAnimating(false);
        }
      }, duration / steps);
    }, 800);
  };

  const strokeDashoffset = 283 - (283 * score) / 100;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div 
      className="relative h-40 flex items-center justify-center cursor-pointer bg-gradient-to-br from-muted/50 to-muted rounded-xl border border-border/50 group/demo"
      onClick={handleClick}
    >
      <div className="relative">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-border/30"
          />
          <motion.circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {status === "scanning" ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <Search className="w-6 h-6 text-primary animate-pulse" />
                <span className="text-xxs font-bold text-primary mt-1">SCANNING</span>
              </motion.div>
            ) : (
              <motion.div
                key="score"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl font-black tracking-tighter" style={{ color }}>
                  {score}%
                </span>
                <span className="text-xxs font-bold text-muted-foreground uppercase tracking-widest">ATS Score</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scanning line effect */}
      {status === "scanning" && (
        <motion.div 
          className="absolute inset-x-0 h-0.5 bg-primary/30 z-20"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="absolute bottom-3 right-3 text-xxs font-bold text-muted-foreground flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
        <MousePointer2 className="w-3 h-3 text-primary" /> CLICK TO OPTIMIZE
      </div>
    </div>
  );
}

// Interactive demo: Sponsored Job Detection
function SponsoredJobDemo() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div 
      className="relative h-40 bg-gradient-to-br from-blue-50/50 to-indigo-50/50   rounded-xl p-5 cursor-pointer overflow-hidden border border-border/50 group/demo"
      onClick={() => setIsChecked(!isChecked)}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white  shadow-sm flex items-center justify-center border border-border/50 group-hover/demo:scale-110 transition-transform duration-300">
          <Briefcase className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-foreground leading-tight">Senior Product Designer</div>
          <div className="text-sm text-muted-foreground mt-0.5">GlobalTech Solutions</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-blue-400/50" />
            </div>
            <span className="text-xxs text-muted-foreground font-medium">Promoted</span>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="px-3 py-1.5 bg-emerald-500 text-white text-xxs font-black rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 border border-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> UK SPONSOR VERIFIED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={isChecked ? { height: "100%", opacity: 0.05 } : { height: "0%", opacity: 0 }}
        className="absolute inset-0 bg-emerald-500 pointer-events-none"
      />

      <motion.div
        initial={false}
        animate={isChecked ? { width: "100%" } : { width: "0%" }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"
      />
      
      <div className="absolute bottom-3 right-3 text-xxs font-bold text-muted-foreground flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
        <MousePointer2 className="w-3 h-3 text-primary" /> CLICK TO VERIFY
      </div>
    </div>
  );
}

// Interactive demo: Application Pipeline
function ApplicationPipelineDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const stages = [
    { label: "Applied", icon: FileCheck },
    { label: "Screening", icon: Search },
    { label: "Offer", icon: Trophy }
  ];

  const nextStage = () => {
    setActiveStage(prev => (prev + 1) % stages.length);
  };

  return (
    <div 
      className="relative h-40 bg-gradient-to-br from-orange-50/50 to-amber-50/50   rounded-xl p-5 cursor-pointer border border-border/50 group/demo"
      onClick={nextStage}
    >
      <div className="flex justify-between items-center relative z-10">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === activeStage;
          const isCompleted = idx < activeStage;
          
          return (
            <div key={stage.label} className="flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{ 
                  backgroundColor: isActive || isCompleted ? "rgb(249 115 22)" : "rgb(255 255 255)",
                  borderColor: isActive || isCompleted ? "rgb(249 115 22)" : "rgb(229 231 235)",
                  scale: isActive ? 1.2 : 1,
                  boxShadow: isActive ? "0 0 20px rgba(249, 115, 22, 0.4)" : "none"
                }}
                className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors duration-300"
              >
                <Icon className={`w-5 h-5 ${isActive || isCompleted ? "text-white" : "text-muted-foreground"}`} />
              </motion.div>
              <span className={`text-xxs font-black uppercase tracking-tighter ${isActive ? "text-orange-600" : "text-muted-foreground"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress line */}
      <div className="absolute top-[44px] left-10 right-10 h-1 bg-muted  rounded-full overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
        />
      </div>

      {activeStage === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-full h-full bg-orange-500/10 animate-pulse rounded-xl" />
        </motion.div>
      )}
      
      <div className="absolute bottom-3 right-3 text-xxs font-bold text-muted-foreground flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
        <MousePointer2 className="w-3 h-3 text-primary" /> CLICK TO ADVANCE
      </div>
    </div>
  );
}

// Interactive demo: AI Writing Animation
function AIWritingDemo() {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const fullText = "I am writing to express my strong interest in the Senior Developer position at GlobalTech. With 5+ years of experience in React and Node.js...";

  const startTyping = () => {
    if (isTyping || isThinking) return;
    setIsThinking(true);
    setText("");
    
    // Simulate AI thinking
    setTimeout(() => {
      setIsThinking(false);
      setIsTyping(true);
      
      let i = 0;
      const interval = setInterval(() => {
        setText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 25);
    }, 1000);
  };

  return (
    <div 
      className="relative h-40 bg-gradient-to-br from-purple-50/50 to-pink-50/50   rounded-xl p-5 cursor-pointer overflow-hidden border border-border/50 group/demo"
      onClick={startTyping}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black text-purple-600  uppercase tracking-widest">AI WRITER</span>
        </div>
        {isTyping && (
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 bg-purple-500 rounded-full"
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="text-xs text-foreground font-mono leading-relaxed h-16 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-purple-500/70 italic"
            >
              <Sparkles className="w-3 h-3 animate-spin" />
              Analyzing job description...
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {text || <span className="text-muted-foreground/50 italic">Click to generate personalized cover letter...</span>}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-1.5 h-3.5 bg-purple-500 ml-1 align-middle"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-3 right-3 text-xxs font-bold text-muted-foreground flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
        <MousePointer2 className="w-3 h-3 text-primary" /> CLICK TO WRITE
      </div>
    </div>
  );
}

export function MicroInteractionsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-primary" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
      
      <div className="container px-4 md:px-6 mx-auto relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-8 shadow-sm"
          >
            <Target className="w-3.5 h-3.5 mr-2" />
            Interactive Experience
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
            Experience the <span className="text-primary">HireAll</span> difference
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Don&apos;t just take our word for it. Interact with our core features below 
            and see how we&apos;ve reimagined the modern job search.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <InteractionCard
            title="ATS Optimizer"
            description="Instantly identify missing keywords and optimize your resume for specific job descriptions."
            delay={0.1}
          >
            <ResumeScoreDemo />
          </InteractionCard>

          <InteractionCard
            title="Sponsor Check"
            description="Our proprietary engine verifies UK visa sponsorship status directly on LinkedIn job posts."
            delay={0.2}
          >
            <SponsoredJobDemo />
          </InteractionCard>

          <InteractionCard
            title="Smart Pipeline"
            description="A beautiful, drag-and-drop interface to manage your applications from first contact to offer."
            delay={0.3}
          >
            <ApplicationPipelineDemo />
          </InteractionCard>

          <InteractionCard
            title="AI Assistant"
            description="Generate high-converting cover letters and application responses tailored to your unique profile."
            delay={0.4}
          >
            <AIWritingDemo />
          </InteractionCard>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: animations.duration.normal }}
          className="text-center mt-20"
        >
          <div className="inline-flex flex-col items-center gap-6">
            <a
              href="/sign-up"
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg motion-button overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-ultra-slow" />
              Start Your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-fast" />
            </a>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required • Free forever plan
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
