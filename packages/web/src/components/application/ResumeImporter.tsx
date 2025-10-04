"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  FileCheck,
  FileWarning,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";

interface ImportedResume {
  id: string;
  name: string;
  content: string;
  parsedData: {
    personalInfo: any;
    experience: any[];
    education: any[];
    skills: string[];
  };
  uploadedAt: string;
  fileSize: number;
  fileType: string;
  atsScore?: number;
}

export function ResumeImporter() {
  const { user } = useFirebaseAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedResumes, setImportedResumes] = useState<ImportedResume[]>([]);
  const [selectedResume, setSelectedResume] = useState<ImportedResume | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const supportedFormats = [
    { extension: ".pdf", description: "PDF Document" },
    { extension: ".docx", description: "Word Document" },
    { extension: ".doc", description: "Legacy Word Document" },
    { extension: ".txt", description: "Plain Text" },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!supportedFormats.some(format => format.extension === fileExtension)) {
      showError("Unsupported Format", "Please upload a PDF, DOC, DOCX, or TXT file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError("File Too Large", "Please upload a file smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    
    try {
      // Read file content
      const content = await readFileContent(file);
      
      // Create imported resume object
      const importedResume: ImportedResume = {
        id: Date.now().toString(),
        name: file.name,
        content: content,
        parsedData: parseResumeContent(content),
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileType: fileExtension,
      };

      setImportedResumes(prev => [importedResume, ...prev]);
      setSelectedResume(importedResume);
      
      showSuccess("File Uploaded", "Your resume has been successfully imported and parsed.");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error("File upload error:", error);
      showError("Upload Failed", error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file);
    });
  };

  const parseResumeContent = (content: string): any => {
    // Simple parsing logic - in production, this would use more sophisticated parsing
    const lines = content.split('\n').filter(line => line.trim());
    
    const parsedData = {
      personalInfo: {
        name: extractName(content),
        email: extractEmail(content),
        phone: extractPhone(content),
        location: extractLocation(content),
      },
      experience: extractExperience(content),
      education: extractEducation(content),
      skills: extractSkills(content),
    };

    return parsedData;
  };

  const extractName = (content: string): string => {
    // Simple name extraction - look for common patterns
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length < 50 && !trimmed.includes('@') && !trimmed.includes('http')) {
        return trimmed;
      }
    }
    return "";
  };

  const extractEmail = (content: string): string => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const match = content.match(emailRegex);
    return match ? match[0] : "";
  };

  const extractPhone = (content: string): string => {
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g;
    const match = content.match(phoneRegex);
    return match ? match[0] : "";
  };

  const extractLocation = (content: string): string => {
    // Simple location extraction - look for city, state patterns
    const locationRegex = /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g;
    const match = content.match(locationRegex);
    return match ? match[0] : "";
  };

  const extractExperience = (content: string): any[] => {
    // Simple experience extraction
    const experienceSection = content.match(/EXPERIENCE[\s\S]*?(?=EDUCATION|SKILLS|$)/i);
    if (!experienceSection) return [];
    
    const experiences = [];
    const lines = experienceSection[0].split('\n').slice(1);
    
    // Group lines by experience entries
    let currentExperience = null;
    for (const line of lines) {
      if (line.trim()) {
        if (!currentExperience) {
          currentExperience = {
            title: line.trim(),
            company: "",
            duration: "",
            description: ""
          };
        } else if (currentExperience && !currentExperience.company) {
          currentExperience.company = line.trim();
        } else if (currentExperience && !currentExperience.duration) {
          currentExperience.duration = line.trim();
        } else {
          currentExperience.description += line.trim() + " ";
        }
      } else if (currentExperience) {
        experiences.push({ ...currentExperience });
        currentExperience = null;
      }
    }
    
    if (currentExperience) {
      experiences.push(currentExperience);
    }
    
    return experiences;
  };

  const extractEducation = (content: string): any[] => {
    const educationSection = content.match(/EDUCATION[\s\S]*?(?=EXPERIENCE|SKILLS|$)/i);
    if (!educationSection) return [];
    
    const education = [];
    const lines = educationSection[0].split('\n').slice(1);
    
    for (const line of lines) {
      if (line.trim()) {
        education.push({
          degree: line.trim(),
          institution: "",
          year: ""
        });
      }
    }
    
    return education;
  };

  const extractSkills = (content: string): string[] => {
    const skillsSection = content.match(/SKILLS[\s\S]*?(?=EXPERIENCE|EDUCATION|$)/i);
    if (!skillsSection) return [];
    
    const skillsText = skillsSection[0].replace(/SKILLS/i, '');
    const skills = skillsText.split(/[,;|\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0 && skill.length < 50);
    
    return [...new Set(skills)]; // Remove duplicates
  };

  const analyzeWithAI = async () => {
    if (!selectedResume) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const atsScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
      
      setSelectedResume(prev => prev ? { ...prev, atsScore } : null);
      
      showSuccess("Analysis Complete", `ATS Score: ${atsScore}%`);
    } catch (error) {
      showError("Analysis Failed", "Unable to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteResume = (resumeId: string) => {
    setImportedResumes(prev => prev.filter(r => r.id !== resumeId));
    if (selectedResume?.id === resumeId) {
      setSelectedResume(null);
      setEditingData(null);
    }
    showSuccess("Deleted", "Resume has been removed.");
  };

  const saveToResumeBuilder = () => {
    if (!selectedResume) return;
    
    // This would integrate with the main resume builder
    showInfo("Coming Soon", "Integration with resume builder will be available soon.");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            Resume Importer
          </CardTitle>
          <CardDescription>
            Upload and parse existing resumes to edit and enhance them
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>
                Supported formats: PDF, DOC, DOCX, TXT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Supported Formats:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {supportedFormats.map(format => (
                    <div key={format.extension} className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>{format.extension}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Maximum file size: 10MB. Your data is processed securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Imported Resumes List */}
          {importedResumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Imported Resumes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {importedResumes.map(resume => (
                  <div
                    key={resume.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedResume?.id === resume.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedResume(resume)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm truncate">
                            {resume.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(resume.fileSize)} • {resume.fileType}
                        </div>
                        {resume.atsScore && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              ATS: {resume.atsScore}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResume(resume.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview and Edit Section */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {selectedResume.name}
                    </CardTitle>
                    <CardDescription>
                      Parsed content and editing options
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={analyzeWithAI}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          AI Analyze
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={saveToResumeBuilder}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Edit in Builder
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ATS Score */}
                {selectedResume.atsScore && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">ATS Optimization Score</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {selectedResume.atsScore}%
                      </span>
                    </div>
                    <Progress value={selectedResume.atsScore} className="h-2" />
                  </div>
                )}

                {/* Parsed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Personal Information</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Name</Label>
                        <Input
                          value={selectedResume.parsedData.personalInfo.name || ""}
                          onChange={(e) => {
                            const updated = {
                              ...selectedResume,
                              parsedData: {
                                ...selectedResume.parsedData,
                                personalInfo: {
                                  ...selectedResume.parsedData.personalInfo,
                                  name: e.target.value
                                }
                              }
                            };
                            setSelectedResume(updated);
                          }}
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <Input
                          value={selectedResume.parsedData.personalInfo.email || ""}
                          onChange={(e) => {
                            const updated = {
                              ...selectedResume,
                              parsedData: {
                                ...selectedResume.parsedData,
                                personalInfo: {
                                  ...selectedResume.parsedData.personalInfo,
                                  email: e.target.value
                                }
                              }
                            };
                            setSelectedResume(updated);
                          }}
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Phone</Label>
                        <Input
                          value={selectedResume.parsedData.personalInfo.phone || ""}
                          onChange={(e) => {
                            const updated = {
                              ...selectedResume,
                              parsedData: {
                                ...selectedResume.parsedData,
                                personalInfo: {
                                  ...selectedResume.parsedData.personalInfo,
                                  phone: e.target.value
                                }
                              }
                            };
                            setSelectedResume(updated);
                          }}
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Skills</h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.parsedData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      {selectedResume.parsedData.skills.length === 0 && (
                        <p className="text-sm text-gray-500">No skills detected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw Content Preview */}
                <div>
                  <h4 className="font-medium mb-3">Original Content</h4>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {selectedResume.content.substring(0, 2000)}
                      {selectedResume.content.length > 2000 && (
                        <span className="text-gray-500">... (truncated)</span>
                      )}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Resume Imported
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload a resume to see parsed content and editing options
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Upload Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
