"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, PenTool, Upload, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CareerToolsSection } from "./CareerToolsSidebar";

interface ResumeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (section: CareerToolsSection) => void;
}

const options = [
  {
    id: "analyze" as CareerToolsSection,
    icon: FileSearch,
    title: "Analyze My Resume",
    description: "Get ATS score and improvement suggestions for your existing resume",
    features: ["ATS compatibility check", "Keyword analysis", "Improvement tips"],
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    id: "ai-generator" as CareerToolsSection,
    icon: Sparkles,
    title: "Generate with AI",
    description: "Let AI create a professional resume based on your experience",
    features: ["AI-powered content", "Industry optimization", "ATS-friendly"],
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    id: "manual" as CareerToolsSection,
    icon: PenTool,
    title: "Build From Scratch",
    description: "Create your resume step-by-step with our guided builder",
    features: ["Full control", "Real-time preview", "Multiple templates"],
    color: "text-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20 hover:border-green-500/40",
  },
  {
    id: "import" as CareerToolsSection,
    icon: Upload,
    title: "Import Existing",
    description: "Upload your resume file to edit and enhance it",
    features: ["PDF/Word support", "Auto-parsing", "Easy editing"],
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/40",
  },
];

export function ResumeWizard({ open, onOpenChange, onSelectOption }: ResumeWizardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleSelect = (section: CareerToolsSection) => {
    onSelectOption(section);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">What would you like to do?</DialogTitle>
          <DialogDescription className="text-base">
            Choose the best option for your resume needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${option.border} ${
                    hoveredOption === option.id ? "shadow-lg scale-[1.02]" : ""
                  }`}
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => handleSelect(option.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${option.bg}`}>
                        <option.icon className={`h-6 w-6 ${option.color}`} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {option.title}
                          <ArrowRight
                            className={`h-4 w-4 transition-transform ${
                              hoveredOption === option.id ? "translate-x-1 opacity-100" : "opacity-0"
                            }`}
                          />
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {option.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-center pt-4 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            I&apos;ll explore on my own
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
