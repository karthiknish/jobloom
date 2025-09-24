"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Palette,
  Download,
  Eye,
  Edit,
  Star,
  Plus,
  Trash2,
  Save,
  Upload,
  Image,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Mock resume templates
const resumeTemplates = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean, contemporary design perfect for tech roles",
    preview: "📄",
    popular: true,
  },
  {
    id: "classic",
    name: "Classic Corporate",
    description: "Traditional format for conservative industries",
    preview: "📋",
    popular: false,
  },
  {
    id: "creative",
    name: "Creative Designer",
    description: "Bold and artistic layout for creative fields",
    preview: "🎨",
    popular: false,
  },
  {
    id: "minimal",
    name: "Minimal Clean",
    description: "Simple and elegant design focusing on content",
    preview: "✨",
    popular: false,
  },
];

// Mock portfolio data
const initialResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
  },
  experience: [
    {
      id: "1",
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [""],
    },
  ],
  education: [
    {
      id: "1",
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
      honors: "",
    },
  ],
  skills: [
    { category: "Technical", skills: [] },
    { category: "Soft Skills", skills: [] },
    { category: "Languages", skills: [] },
  ],
  projects: [
    {
      id: "1",
      name: "",
      description: "",
      technologies: [],
      link: "",
      github: "",
    },
  ],
};

