"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CvEvaluatorHeroProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

export function CvEvaluatorHero({ showAdvanced, setShowAdvanced }: CvEvaluatorHeroProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <TooltipProvider>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="gradient-primary shadow-premium-xl relative overflow-hidden"
        >
          {/* Premium background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full filter blur-2xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-serif font-bold text-white tracking-tight">CV Evaluator Pro</h1>
              <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-3xl leading-relaxed">
                AI-powered CV analysis and optimization with advanced ATS scoring
              </p>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analysis Dashboard</h2>
              <p className="text-gray-600">Upload and analyze your CV with AI</p>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={showAdvanced ? "bg-blue-50 text-blue-600" : ""}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle advanced settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
