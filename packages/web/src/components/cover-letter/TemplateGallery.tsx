"use client";

import React from "react";
import { Check, Layout, PenTool, Award, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CoverLetterTemplate } from "./types";

interface TemplateGalleryProps {
  selectedTemplate: CoverLetterTemplate;
  onTemplateSelect: (template: CoverLetterTemplate) => void;
}

const templates: { id: CoverLetterTemplate; name: string; description: string; icon: any; color: string }[] = [
  { 
    id: "modern", 
    name: "Modern", 
    description: "Clean, professional, and minimal", 
    icon: Layout, 
    color: "bg-blue-500" 
  },
  { 
    id: "classic", 
    name: "Classic", 
    description: "Traditional corporate look", 
    icon: Briefcase, 
    color: "bg-slate-700" 
  },
  { 
    id: "creative", 
    name: "Creative", 
    description: "Bold design for modern roles", 
    icon: PenTool, 
    color: "bg-purple-500" 
  },
  { 
    id: "executive", 
    name: "Executive", 
    description: "Elegant for senior positions", 
    icon: Award, 
    color: "bg-amber-600" 
  },
];

export function TemplateGallery({
  selectedTemplate,
  onTemplateSelect,
}: TemplateGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {templates.map((template) => {
        const Icon = template.icon;
        const isActive = selectedTemplate === template.id;

        return (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center group",
              isActive
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
            )}
          >
            {isActive && (
              <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-inner transition-transform group-hover:scale-110",
              template.color,
              "text-white"
            )}>
              <Icon className="h-6 w-6" />
            </div>

            <span className={cn(
              "font-semibold text-sm mb-1",
              isActive ? "text-primary" : "text-gray-700"
            )}>
              {template.name}
            </span>
            <span className="text-xxs text-gray-400 leading-tight">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
