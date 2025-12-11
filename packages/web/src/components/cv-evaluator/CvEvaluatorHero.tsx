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
    <div className="bg-gradient-to-br from-background via-muted/20 to-background pt-16">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <TooltipProvider>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-xl"
        >
          <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">CV Evaluator Pro</h1>
                <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
                  AI-powered CV analysis and optimization with advanced ATS scoring
                </p>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {/* Settings button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle advanced settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analysis Dashboard</h2>
              <p className="text-gray-600">Upload and analyze your CV with AI</p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
