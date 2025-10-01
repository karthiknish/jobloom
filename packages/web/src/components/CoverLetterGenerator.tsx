"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Lightbulb,
  Download,
  Copy,
  RefreshCw,
  Target,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/components/ui/Toast";

import { ResumeData } from "@/types/resume";

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  hiringManager: string;
  jobDescription: string;
  keyRequirements: string[];
  companyValues: string[];
  applicationDate: string;
  customOpening?: string;
  customBody?: string;
  customClosing?: string;
  tone: 'professional' | 'enthusiastic' | 'formal' | 'casual';
  template: 'modern' | 'classic' | 'creative' | 'executive';
}

interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
  onGenerate?: (letter: string) => void;
}

const DEFAULT_LETTER_DATA: CoverLetterData = {
  jobTitle: "",
  companyName: "",
  companyLocation: "",
  hiringManager: "Hiring Team",
  jobDescription: "",
  keyRequirements: [""],
  companyValues: [""],
  applicationDate: new Date().toISOString().split("T")[0],
  customOpening: "",
  customBody: "",
  customClosing: "",
  tone: 'professional',
  template: 'modern',
};

const getToneStyle = (tone: CoverLetterData['tone']) => {
  const styles = {
    professional: {
      opening: "I am writing to express my strong interest in the",
      body: "My professional background aligns well with",
      closing: "I look forward to discussing how my qualifications can benefit",
      signoff: "Sincerely"
    },
    enthusiastic: {
      opening: "I'm thrilled to apply for the",
      body: "I'm excited about the opportunity to bring my",
      closing: "I can't wait to discuss how my passion and skills can contribute to",
      signoff: "Best regards"
    },
    formal: {
      opening: "I wish to submit my application for the",
      body: "My qualifications and experience make me an excellent candidate for",
      closing: "I would welcome the opportunity to further discuss my candidacy for",
      signoff: "Yours faithfully"
    },
    casual: {
      opening: "I'd love to apply for the",
      body: "I think my background would be a great fit for",
      closing: "I'm excited to chat more about how I can help with",
      signoff: "Cheers"
    }
  };
  return styles[tone];
};

const getTemplateStyle = (template: CoverLetterData['template']) => {
  const templates = {
    modern: {
      headerFormat: "clean",
      paragraphStyle: "concise",
      includeObjective: true
    },
    classic: {
      headerFormat: "traditional",
      paragraphStyle: "formal",
      includeObjective: false
    },
    creative: {
      headerFormat: "bold",
      paragraphStyle: "storytelling",
      includeObjective: true
    },
    executive: {
      headerFormat: "prestigious",
      paragraphStyle: "strategic",
      includeObjective: false
    }
  };
  return templates[template];
};