export default function PortfolioPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [resumeData, setResumeData] = useState(initialResumeData);
  const [previewMode, setPreviewMode] = useState(false);

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [""],
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: "",
      description: "",
      technologies: [],
      link: "",
      github: "",
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const exportResume = () => {
    // In a real app, this would generate a PDF
    console.log("Exporting resume:", resumeData);
    alert("Resume export feature coming soon! (Premium feature)");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access portfolio builder.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Build Your Portfolio
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-purple-100">
              Create stunning resumes and portfolios with professional templates and easy-to-use tools.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="editor">Resume Editor</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resumeTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedTemplate === template.id
                          ? "ring-2 ring-primary shadow-lg"
                          : ""
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">{template.preview}</div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.description}
                        </p>
                        {template.popular && (
                          <Badge className="bg-yellow-500 text-yellow-900">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {selectedTemplate === template.id && (
                          <div className="mt-4">
                            <Button size="sm" className="w-full">
                              Selected
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Template Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Professional Layouts</h3>
                      <p className="text-sm text-muted-foreground">
                        ATS-friendly templates designed by career experts
                      </p>
                    </div>
                    <div className="text-center">
                      <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Customizable Design</h3>
                      <p className="text-sm text-muted-foreground">
                        Personalize colors, fonts, and layouts to match your style
                      </p>
                    </div>
                    <div className="text-center">
                      <Download className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Multiple Formats</h3>
                      <p className="text-sm text-muted-foreground">
                        Export as PDF, Word, or shareable link
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Resume Editor</h2>
                <div className="flex gap-2">
                  <Button
                    variant={previewMode ? "outline" : "default"}
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  <Button onClick={() => {}}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              {!previewMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => updatePersonalInfo("email", e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={resumeData.personalInfo.location}
                            onChange={(e) => updatePersonalInfo("location", e.target.value)}
                            placeholder="San Francisco, CA"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          value={resumeData.personalInfo.summary}
                          onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                          placeholder="Brief summary of your professional background and career goals..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Work Experience</CardTitle>
                      <Button size="sm" onClick={addExperience}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={exp.id} className="p-4 border rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Company Name"
                                value={exp.company}
                                onChange={(e) => {
                                  const updated = [...resumeData.experience];
                                  updated[index].company = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: updated }));
                                }}
                              />
                              <Input
                                placeholder="Position"
                                value={exp.position}
                                onChange={(e) => {
                                  const updated = [...resumeData.experience];
                                  updated[index].position = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: updated }));
                                }}
                              />
                            </div>
                            <Textarea
                              placeholder="Job description and achievements..."
                              rows={3}
                              value={exp.description}
                              onChange={(e) => {
                                const updated = [...resumeData.experience];
                                updated[index].description = e.target.value;
                                setResumeData(prev => ({ ...prev, experience: updated }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resumeData.skills.map((skillGroup, index) => (
                          <div key={index}>
                            <Label className="font-medium">{skillGroup.category}</Label>
                            <Input
                              placeholder={`Enter ${skillGroup.category.toLowerCase()}...`}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projects */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Projects</CardTitle>
                      <Button size="sm" onClick={addProject}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resumeData.projects.map((project, index) => (
                          <div key={project.id} className="p-4 border rounded-lg space-y-3">
                            <Input
                              placeholder="Project Name"
                              value={project.name}
                              onChange={(e) => {
                                const updated = [...resumeData.projects];
                                updated[index].name = e.target.value;
                                setResumeData(prev => ({ ...prev, projects: updated }));
                              }}
                            />
                            <Textarea
                              placeholder="Project description..."
                              rows={2}
                              value={project.description}
                              onChange={(e) => {
                                const updated = [...resumeData.projects];
                                updated[index].description = e.target.value;
                                setResumeData(prev => ({ ...prev, projects: updated }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Resume Preview */
                <Card className="max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="text-center border-b pb-6">
                        <h1 className="text-3xl font-bold mb-2">
                          {resumeData.personalInfo.fullName || "Your Name"}
                        </h1>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                          {resumeData.personalInfo.email && (
                            <span>📧 {resumeData.personalInfo.email}</span>
                          )}
                          {resumeData.personalInfo.phone && (
                            <span>📱 {resumeData.personalInfo.phone}</span>
                          )}
                          {resumeData.personalInfo.location && (
                            <span>📍 {resumeData.personalInfo.location}</span>
                          )}
                        </div>
                        {resumeData.personalInfo.summary && (
                          <p className="mt-4 text-center max-w-2xl mx-auto">
                            {resumeData.personalInfo.summary}
                          </p>
                        )}
                      </div>

                      {/* Experience */}
                      {resumeData.experience.some(exp => exp.company || exp.position) && (
                        <div>
                          <h2 className="text-xl font-semibold mb-4 border-b">Experience</h2>
                          <div className="space-y-4">
                            {resumeData.experience
                              .filter(exp => exp.company || exp.position)
                              .map((exp) => (
                                <div key={exp.id}>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-semibold">{exp.position || "Position"}</h3>
                                      <p className="text-muted-foreground">{exp.company || "Company"}</p>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {exp.startDate} - {exp.endDate || "Present"}
                                    </span>
                                  </div>
                                  {exp.description && (
                                    <p className="text-sm">{exp.description}</p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {resumeData.projects.some(proj => proj.name) && (
                        <div>
                          <h2 className="text-xl font-semibold mb-4 border-b">Projects</h2>
                          <div className="space-y-4">
                            {resumeData.projects
                              .filter(proj => proj.name)
                              .map((proj) => (
                                <div key={proj.id}>
                                  <h3 className="font-semibold">{proj.name}</h3>
                                  {proj.description && (
                                    <p className="text-sm text-muted-foreground">{proj.description}</p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Portfolio Website Builder
                  </CardTitle>
                  <CardDescription>
                    Create a stunning portfolio website to showcase your work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary transition-colors">
                      <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Add Project</h3>
                      <p className="text-sm text-muted-foreground">
                        Showcase your work with images and descriptions
                      </p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary transition-colors">
                      <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Add Images</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload screenshots and project photos
                      </p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary transition-colors">
                      <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Customize</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose themes and personalize your site
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Options
                  </CardTitle>
                  <CardDescription>
                    Download your resume in multiple formats or share it online
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Download Formats</h3>
                      <div className="space-y-3">
                        <Button onClick={exportResume} className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-3" />
                          Download as PDF
                        </Button>
                        <Button onClick={exportResume} variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-3" />
                          Download as Word
                        </Button>
                        <Button onClick={exportResume} variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-3" />
                          Download as Plain Text
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Share & Publish</h3>
                      <div className="space-y-3">
                        <Button onClick={exportResume} variant="outline" className="w-full justify-start">
                          <Globe className="h-4 w-4 mr-3" />
                          Generate Shareable Link
                        </Button>
                        <Button onClick={exportResume} variant="outline" className="w-full justify-start">
                          <Upload className="h-4 w-4 mr-3" />
                          Upload to LinkedIn
                        </Button>
                        <Button onClick={exportResume} variant="outline" className="w-full justify-start">
                          <Mail className="h-4 w-4 mr-3" />
                          Email Resume
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </div>
  );
}
