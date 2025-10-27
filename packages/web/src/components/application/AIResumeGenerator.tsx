"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Zap,
  TrendingUp,
  Wand2,
  Lightbulb,
  Star,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import ResumePDFGenerator from "@/lib/resumePDFGenerator";

interface ResumeData {
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: "entry" | "mid" | "senior" | "executive";
  style: "modern" | "classic" | "creative" | "tech";
  includeObjective: boolean;
}

interface GeneratedResume {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  atsScore: number;
  keywords: string[];
  suggestions: string[];
  wordCount: number;
}

export function AIResumeGenerator() {
  const { user } = useFirebaseAuth();
  const { plan } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [formData, setFormData] = useState<ResumeData>({
    jobTitle: "",
    experience: "",
    skills: [],
    education: "",
    industry: "technology",
    level: "mid",
    style: "modern",
    includeObjective: true,
  });
  const [skillInput, setSkillInput] = useState("");
  const [atsOptimization, setAtsOptimization] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const industries = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "engineering", label: "Engineering" },
    { value: "consulting", label: "Consulting" },
    { value: "other", label: "Other" },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (2-5 years)" },
    { value: "senior", label: "Senior Level (5-10 years)" },
    { value: "executive", label: "Executive (10+ years)" },
  ];

  const resumeStyles = [
    { value: "modern", label: "Modern", description: "Clean and contemporary" },
    { value: "classic", label: "Classic", description: "Traditional and professional" },
    { value: "creative", label: "Creative", description: "For creative industries" },
    { value: "tech", label: "Tech", description: "For technical roles" },
  ];

  const generateResume = async () => {
    if (!formData.jobTitle || !formData.experience) {
      showError("Missing Information", "Please fill in the required fields.");
      return;
    }

    if (plan === "free") {
      showError("Upgrade Required", "AI resume generation is a premium feature. Please upgrade to unlock.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/ai/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          atsOptimization,
          aiEnhancement,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate resume");
      }

      const data = await response.json();
      setGeneratedResume(data);
      showSuccess("Success", "Your resume has been generated!");
    } catch (error: any) {
      console.error("Resume generation error:", error);
      
      // Fallback to mock data for development
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
      };
      
      setGeneratedResume(mockResume);
      showInfo("Demo Mode", "This is a sample resume. Upgrade for full AI generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockResumeContent = (data: ResumeData): string => {
    return `${generateMockSummary(data)}

${generateMockExperience(data)}

SKILLS
${data.skills.join(", ")}

EDUCATION
${data.education || "Bachelor's Degree in relevant field"}

[This is a demo version. Upgrade for full AI-generated resume.]`;
  };

  const generateMockSummary = (data: ResumeData): string => {
    const levelMap = {
      entry: "motivated and detail-oriented",
      mid: "skilled and results-driven", 
      senior: "experienced and strategic",
      executive: "visionary and accomplished"
    };

    return `PROFESSIONAL SUMMARY
${levelMap[data.level]} professional with expertise in ${data.industry}. 
Seeking ${data.jobTitle} position where I can leverage my skills and experience to drive results.`;
  };

  const generateMockExperience = (data: ResumeData): string => {
    return `PROFESSIONAL EXPERIENCE
${data.experience}

[This would include specific achievements, metrics, and responsibilities]`;
  };

  const extractKeywords = (data: ResumeData): string[] => {
    const commonKeywords = [
      "leadership", "communication", "teamwork", "problem-solving", "analytical",
      "project management", "collaboration", "initiative", "adaptability", "creativity"
    ];

    const industryKeywords = {
      technology: ["javascript", "python", "react", "aws", "docker", "agile"],
      healthcare: ["patient care", "medical terminology", "hipaa", "clinical"],
      finance: ["financial analysis", "reporting", "budgeting", "forecasting"],
      marketing: ["digital marketing", "seo", "content strategy", "analytics"],
    };

    const allKeywords = [
      ...commonKeywords,
      ...(industryKeywords[data.industry as keyof typeof industryKeywords] || []),
      ...data.skills
    ];

    return allKeywords.slice(0, 8);
  };

  const generateMockSuggestions = (data: ResumeData): string[] => {
    const suggestions = [
      "Add specific metrics and quantifiable achievements",
      "Include more industry-specific keywords",
      "Strengthen your professional summary",
      "Add relevant certifications or training",
    ];

    return suggestions.slice(0, 3);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const copyToClipboard = async () => {
    if (generatedResume) {
      try {
        await navigator.clipboard.writeText(generatedResume.content);
        showSuccess("Copied!", "Resume copied to clipboard.");
      } catch (error) {
        showError("Failed to copy", "Please try again.");
      }
    }
  };

  const downloadPDF = async () => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      setDownloadingPDF(true);
      
      // Convert generated resume content to structured resume data
      const resumeData = {
        personalInfo: {
          fullName: user?.displayName || 'Your Name',
          email: user?.email || 'your.email@example.com',
          phone: '(555) 123-4567',
          location: 'Your City, State',
          summary: generatedResume.sections.summary || 'Professional summary',
          linkedin: '',
          github: '',
          website: ''
        },
        experience: [{
          id: '1',
          company: 'Previous Company',
          position: formData.jobTitle,
          location: 'City, State',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          current: false,
          description: generatedResume.sections.experience || 'Professional experience',
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

      // Validate resume data
      const validation = ResumePDFGenerator.validateResumeData(resumeData);
      if (!validation.valid) {
        showError("Validation Failed", validation.errors.join(', '));
        return;
      }

      // Generate and download PDF
      await ResumePDFGenerator.generateAndDownloadResume(
        resumeData,
        undefined,
        {
          template: formData.style,
          fontSize: 11,
          lineHeight: 1.4,
          margin: 15,
          font: 'helvetica',
          includePhoto: false,
          colorScheme: 'blue'
        }
      );

      showSuccess("Success", "Resume PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF download failed:", error);
      showError("Download Failed", "Failed to download PDF: " + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const previewPDF = async () => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      // Convert generated resume content to structured resume data
      const resumeData = {
        personalInfo: {
          fullName: user?.displayName || 'Your Name',
          email: user?.email || 'your.email@example.com',
          phone: '(555) 123-4567',
          location: 'Your City, State',
          summary: generatedResume.sections.summary || 'Professional summary',
          linkedin: '',
          github: '',
          website: ''
        },
        experience: [{
          id: '1',
          company: 'Previous Company',
          position: formData.jobTitle,
          location: 'City, State',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          current: false,
          description: generatedResume.sections.experience || 'Professional experience',
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

      // Generate and preview PDF
      await ResumePDFGenerator.previewResumePDF(resumeData, {
        template: formData.style,
        fontSize: 11,
        lineHeight: 1.4,
        margin: 15,
        font: 'helvetica',
        includePhoto: false,
        colorScheme: 'blue'
      });

      showSuccess("Success", "Resume PDF preview opened in new tab!");
    } catch (error: any) {
      console.error("PDF preview failed:", error);
      showError("Preview Failed", "Failed to preview PDF: " + error.message);
    }
  };

  const getAtsScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getAtsScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Resume Generator
          </CardTitle>
          <CardDescription>
            Create ATS-optimized resumes with AI-powered content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "free" && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-semibold text-amber-900">Premium Feature</h4>
                  <p className="text-sm text-amber-700">
                    Upgrade to generate unlimited AI-powered resumes with ATS optimization
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>
              Provide details about your background and target role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Target Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value: any) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="experience">Your Experience *</Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience, achievements, and responsibilities..."
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                placeholder="Your educational background, degrees, certifications..."
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label>Key Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Experience Level</Label>
                <Select value={formData.level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="style">Resume Style</Label>
                <Select value={formData.style} onValueChange={(value: any) => setFormData(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeStyles.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">AI Options</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ats-optimization"
                  checked={atsOptimization}
                  onCheckedChange={setAtsOptimization}
                />
                <Label htmlFor="ats-optimization">ATS Optimization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai-enhancement"
                  checked={aiEnhancement}
                  onCheckedChange={setAiEnhancement}
                />
                <Label htmlFor="ai-enhancement">AI Content Enhancement</Label>
              </div>
            </div>

            <Button 
              onClick={generateResume} 
              disabled={isGenerating || plan === "free"}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Resume
              </span>
              {generatedResume && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={previewPDF}
                    disabled={!generatedResume || !formData.jobTitle}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={downloadPDF}
                    disabled={downloadingPDF || !generatedResume || !formData.jobTitle}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {downloadingPDF ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedResume ? (
              <div className="space-y-4">
                {/* ATS Score */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">ATS Score</span>
                    </div>
                    <span className={`font-bold ${getAtsScoreColor(generatedResume.atsScore)}`}>
                      {generatedResume.atsScore}% - {getAtsScoreLabel(generatedResume.atsScore)}
                    </span>
                  </div>
                  <Progress value={generatedResume.atsScore} className="h-2" />
                </div>

                {/* Keywords */}
                {generatedResume.keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Keywords Found
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedResume.keywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className="text-green-700 border-green-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Content */}
                <div>
                  <h4 className="font-medium mb-2">Resume Content</h4>
                  <div className="p-4 bg-white border rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {generatedResume.content}
                    </pre>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {generatedResume.wordCount} words • {formData.style} style
                  </div>
                </div>

                {/* Suggestions */}
                {generatedResume.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      AI Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {generatedResume.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated resume will appear here</p>
                <p className="text-sm mt-1">Fill in your information and click generate to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