export const formatLetter = (
  data: CoverLetterData,
  resume: Partial<ResumeData>,
  opts: { includeAchievements?: boolean } = {},
): string => {
  const personalInfo: Partial<ResumeData['personalInfo']> = resume.personalInfo ?? {} as any;
  const name = personalInfo.fullName?.trim() || "Your Name";
  const email = personalInfo.email?.trim() || "your.email@example.com";
  const phone = personalInfo.phone?.trim() || "(555) 000-0000";
  const location = personalInfo.location?.trim() || "City, State";

  const jobTitle = data.jobTitle.trim() || "the role";
  const companyName = data.companyName.trim() || "your company";
  const companyLocation = data.companyLocation.trim();
  const hiringManager = data.hiringManager.trim() || "Hiring Team";

  const formattedDate = new Date(data.applicationDate || Date.now()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const toneStyle = getToneStyle(data.tone);
  const templateStyle = getTemplateStyle(data.template);

  // Generate opening based on tone and template
  const generateOpening = () => {
    if (data.customOpening?.trim()) return data.customOpening;
    
    const experience = resume.experience?.[0];
    const yearsOfExperience = experience ? 
      Math.floor((new Date().getTime() - new Date(experience.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0;
    
    let opening = `${toneStyle.opening} ${jobTitle} position at ${companyName}. `;
    
    if (templateStyle.includeObjective && yearsOfExperience > 0) {
      opening += `With ${yearsOfExperience}+ years of experience as a ${experience?.position || 'professional'}, `;
    }
    
    opening += `I bring expertise in ${resume.skills?.flatMap(s => s.skills).slice(0, 3).join(', ') || 'various technologies'}. `;
    
    if (data.companyValues[0]) {
      opening += `My commitment to ${data.companyValues[0]} aligns perfectly with ${companyName}'s mission.`;
    }
    
    return opening;
  };

  // Generate body paragraphs
  const generateBody = () => {
    if (data.customBody?.trim()) return data.customBody;
    
    const bodyParts: string[] = [];
    const requirementsLine = data.keyRequirements
      .filter((req) => req.trim())
      .slice(0, 3)
      .join(", ");

    // First paragraph: Experience and requirements match
    if (requirementsLine && resume.experience?.[0]) {
      const exp = resume.experience[0];
      bodyParts.push(
        `${toneStyle.body} ${requirementsLine}. In my role as ${exp.position} at ${exp.company}, ` +
        `I successfully ${exp.achievements[0] || 'delivered outstanding results that exceeded expectations'}.`
      );
    }

    // Second paragraph: Company values alignment
    if (data.companyValues.some(v => v.trim())) {
      const valuesLine = data.companyValues
        .filter((value) => value.trim())
        .slice(0, 2)
        .join(" and ");
      
      bodyParts.push(
        `What particularly draws me to ${companyName} is your emphasis on ${valuesLine}. ` +
        `These values resonate deeply with my professional philosophy and approach to ${resume.experience?.[0]?.position || 'work'}.`
      );
    }

    // Third paragraph: Job description connection
    if (data.jobDescription.trim()) {
      const firstSentence = data.jobDescription.split(".")[0]?.trim();
      if (firstSentence) {
        bodyParts.push(
          `The opportunity to ${firstSentence.toLowerCase()} excites me because it aligns perfectly with my career aspirations and skill set.`
        );
      }
    }

    return bodyParts.join("\n\n");
  };

  // Generate achievements section
  const generateAchievements = () => {
    if (!opts.includeAchievements || !resume.experience?.length) return "";
    
    const achievements = resume.experience
      .slice(0, 2)
      .flatMap(exp => exp.achievements.slice(0, 2))
      .filter(a => a.trim());
    
    if (achievements.length === 0) return "";
    
    return `\nKey Achievements:\n${achievements.map(a => `• ${a}`).join('\n')}`;
  };

  const closing = data.customClosing?.trim() || 
    `${toneStyle.closing} ${companyName}.\n\n${toneStyle.signoff},\n${name}`;

  return [
    `${formattedDate}`,
    "",
    `${hiringManager}`,
    `${companyName}`,
    companyLocation ? `${companyLocation}` : undefined,
    "",
    `Dear ${hiringManager},`,
    "",
    generateOpening(),
    "",
    generateBody(),
    generateAchievements(),
    "",
    closing,
    "",
    `${name} | ${location} | ${email} | ${phone}`,
  ].filter(Boolean).join("\n");
};

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  resumeData,
  onGenerate,
}) => {
  const [formData, setFormData] = useState<CoverLetterData>(DEFAULT_LETTER_DATA);
  const [letter, setLetter] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [includeAchievements, setIncludeAchievements] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [letterScore, setLetterScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const updateField = (field: keyof CoverLetterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Calculate cover letter score
  const calculateLetterScore = (letterText: string) => {
    let score = 0;
    
    // Check for key components (40%)
    if (letterText.includes('Dear')) score += 10;
    if (letterText.includes('Sincerely') || letterText.includes('Best regards') || letterText.includes('Yours')) score += 10;
    if (letterText.includes(formData.companyName)) score += 10;
    if (letterText.includes(formData.jobTitle)) score += 10;
    
    // Check for personalization (30%)
    if (letterText.includes(resumeData.personalInfo?.fullName || '')) score += 10;
    if (letterText.includes('experience') || letterText.includes('background')) score += 10;
    if (letterText.includes('skills') || letterText.includes('expertise')) score += 10;
    
    // Check for structure (20%)
    const paragraphs = letterText.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length >= 3) score += 10;
    if (paragraphs.length >= 5) score += 10;
    
    // Check for achievements (10%)
    if (includeAchievements && letterText.includes('•')) score += 10;
    
    return Math.min(100, score);
  };

  // Generate AI suggestions
  const generateSuggestions = () => {
    const ideas = [
      "Mention a specific company achievement or recent news",
      "Include a quantifiable accomplishment from your resume",
      "Reference the company's values or mission statement",
      "Add a sentence about why you're passionate about this industry",
      "Include a call to action for the next steps",
      "Mention a specific skill that matches the job requirements",
      "Add a personal connection to the company or role"
    ];
    
    setSuggestions(ideas.sort(() => Math.random() - 0.5).slice(0, 4));
  };

  const handleGenerate = () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      showError("Enter at least a job title and company");
      return;
    }
    try {
      setGenerating(true);
      const generated = formatLetter(formData, resumeData, { includeAchievements });
      setLetter(generated);
      const score = calculateLetterScore(generated);
      setLetterScore(score);
      onGenerate?.(generated);
      
      if (score >= 80) {
        showSuccess("Excellent cover letter generated!");
      } else if (score >= 60) {
        showSuccess("Cover letter generated. Consider adding more personalization.");
      } else {
        showSuccess("Cover letter generated. Review the suggestions below for improvements.");
      }
      
      generateSuggestions();
    } catch (e) {
      console.error(e);
      showError("Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      showSuccess("Copied to clipboard");
    } catch {
      showError("Clipboard copy failed");
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Cover Letter Generator
            </CardTitle>
            <CardDescription>Create a personalized cover letter that stands out</CardDescription>
          </div>
          {letterScore > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{letterScore}%</div>
              <div className="text-xs text-muted-foreground">Quality Score</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone and Template Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tone Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['professional', 'enthusiastic', 'formal', 'casual'] as const).map((tone) => (
                <Button
                  key={tone}
                  variant={formData.tone === tone ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateField("tone", tone)}
                  className="text-xs"
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Template Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['modern', 'classic', 'creative', 'executive'] as const).map((template) => (
                <Button
                  key={template}
                  variant={formData.template === template ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateField("template", template)}
                  className="text-xs"
                >
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="border-primary/20 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="e.g. Acme Corp"
              className="border-primary/20 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyLocation">Company Location</Label>
            <Input
              id="companyLocation"
              value={formData.companyLocation}
              onChange={(e) => updateField("companyLocation", e.target.value)}
              placeholder="e.g. Remote / New York, NY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiringManager">Hiring Manager</Label>
            <Input
              id="hiringManager"
              value={formData.hiringManager}
              onChange={(e) => updateField("hiringManager", e.target.value)}
              placeholder="Optional - e.g. Sarah Johnson"
            />
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI-Powered Enhancements</p>
              <p className="text-xs text-blue-700">Get intelligent suggestions for a stronger cover letter</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const skills = resumeData.skills?.flatMap(s => s.skills).slice(0, 3) || [];
                if (skills.length > 0) {
                  updateArrayField("keyRequirements", 0, skills.join(", "));
                  showSuccess("Key skills added from your resume!");
                }
              }}
              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              🎯 Extract Skills from Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (resumeData.experience?.[0]) {
                  const exp = resumeData.experience[0];
                  updateField("customOpening", `As a ${exp.position} with proven success at ${exp.company}, I was excited to discover the ${formData.jobTitle} opportunity at ${formData.companyName}.`);
                  showSuccess("Personalized opening created!");
                }
              }}
              className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              ✨ Create Personalized Opening
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Key Requirements from Job Description</Label>
            {formData.keyRequirements.map((req, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={req}
                  onChange={(e) => updateArrayField("keyRequirements", i, e.target.value)}
                  placeholder="e.g. 5+ years React experience"
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("keyRequirements", i)}
                  disabled={formData.keyRequirements.length === 1}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addArrayItem("keyRequirements")}>
              <Plus className="h-3 w-3 mr-1" />
              Add Requirement
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Company Values & Culture</Label>
            {formData.companyValues.map((val, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={val}
                  onChange={(e) => updateArrayField("companyValues", i, e.target.value)}
                  placeholder="e.g. Innovation, Teamwork"
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("companyValues", i)}
                  disabled={formData.companyValues.length === 1}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addArrayItem("companyValues")}>
              <Plus className="h-3 w-3 mr-1" />
              Add Value
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description (First Paragraph)</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => updateField("jobDescription", e.target.value)}
            rows={3}
            placeholder="Paste the first paragraph of the job description to help tailor your letter..."
            className="text-sm"
          />
        </div>

        {/* Custom Sections */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Custom Opening (Optional)</Label>
            <Textarea
              value={formData.customOpening || ""}
              onChange={(e) => updateField("customOpening", e.target.value)}
              rows={2}
              placeholder="Override the default opening..."
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Body (Optional)</Label>
            <Textarea
              value={formData.customBody || ""}
              onChange={(e) => updateField("customBody", e.target.value)}
              rows={2}
              placeholder="Add specific points you want to emphasize..."
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Closing (Optional)</Label>
            <Textarea
              value={formData.customClosing || ""}
              onChange={(e) => updateField("customClosing", e.target.value)}
              rows={2}
              placeholder="Custom closing statement..."
              className="text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center flex-wrap">
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !formData.jobTitle.trim() || !formData.companyName.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate AI Cover Letter
              </>
            )}
          </Button>
          
          {letter && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </>
          )}
          
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeAchievements}
              onChange={e => setIncludeAchievements(e.target.checked)}
            />
            Include achievements from resume
          </label>
        </div>

        {/* Generated Letter with Preview */}
        {letter && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Generated Cover Letter</Label>
              <div className="flex items-center gap-2">
                {letterScore >= 80 && <Star className="h-5 w-5 text-yellow-500" />}
                <Badge variant={letterScore >= 80 ? "default" : letterScore >= 60 ? "secondary" : "outline"}>
                  {letterScore}% Quality Score
                </Badge>
              </div>
            </div>
            
            {showPreview ? (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                  {letter}
                </div>
              </div>
            ) : (
              <Textarea 
                value={letter} 
                readOnly 
                rows={16} 
                className="font-mono text-sm border-gray-200" 
              />
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Suggestions for Improvement</p>
                    <p className="text-xs text-yellow-700">Consider these enhancements to make your letter even stronger</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
