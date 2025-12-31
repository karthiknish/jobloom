import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Maximize2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ResumeGeneratorFormData } from '../types';
import { resumeStyles } from '../constants';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Step3TemplateSelectionProps {
  formData: ResumeGeneratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<ResumeGeneratorFormData>>;
  resumeOptions: any;
  setResumeOptions: React.Dispatch<React.SetStateAction<any>>;
}

export const Step3TemplateSelection: React.FC<Step3TemplateSelectionProps> = ({ 
  formData, 
  setFormData, 
  resumeOptions, 
  setResumeOptions 
}) => {
  const [previewTemplate, setPreviewTemplate] = React.useState<string | null>(null);

  const templateStyles: Record<string, { bg: string; header: string; accent: string; font: string; split?: boolean }> = {
    modern: { bg: "bg-white", header: "bg-slate-800 text-white", accent: "text-blue-600", font: "font-sans" },
    classic: { bg: "bg-white", header: "bg-white border-b-2 border-black", accent: "text-gray-800", font: "font-serif" },
    creative: { bg: "bg-gradient-to-br from-purple-50 to-pink-50", header: "bg-gradient-to-r from-purple-600 to-pink-500 text-white", accent: "text-purple-600", font: "font-sans" },
    tech: { bg: "bg-slate-50", header: "bg-emerald-700 text-white", accent: "text-emerald-600", font: "font-mono" },
    startup: { bg: "bg-white border text-slate-800", header: "bg-slate-50 border-r text-slate-800", accent: "text-indigo-600", font: "font-sans", split: true },
    academic: { bg: "bg-white", header: "bg-white", accent: "text-gray-900 border-b", font: "font-serif" },
    executive: { bg: "bg-slate-50", header: "bg-slate-900 text-white", accent: "text-slate-800", font: "font-serif" },
    designer: { bg: "bg-white", header: "bg-rose-500 text-white", accent: "text-rose-600", font: "font-sans" },
    healthcare: { bg: "bg-white", header: "bg-teal-600 text-white", accent: "text-teal-600", font: "font-sans" },
    legal: { bg: "bg-white", header: "bg-white border-b-4 border-slate-900", accent: "text-slate-900", font: "font-serif" },
  };

  const renderPreview = (templateKey: string, isFull: boolean = false) => {
    const ts = templateStyles[templateKey] || templateStyles.modern;
    const displayName = formData.fullName || "Your Name";
    const displayTitle = formData.jobTitle || "Job Title";
    const displaySkills = formData.skills.length > 0 ? formData.skills.slice(0, 5) : ["Leadership", "Communication", "Problem Solving"];
    
    const scale = isFull ? "text-[12px] leading-normal" : "text-[6px] leading-tight";
    const headerScale = isFull ? "text-[24px]" : "text-[8px]";
    const subHeaderScale = isFull ? "text-[14px]" : "text-[5px]";
    const padding = isFull ? "p-8" : "p-2";
    const innerPadding = isFull ? "p-8" : "p-1.5";
    const gap = isFull ? "gap-6" : "gap-1";
    const summaryLines = isFull ? "" : "line-clamp-2";

    return (
      <div className={cn("w-full h-full overflow-hidden transition-all duration-300", ts.bg, padding)}>
        <div className={cn("rounded-sm shadow-sm overflow-hidden h-full flex flex-col bg-white border", scale, ts.font)}>
          {/* Header */}
          <div className={cn("p-4 text-center border-b", ts.header, isFull && "py-10")}>
            <div className={cn("font-bold truncate", headerScale)}>{displayName}</div>
            <div className={cn("opacity-80 truncate", subHeaderScale)}>{displayTitle}</div>
            {isFull && (
              <div className="mt-4 flex justify-center gap-4 text-xs opacity-70">
                <span>city.name@email.com</span>
                <span>•</span>
                <span>+1 234 567 890</span>
                <span>•</span>
                <span>linkedin.com/in/profile</span>
              </div>
            )}
          </div>
          {/* Body */}
          <div className={cn("flex-1 flex", ts.split ? "flex-row" : "flex-col", innerPadding, gap)}>
            {ts.split && (
              <div className={cn("border-r border-gray-100 space-y-4", isFull ? "w-1/4 pr-4" : "w-1/3 pr-1")}>
                <div className="space-y-1">
                  <div className={cn("font-bold uppercase tracking-wider mb-2", ts.accent, isFull ? "text-[12px]" : "text-[5px]")}>Contact</div>
                  <div className="w-full h-1 bg-gray-100 rounded-full" />
                  <div className="w-full h-1 bg-gray-100 rounded-full" />
                  <div className="w-2/3 h-1 bg-gray-100 rounded-full" />
                </div>
                <div className="space-y-1">
                  <div className={cn("font-bold uppercase tracking-wider mb-2", ts.accent, isFull ? "text-[12px]" : "text-[5px]")}>Education</div>
                  <div className="w-full h-1 bg-gray-100 rounded-full" />
                  <div className="w-3/4 h-1 bg-gray-100 rounded-full" />
                </div>
              </div>
            )}
            <div className={cn("flex-1 space-y-4", ts.split && (isFull ? "pl-4" : "pl-1"))}>
              <div>
                <div className={cn("font-bold uppercase tracking-wider mb-1", ts.accent, isFull ? "text-[14px]" : "text-[5px]")}>Professional Summary</div>
                <div className={cn("text-gray-600", summaryLines)}>
                  Highly motivated and results-driven professional with extensive experience in delivering innovative solutions. 
                  Demonstrated ability to lead cross-functional teams and drive strategic initiatives to success.
                </div>
              </div>
              <div>
                <div className={cn("font-bold uppercase tracking-wider mb-1", ts.accent, isFull ? "text-[14px]" : "text-[5px]")}>Key Skills</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {displaySkills.map((skill, i) => (
                    <span key={i} className={cn("bg-slate-100 text-slate-700 rounded-md", isFull ? "px-2 py-1" : "px-0.5 py-0.25")}>{skill}</span>
                  ))}
                </div>
              </div>
              {isFull && (
                <div>
                  <div className={cn("font-bold uppercase tracking-wider mb-1", ts.accent, "text-[14px]")}>Experience</div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>Lead Specialist</span>
                        <span className="text-muted-foreground">2020 - Present</span>
                      </div>
                      <div className="text-muted-foreground italic">Global Innovation Corp</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                        <li>Directed high-impact projects resulting in 25% increase in efficiency.</li>
                        <li>Mentored a team of 10+ junior associates, improving retention by 15%.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resumeStyles.map((style) => (
          <div 
            key={style.value}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300",
              formData.style === style.value 
                ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            {/* Action Overlay */}
            <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(style.value);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Full Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Live Preview Container */}
            <div 
              className="relative w-full h-56 cursor-pointer overflow-hidden border-b"
              onClick={() => {
                setFormData((prev: ResumeGeneratorFormData) => ({ ...prev, style: style.value }));
                setResumeOptions((prev: any) => ({ ...prev, template: style.value as any }));
              }}
            >
              {renderPreview(style.value)}
              
              {/* Selection Indicator */}
              {formData.style === style.value && (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                  <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-xl animate-in zoom-in-50 duration-300">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div 
              className="p-4 bg-card cursor-pointer"
              onClick={() => {
                setFormData((prev: ResumeGeneratorFormData) => ({ ...prev, style: style.value }));
                setResumeOptions((prev: any) => ({ ...prev, template: style.value as any }));
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-sm tracking-tight">{style.label}</h4>
                {formData.style === style.value && (
                  <Badge variant="default" className="text-xxs px-1.5 py-0">Selected</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{style.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-900 border-none h-[90vh]">
          <DialogHeader className="p-4 bg-slate-800 text-white border-b border-slate-700">
            <DialogTitle className="flex items-center justify-between font-normal">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Template Preview: {resumeStyles.find(s => s.value === previewTemplate)?.label}
              </span>
              <Button 
                size="sm" 
                variant="default" 
                onClick={() => {
                  if (previewTemplate) {
                    setFormData((prev: ResumeGeneratorFormData) => ({ ...prev, style: previewTemplate }));
                    setResumeOptions((prev: any) => ({ ...prev, template: previewTemplate as any }));
                    setPreviewTemplate(null);
                  }
                }}
              >
                Use This Template
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
            <div className="w-full max-w-[800px] shadow-2xl scale-100 origin-top">
              {previewTemplate && renderPreview(previewTemplate, true)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-bold text-sm">Visual Customization</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Scheme</Label>
            <Select 
              value={resumeOptions.colorScheme} 
              onValueChange={(val: any) => setResumeOptions((prev: any) => ({ ...prev, colorScheme: val }))}
            >
              <SelectTrigger className="h-10 bg-background shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hireall">Hireall Teal</SelectItem>
                <SelectItem value="blue">Professional Blue</SelectItem>
                <SelectItem value="gray">Elegant Gray</SelectItem>
                <SelectItem value="green">Nature Green</SelectItem>
                <SelectItem value="purple">Creative Purple</SelectItem>
                <SelectItem value="orange">Warm Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font Family</Label>
            <Select 
              value={resumeOptions.font} 
              onValueChange={(val: any) => setResumeOptions((prev: any) => ({ ...prev, font: val }))}
            >
              <SelectTrigger className="h-10 bg-background shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="helvetica">Helvetica (Modern)</SelectItem>
                <SelectItem value="times">Times (Classic)</SelectItem>
                <SelectItem value="courier">Courier (Technical)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
