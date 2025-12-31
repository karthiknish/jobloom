import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ResumeGeneratorFormData } from '../types';

interface Step4GenerationOptionsProps {
  formData: ResumeGeneratorFormData;
  resumeOptions: any;
  atsOptimization: boolean;
  setAtsOptimization: (val: boolean) => void;
  aiEnhancement: boolean;
  setAiEnhancement: (val: boolean) => void;
}

export const Step4GenerationOptions: React.FC<Step4GenerationOptionsProps> = ({ 
  formData, 
  resumeOptions,
  atsOptimization,
  setAtsOptimization,
  aiEnhancement,
  setAiEnhancement
}) => {
  return (
    <motion.div 
      key="step-4"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h4 className="font-bold text-sm">AI Generation Strategy</h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border shadow-sm">
            <div className="space-y-0.5">
              <Label className="font-semibold text-sm">ATS Optimization</Label>
              <p className="text-xs text-muted-foreground">Tailor content for algorithmic parsing</p>
            </div>
            <Switch 
              checked={atsOptimization} 
              onCheckedChange={setAtsOptimization} 
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border shadow-sm">
            <div className="space-y-0.5">
              <Label className="font-semibold text-sm">AI Tone Enhancement</Label>
              <p className="text-xs text-muted-foreground">Make impact statements more powerful</p>
            </div>
            <Switch 
              checked={aiEnhancement} 
              onCheckedChange={setAiEnhancement} 
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-muted/20">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5" />
          Review Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-semibold">{formData.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Role:</span>
            <span className="font-semibold">{formData.jobTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Template:</span>
            <span className="font-semibold capitalize">{formData.style || resumeOptions.template}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
