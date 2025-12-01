"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedAtsScore } from "./EnhancedAtsScore";
import { RealTimeAtsFeedback } from "./RealTimeAtsFeedback";
import { calculateEnhancedATSScore } from "@/lib/enhancedAts";
import type { ResumeData } from "@/types/resume";
import { RefreshCw, Play, Settings } from "lucide-react";
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

// Sample resume data for demonstration
const sampleResume: ResumeData = {
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe",
    summary: "Experienced software engineer with 5+ years in full-stack development and cloud architecture."
  },
  experience: [
    {
      id: "1",
      company: "Tech Corp",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2020-01",
      endDate: "2023-12",
      current: false,
      description: "Led development of enterprise web applications using React and Node.js",
      achievements: [
        "Increased application performance by 40% through optimization",
        "Managed a team of 5 junior developers",
        "Reduced bug reports by 60% through improved testing practices"
      ]
    },
    {
      id: "2",
      company: "StartupXYZ",
      position: "Full Stack Developer",
      location: "Remote",
      startDate: "2018-06",
      endDate: "2019-12",
      current: false,
      description: "Developed and maintained web applications for various clients",
      achievements: [
        "Built 3 production-ready applications from scratch",
        "Implemented CI/CD pipeline reducing deployment time by 50%"
      ]
    }
  ],
  education: [
    {
      id: "1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationDate: "2018-05",
      gpa: "3.8",
      honors: "Magna Cum Laude"
    }
  ],
  skills: [
    {
      category: "Frontend",
      skills: ["JavaScript", "React", "TypeScript", "HTML5", "CSS3", "Redux"]
    },
    {
      category: "Backend",
      skills: ["Node.js", "Python", "Express", "MongoDB", "PostgreSQL", "REST APIs"]
    },
    {
      category: "Cloud & DevOps",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Git", "Jenkins"]
    }
  ],
  projects: [
    {
      id: "1",
      name: "E-commerce Platform",
      description: "Full-stack e-commerce solution with real-time inventory management",
      technologies: ["React", "Node.js", "MongoDB", "Stripe API"],
      link: "https://ecommerce-demo.com",
      github: "https://github.com/johndoe/ecommerce"
    }
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022-03",
      credentialId: "AWS-ASA-123456"
    }
  ],
  languages: [
    {
      id: "1",
      language: "English",
      proficiency: "Native"
    },
    {
      id: "2",
      language: "Spanish",
      proficiency: "Advanced"
    }
  ]
};

export function AtsScoreDemo() {
  const [resume, setResume] = useState<ResumeData>(sampleResume);
  const [targetRole, setTargetRole] = useState<string>("software engineer");
  const [industry, setIndustry] = useState<string>("technology");
  const [showRealTime, setShowRealTime] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const calculateScore = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 500);
  };

  const updateResumeField = (field: string, value: string) => {
    const [section, subsection] = field.split('.');

    if (subsection) {
      setResume(prev => ({
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [subsection]: value
        }
      }));
    } else {
      setResume(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const currentScore = calculateEnhancedATSScore(resume, { targetRole, industry });

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Enhanced ATS Score Demo</h1>
        <p className="text-gray-600">
          Experience the improved ATS scoring system with real-time feedback and detailed analysis
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ATS Configuration
          </CardTitle>
          <CardDescription>
            Adjust target role and industry for personalized scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software engineer">Software Engineer</SelectItem>
                  <SelectItem value="frontend developer">Frontend Developer</SelectItem>
                  <SelectItem value="backend engineer">Backend Engineer</SelectItem>
                  <SelectItem value="product manager">Product Manager</SelectItem>
                  <SelectItem value="data scientist">Data Scientist</SelectItem>
                  <SelectItem value="marketing manager">Marketing Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Input
                id="summary"
                value={resume.personalInfo.summary}
                onChange={(e) => updateResumeField('personalInfo.summary', e.target.value)}
                placeholder="Enter your professional summary"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Button
              onClick={calculateScore}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowRealTime(!showRealTime)}
            >
              {showRealTime ? "Hide" : "Show"} Real-time Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Feedback */}
      {showRealTime && (
        <RealTimeAtsFeedback
          resume={resume}
          targetRole={targetRole}
          industry={industry}
          onFieldChange={updateResumeField}
          compact={false}
        />
      )}

      {/* Enhanced Score Display */}
      <EnhancedAtsScore
        score={currentScore}
        showDetailed={true}
        animated={true}
        size="expanded"
      />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Analysis Details</CardTitle>
          <CardDescription>
            In-depth metrics and calculations behind your ATS score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className={cn("font-semibold mb-3", themeColors.primary.text)}>Structure Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Section Completeness:</span>
                  <span>{currentScore.breakdown?.structure || 0}/50</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Information:</span>
                  <span>{resume.personalInfo.email ? 'Complete' : 'Missing'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience Entries:</span>
                  <span>{resume.experience.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Education Entries:</span>
                  <span>{resume.education.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className={cn("font-semibold mb-3", themeColors.success.text)}>Content Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Word Count:</span>
                  <span>{currentScore.detailedMetrics?.wordCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Keyword Density:</span>
                  <span>{(currentScore.detailedMetrics?.keywordDensity || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Action Verb Usage:</span>
                  <span>{(currentScore.detailedMetrics?.actionVerbUsage || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Language:</span>
                  <span>{(currentScore.detailedMetrics?.professionalLanguage || 0).toFixed(1)}/1000</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className={cn("font-semibold mb-3", themeColors.info.text)}>Quality Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantification Score:</span>
                  <span>{(currentScore.detailedMetrics?.quantificationScore || 0).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Terms:</span>
                  <span>{(currentScore.detailedMetrics?.technicalTerms || 0).toFixed(1)}/1000</span>
                </div>
                <div className="flex justify-between">
                  <span>Industry Alignment:</span>
                  <span>{(currentScore.detailedMetrics?.industryAlignment || 0).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Modernization Score:</span>
                  <span>{currentScore.breakdown?.modernization || 0}/75</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}