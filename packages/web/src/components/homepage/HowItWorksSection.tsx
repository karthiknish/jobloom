"use client";

import { motion } from "framer-motion";
import { Download, Target, RefreshCw, Check, ArrowRight, Sparkles, Zap } from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "Install Extension",
    description: "Add the HireAll Chrome extension to your browser in 30 seconds. No credit card required.",
    step: 1,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50"
  },
  {
    icon: Target,
    title: "Highlight Jobs",
    description: "Browse any job board (LinkedIn, Indeed, etc.) and highlight job descriptions that interest you.",
    step: 2,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50"
  },
  {
    icon: RefreshCw,
    title: "Get Instant Analysis",
    description: "Receive real-time sponsorship eligibility checks, ATS scores, and personalized improvement suggestions.",
    step: 3,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50"
  },
  {
    icon: Check,
    title: "Apply with Confidence",
    description: "Apply knowing your resume is optimized and you meet the sponsorship requirements.",
    step: 4,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50"
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, currentColor 2px, transparent 2px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simple Process</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            How It Works
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed"
          >
            Get started in minutes and transform your job search experience with our intelligent tools.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection Line Background */}
          <div className="hidden lg:block absolute top-16 left-16 right-16 h-0.5 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10"></div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                {/* Enhanced Connection Lines */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5">
                    <div className="h-full bg-gradient-to-r from-primary/30 to-transparent animate-pulse"></div>
                    <ArrowRight className="absolute top-1/2 -translate-y-1/2 right-0 h-4 w-4 text-primary/50" />
                  </div>
                )}
                
                <div className={`relative p-8 rounded-2xl ${step.bgColor} border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                  {/* Step Number and Icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-white to-white/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <span className="text-3xl font-bold text-primary">{step.step}</span>
                    </div>
                    
                    {/* Floating Icon */}
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300"
                    >
                      <step.icon className="h-6 w-6" />
                    </motion.div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-lg group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
              <Download className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Ready to get started?</div>
              <div className="text-sm text-muted-foreground">Free to use • No credit card required • Works everywhere</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
