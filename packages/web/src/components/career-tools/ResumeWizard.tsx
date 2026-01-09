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
import type { ResumeMode } from "./useCareerToolsState";

interface ResumeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (next: { section: CareerToolsSection; resumeMode?: ResumeMode }) => void;
}

type WizardOption = {
  key: string;
  id: CareerToolsSection;
  resumeMode?: ResumeMode;
  icon: any;
  title: string;
  description: string;
  features: string[];
  color: string;
  bg: string;
  border: string;
};

const options: WizardOption[] = [
  {
    key: "cv-optimizer",
    id: "cv-optimizer" as CareerToolsSection,
    icon: FileSearch,
    title: "Optimize Existing CV",
    description: "Upload your current resume to get an ATS score and AI-powered improvement tips",
    features: ["ATS compatibility check", "Keyword analysis", "Score history"],
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    key: "resume-ai",
    id: "resume" as CareerToolsSection,
    resumeMode: "ai" as ResumeMode,
    icon: Sparkles,
    title: "Generate New CV with AI",
    description: "Create a tailored resume from scratch using our industry-leading AI models",
    features: ["AI-powered content", "Industry optimization", "Instant drafts"],
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    key: "resume-manual",
    id: "resume" as CareerToolsSection,
    resumeMode: "manual" as ResumeMode,
    icon: PenTool,
    title: "Guided CV Builder",
    description: "Craft your perfect resume step-by-step with real-time formatting control",
    features: ["Full control", "Multiple templates", "Export to PDF"],
    color: "text-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20 hover:border-green-500/40",
  },
  {
    key: "import",
    id: "import" as CareerToolsSection,
    icon: Upload,
    title: "Import & Edit CV",
    description: "Import data from an existing file to quickly jumpstart your next version",
    features: ["PDF/Word support", "Auto-parsing", "Smart field mapping"],
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/40",
  },
];

export function ResumeWizard({ open, onOpenChange, onSelectOption }: ResumeWizardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleSelect = (section: CareerToolsSection, resumeMode?: ResumeMode) => {
    onSelectOption({ section, resumeMode });
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
                key={option.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${option.border} ${
                    hoveredOption === option.key ? "shadow-lg scale-[1.02]" : ""
                  }`}
                  onMouseEnter={() => setHoveredOption(option.key)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => handleSelect(option.id, option.resumeMode)}
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
