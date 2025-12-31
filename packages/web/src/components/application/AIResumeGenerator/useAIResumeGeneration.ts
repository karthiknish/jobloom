import { useState } from 'react';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';
import { useSubscription } from '@/providers/subscription-provider';
import { useToast } from "@/hooks/use-toast";
import { aiApi, ResumeRequest } from "@/utils/api/ai";
import ResumePDFGenerator from "@/lib/resumePDFGenerator";
import { ResumeGeneratorFormData, GeneratedResume } from "./types";
import { generateContentHash, getCachedAIResponse, setCachedAIResponse } from "@/utils/ai-cache";
import { 
  generateMockResumeContent, 
  generateMockSummary, 
  generateMockExperience, 
  extractKeywords, 
  generateMockSuggestions 
} from './utils';

export const useAIResumeGeneration = (
  formData: ResumeGeneratorFormData,
  setGeneratedResume: (res: GeneratedResume) => void,
  resumeOptions: any,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { user } = useFirebaseAuth();
  const { plan, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const showError = (title: string, description: string) => {
    toast({ title, description, variant: "destructive" });
  };

  const showSuccess = (title: string, description: string) => {
    toast({ title, description });
  };

  const showInfo = (title: string, description: string) => {
    toast({ title, description });
  };

  const generateResume = async (atsOptimization: boolean, aiEnhancement: boolean) => {
    const canGenerate = Boolean(formData.jobTitle.trim() && formData.experience.trim());
    if (!canGenerate) {
      showError("Missing Information", "Please fill in the required fields.");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Check cache first
      const cachePayload: ResumeRequest = {
        ...formData,
        atsOptimization,
        aiEnhancement,
      };
      
      const payloadHash = await generateContentHash(cachePayload);
      const cachedData = getCachedAIResponse<GeneratedResume>(payloadHash);
      
      if (cachedData) {
        setGeneratedResume(cachedData);
        setEditedContent(cachedData.content);
        toast({
          title: "Success",
          description: "Loaded from history!",
        });
        setIsGenerating(false);
        return;
      }

      const payload = await aiApi.generateResume(cachePayload);
      
      // Store in cache
      setCachedAIResponse(payloadHash, payload);

      setGeneratedResume(payload);
      setEditedContent(payload.content);
      toast({
        title: "Success",
        description: "Your Resume has been generated!",
      });
    } catch (error: any) {
      console.error("Resume generation error:", error);

      // Fallback to mock data
      const mockResume: GeneratedResume = {
        content: generateMockResumeContent(formData),
        sections: {
          summary: generateMockSummary(formData),
          experience: generateMockExperience(formData),
          skills: formData.skills.join(", "),
          education: formData.education || "Bachelor's Degree in relevant field",
        },
        atsScore: 85,
        keywords: extractKeywords(formData),
        suggestions: generateMockSuggestions(formData),
        wordCount: 350,
        source: 'fallback',
      };
      
      setGeneratedResume(mockResume);
      setEditedContent(mockResume.content);

      const message = error instanceof Error ? error.message : "AI generation failed";
      showError("Generation Failed", message);
      showInfo("Fallback Used", "Showing a fallback resume so you can keep going.");
    } finally {
      setIsGenerating(false);
    }
  };

  const prepareResumeData = (res: GeneratedResume) => {
    return {
      personalInfo: {
        fullName: formData.fullName || user?.displayName || 'Your Name',
        email: formData.email || user?.email || 'your.email@example.com',
        phone: formData.phone || '',
        location: formData.location || '',
        summary: res.sections.summary || 'Professional summary',
        linkedin: formData.linkedin || '',
        github: '',
        website: formData.website || ''
      },
      experience: [{
        id: '1',
        company: 'Previous Company',
        position: formData.jobTitle,
        location: 'City, State',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        current: false,
        description: res.sections.experience || 'Professional experience',
        achievements: [
          'Key achievement 1',
          'Key achievement 2',
          'Key achievement 3'
        ]
      }],
      education: [{
        id: '1',
        institution: 'University Name',
        degree: 'Bachelor\'s Degree',
        field: formData.industry,
        graduationDate: '2019-05-15',
        gpa: '3.5',
        honors: ''
      }],
      skills: [{
        category: 'Technical Skills',
        skills: formData.skills.length > 0 ? formData.skills : ['Skill 1', 'Skill 2', 'Skill 3']
      }],
      projects: []
    };
  };

  const downloadPDF = async (generatedResume: GeneratedResume | null) => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      setDownloadingPDF(true);
      const resumeData = prepareResumeData(generatedResume);
      const validation = ResumePDFGenerator.validateResumeData(resumeData);
      
      if (!validation.valid) {
        showError("Validation Failed", validation.errors.join(', '));
        return;
      }

      const isEdited = editedContent.trim() !== generatedResume.content.trim();

      if (isEdited) {
        await ResumePDFGenerator.generateAndDownloadRawResume(
          editedContent,
          {
            candidateName: formData.fullName || user?.displayName || 'Your Name',
            generatedDate: new Date().toLocaleDateString()
          },
          {
            template: resumeOptions.template,
            fontSize: resumeOptions.fontSize,
            lineHeight: 1.4,
            margin: 15,
            font: resumeOptions.font,
            includePhoto: false,
            colorScheme: resumeOptions.colorScheme
          }
        );
      } else {
        await ResumePDFGenerator.generateAndDownloadResume(
          resumeData,
          undefined,
          {
            template: resumeOptions.template,
            fontSize: resumeOptions.fontSize,
            lineHeight: 1.4,
            margin: 15,
            font: resumeOptions.font,
            includePhoto: false,
            colorScheme: resumeOptions.colorScheme
          }
        );
      }

      showSuccess("Success", "Resume PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF download failed:", error);
      showError("Download Failed", "Failed to download PDF: " + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const previewPDF = async (generatedResume: GeneratedResume | null) => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      const resumeData = prepareResumeData(generatedResume);
      const isEdited = editedContent.trim() !== generatedResume.content.trim();

      if (isEdited) {
        await ResumePDFGenerator.previewRawResumePDF(
          editedContent,
          {
            candidateName: formData.fullName || user?.displayName || 'Your Name',
            generatedDate: new Date().toLocaleDateString()
          },
          {
            template: resumeOptions.template,
            fontSize: resumeOptions.fontSize,
            lineHeight: 1.4,
            margin: 15,
            font: resumeOptions.font,
            includePhoto: false,
            colorScheme: resumeOptions.colorScheme
          }
        );
      } else {
        await ResumePDFGenerator.previewResumePDF(resumeData, {
          template: resumeOptions.template,
          fontSize: resumeOptions.fontSize,
          lineHeight: 1.4,
          margin: 15,
          font: resumeOptions.font,
          includePhoto: false,
          colorScheme: resumeOptions.colorScheme
        });
      }
    } catch (error: any) {
      console.error("PDF preview failed:", error);
      showError("Preview Failed", "Failed to generate preview: " + error.message);
    }
  };

  return {
    isGenerating,
    downloadingPDF,
    generateResume,
    downloadPDF,
    previewPDF
  };
};
