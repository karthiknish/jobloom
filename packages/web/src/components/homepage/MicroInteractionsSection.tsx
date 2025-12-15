"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  MousePointer2, 
  Sparkles, 
  FileCheck, 
  Target, 
  Zap,
  ArrowRight 
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
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30"
    >
      <div className="mb-4">{children}</div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Interactive demo: Resume Score Animation
function ResumeScoreDemo() {
  const [score, setScore] = useState(45);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Animate score from current to 95
    const targetScore = score < 90 ? 95 : 45;
    const duration = 1500;
    const steps = 30;
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
  };

  const strokeDashoffset = 283 - (283 * score) / 100;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div 
      className="relative h-32 flex items-center justify-center cursor-pointer bg-gradient-to-br from-muted to-muted/50 rounded-xl"
      onClick={handleClick}
    >
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset={strokeDashoffset}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold"
          style={{ color }}
          key={score}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">ATS Score</span>
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
        <MousePointer2 className="w-3 h-3" /> Click to optimize
      </div>
    </div>
  );
}

// Interactive demo: Sponsored Job Detection
function SponsoredJobDemo() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div 
      className="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 cursor-pointer overflow-hidden"
      onClick={() => setIsChecked(!isChecked)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <FileCheck className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">Software Engineer</div>
          <div className="text-xs text-muted-foreground">TechCorp Ltd</div>
        </div>
      </div>
      
      <motion.div
        initial={false}
        animate={isChecked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        className="absolute top-3 right-3"
      >
        <div className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-semibold rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> UK Sponsor
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={isChecked ? { width: "100%" } : { width: "0%" }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"
      />
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
        <MousePointer2 className="w-3 h-3" /> Click to check
      </div>
    </div>
  );
}

// Interactive demo: Application Pipeline
function ApplicationPipelineDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const stages = ["Applied", "Screening", "Interview", "Offer"];

  const nextStage = () => {
    setActiveStage(prev => (prev + 1) % stages.length);
  };

  return (
    <div 
      className="relative h-32 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-4 cursor-pointer"
      onClick={nextStage}
    >
      <div className="flex justify-between items-center mb-4">
        {stages.map((stage, idx) => (
          <div 
            key={stage}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              initial={false}
              animate={{ 
                backgroundColor: idx <= activeStage ? "rgb(249 115 22)" : "rgb(229 231 235)",
                scale: idx === activeStage ? 1.2 : 1
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
            >
              {idx <= activeStage && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.div>
            <span className={`text-[10px] font-medium ${idx <= activeStage ? "text-orange-600" : "text-muted-foreground"}`}>
              {stage}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress line */}
      <div className="absolute top-[42px] left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700">
        <motion.div
          initial={false}
          animate={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-orange-500"
        />
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
        <MousePointer2 className="w-3 h-3" /> Click to advance
      </div>
    </div>
  );
}

// Interactive demo: AI Writing Animation
function AIWritingDemo() {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fullText = "Dear Hiring Manager, I am excited to apply for the Senior Developer position...";

  const startTyping = () => {
    if (isTyping) return;
    setIsTyping(true);
    setText("");
    
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  return (
    <div 
      className="relative h-32 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 cursor-pointer overflow-hidden"
      onClick={startTyping}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI Cover Letter</span>
      </div>
      
      <div className="text-xs text-foreground font-mono leading-relaxed h-12 overflow-hidden">
        {text || <span className="text-muted-foreground italic">Click to generate...</span>}
        {isTyping && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-1.5 h-3 bg-purple-500 ml-0.5"
          />
        )}
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
        <MousePointer2 className="w-3 h-3" /> Click to write
      </div>
    </div>
  );
}

export function MicroInteractionsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="container px-4 md:px-6 mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Target className="w-4 h-4 mr-2" />
            Interactive Demo
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            See the magic in action
          </h2>
          <p className="text-lg text-muted-foreground">
            Click on each card to experience how HireAll transforms your job search. 
            These aren&apos;t just mockups—they&apos;re real interactions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <InteractionCard
            title="ATS Resume Optimizer"
            description="Upload your resume and watch your ATS score jump from failing to passing in seconds."
            delay={0.1}
          >
            <ResumeScoreDemo />
          </InteractionCard>

          <InteractionCard
            title="UK Sponsor Detection"
            description="Instantly verify if a company can sponsor your UK work visa. No more guessing."
            delay={0.2}
          >
            <SponsoredJobDemo />
          </InteractionCard>

          <InteractionCard
            title="Application Tracker"
            description="Visualize your entire job pipeline. Know exactly where each application stands."
            delay={0.3}
          >
            <ApplicationPipelineDemo />
          </InteractionCard>

          <InteractionCard
            title="AI Cover Letters"
            description="Generate personalized cover letters that capture attention in seconds, not hours."
            delay={0.4}
          >
            <AIWritingDemo />
          </InteractionCard>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
