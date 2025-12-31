"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  User, 
  Briefcase, 
  Layers, 
  Zap, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { useAIResumeState } from "./useAIResumeState";
import { useAIResumeGeneration } from "./useAIResumeGeneration";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2ProfessionalInfo } from "./steps/Step2ProfessionalInfo";
import { Step3TemplateSelection } from "./steps/Step3TemplateSelection";
import { Step4GenerationOptions } from "./steps/Step4GenerationOptions";
import { ResumeOutput } from "./ResumeOutput";
import { containerVariants } from "./constants";

const totalSteps = 4;

export const AIResumeGenerator: React.FC = () => {
  const { toast } = useToast();
  const {
    step,
    setStep,
    generatedResume,
    setGeneratedResume,
    formData,
    setFormData,
    resumeOptions,
    setResumeOptions,
    nextStep,
    prevStep,
    addSkill,
    removeSkill,
    editedContent,
    setEditedContent
  } = useAIResumeState();

  const [atsOptimization, setAtsOptimization] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);

  const {
    isGenerating,
    downloadingPDF,
    generateResume,
    downloadPDF,
    previewPDF
  } = useAIResumeGeneration(
    formData,
    setGeneratedResume,
    resumeOptions,
    editedContent,
    setEditedContent
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedContent);
    toast({
      title: "Copied!",
      description: "Resume content copied to clipboard.",
    });
  };

  const handleGenerate = () => {
    generateResume(atsOptimization, aiEnhancement);
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Step-by-Step Generator Form */}
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                      step === s ? "bg-primary text-primary-foreground scale-110" : 
                      step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < totalSteps && (
                    <div className={cn(
                      "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                      step > s ? "bg-emerald-500" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              <span className={cn(step === 1 && "text-primary")}>Personal</span>
              <span className={cn(step === 2 && "text-primary")}>Experience</span>
              <span className={cn(step === 3 && "text-primary")}>Style</span>
              <span className={cn(step === 4 && "text-primary")}>Review</span>
            </div>
          </div>

          <Card className="shadow-lg border-muted/40 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                {step === 1 && <User className="h-5 w-5 text-primary" />}
                {step === 2 && <Briefcase className="h-5 w-5 text-primary" />}
                {step === 3 && <Layers className="h-5 w-5 text-primary" />}
                {step === 4 && <Zap className="h-5 w-5 text-primary" />}
                {step === 1 && "Personal Details"}
                {step === 2 && "Professional Info"}
                {step === 3 && "Template & Style"}
                {step === 4 && "Generation Options"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Start with your basic contact information"}
                {step === 2 && "Tell us about your target role and experience"}
                {step === 3 && "Choose a template and customize your style"}
                {step === 4 && "Finalize AI settings and generate your resume"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <Step1BasicInfo formData={formData} setFormData={setFormData} />
                )}
                {step === 2 && (
                  <Step2ProfessionalInfo 
                    formData={formData} 
                    setFormData={setFormData} 
                    addSkill={addSkill} 
                    removeSkill={removeSkill} 
                  />
                )}
                {step === 3 && (
                  <Step3TemplateSelection 
                    formData={formData} 
                    setFormData={setFormData} 
                    resumeOptions={resumeOptions} 
                    setResumeOptions={setResumeOptions} 
                  />
                )}
                {step === 4 && (
                  <Step4GenerationOptions 
                    formData={formData} 
                    resumeOptions={resumeOptions}
                    atsOptimization={atsOptimization}
                    setAtsOptimization={setAtsOptimization}
                    aiEnhancement={aiEnhancement}
                    setAiEnhancement={setAiEnhancement}
                  />
                )}
              </AnimatePresence>

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4"
                >
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-all gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        Generating Your Success...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-6 w-6" />
                        Generate AI Resume
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
              
              <div className="flex items-center justify-between pt-6 border-t mt-4">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={step === 1 || isGenerating}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {step < totalSteps && (
                  <Button
                    onClick={nextStep}
                    className="gap-2 px-8"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Output */}
        <div className="space-y-6">
          <ResumeOutput 
            generatedResume={generatedResume}
            formData={formData}
            downloadingPDF={downloadingPDF}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            copyToClipboard={copyToClipboard}
            previewPDF={() => previewPDF(generatedResume)}
            downloadPDF={() => downloadPDF(generatedResume)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AIResumeGenerator;
