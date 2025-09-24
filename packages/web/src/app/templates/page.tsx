"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Copy,
  Edit,
  Star,
  Mail,
  Briefcase,
  Target,
  Lightbulb,
  CheckCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Mock templates
const coverLetterTemplates = {
  softwareEngineer: {
    title: "Software Engineer Cover Letter",
    content: `Dear Hiring Manager,

I am excited to apply for the Software Engineer position at [Company Name]. With [X] years of experience in full-stack development and a passion for creating scalable, user-centric applications, I am confident in my ability to contribute to your team's success.

In my previous role at [Previous Company], I led the development of [specific project], which resulted in [quantifiable achievement]. My expertise in [key technologies] and commitment to writing clean, maintainable code align perfectly with [Company Name]'s mission of [company mission].

I am particularly drawn to [Company Name] because of [specific reason about company]. I would welcome the opportunity to discuss how my skills and experience can contribute to your continued success.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
[Your Name]`,
  },
  productManager: {
    title: "Product Manager Cover Letter",
    content: `Dear Hiring Manager,

I am writing to express my strong interest in the Product Manager position at [Company Name]. With [X] years of experience driving product strategy and delivering user-focused solutions, I am eager to bring my expertise to your innovative team.

At [Previous Company], I successfully launched [product/feature], which increased [metric] by [percentage] and generated [revenue impact]. My background in [relevant experience] combined with my data-driven approach to product development would enable me to contribute immediately to [Company Name]'s growth objectives.

What excites me most about [Company Name] is [specific aspect of company/culture]. I am passionate about [relevant industry trend] and believe my experience in [specific skill] would be valuable in driving [company goal].

I would welcome the opportunity to discuss how my product leadership experience and strategic vision align with [Company Name]'s objectives.

Thank you for your consideration.

Sincerely,
[Your Name]`,
  },
  designer: {
    title: "UX Designer Cover Letter",
    content: `Dear Hiring Manager,

I am thrilled to apply for the UX Designer position at [Company Name]. With [X] years of experience creating intuitive, user-centered designs that drive engagement and business results, I am excited about the opportunity to contribute to your design team.

In my recent role at [Previous Company], I redesigned [specific project], resulting in [quantifiable improvement, e.g., "a 40% increase in user engagement"]. My expertise in [key design tools/methods] and my user research background enable me to create designs that are both beautiful and effective.

I am particularly impressed by [Company Name]'s commitment to [specific company value/design philosophy]. I would love to bring my passion for [design approach] to help [Company Name] continue to deliver exceptional user experiences.

I look forward to the opportunity to discuss how my design expertise and creative problem-solving skills can contribute to your team's success.

Best regards,
[Your Name]`,
  },
};

const emailTemplates = {
  followUp: {
    title: "Interview Follow-up Email",
    subject: "Thank You for the Interview - [Position] Role",
    content: `Dear [Interviewer's Name],

Thank you for taking the time to interview me for the [Position] role at [Company Name] yesterday. I enjoyed learning more about [specific topic discussed] and [Company Name]'s approach to [relevant topic].

Our conversation about [specific discussion point] was particularly interesting, and it reinforced my enthusiasm for [specific aspect of role/company].

I am confident that my experience in [relevant experience] would allow me to contribute effectively to [specific team/project mentioned].

I would welcome the opportunity to discuss next steps and learn more about the timeline for your decision. Please don't hesitate to contact me if you need any additional information.

Thank you again for your time and consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email Address]
[Your LinkedIn Profile]`,
  },
  networking: {
    title: "Networking Introduction Email",
    subject: "Introduction - [Your Background] Interested in [Company/Industry]",
    content: `Dear [Contact's Name],

I hope this email finds you well. My name is [Your Name], and I'm a [Your Current Position] with [X] years of experience in [Your Field].

I came across your profile/work on [how you found them] and was impressed by [specific accomplishment/project]. I am particularly interested in [Company Name/Industry] and would love to learn more about your experience in [relevant area].

I am currently exploring opportunities in [specific area of interest] and would greatly value any insights you might be willing to share about [specific question/topic].

Would you be open to a brief call or meeting to discuss [specific topic]? I completely understand if you're busy, and I appreciate you taking the time to read this message.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your LinkedIn Profile]`,
  },
};

const resumeTips = [
  {
    category: "Content",
    tips: [
      "Use quantifiable achievements (numbers, percentages, metrics)",
      "Tailor your resume for each job application",
      "Include relevant keywords from the job description",
      "Focus on accomplishments, not just responsibilities",
    ],
  },
  {
    category: "Format",
    tips: [
      "Keep it to 1-2 pages for most professionals",
      "Use clear, readable fonts (10-12pt)",
      "Maintain consistent formatting throughout",
      "Use bullet points for easy scanning",
    ],
  },
  {
    category: "Keywords",
    tips: [
      "Include industry-specific terms",
      "Use action verbs (achieved, implemented, led)",
      "Match keywords from job postings",
      "Balance keywords with natural language",
    ],
  },
];

export default function TemplatesPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("cover-letters");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState("");
  const [templateType, setTemplateType] = useState("softwareEngineer");

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access application templates.</p>
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
              Application Templates
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-purple-100">
              Professional templates for cover letters, emails, and resume optimization to help you stand out from the competition.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cover-letters">Cover Letters</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
              <TabsTrigger value="resume-tips">Resume Tips</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
            </TabsList>

            <TabsContent value="cover-letters" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Selection */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Cover Letter Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(coverLetterTemplates).map(([key, template]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedTemplate(key);
                              setCustomContent(template.content);
                            }}
                            className={`w-full text-left p-4 rounded-lg border transition-colors ${
                              selectedTemplate === key
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-medium">{template.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Professional template with customizable sections
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Template Preview */}
                <div className="lg:col-span-2">
                  {selectedTemplate ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>
                            {coverLetterTemplates[selectedTemplate as keyof typeof coverLetterTemplates].title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyToClipboard(customContent)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(customContent, "cover-letter.txt")}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={customContent}
                          onChange={(e) => setCustomContent(e.target.value)}
                          rows={20}
                          className="font-mono text-sm resize-none"
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a template
                      </h3>
                      <p className="text-gray-600">
                        Choose a cover letter template from the sidebar to get started.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emails" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {template.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Subject:</Label>
                        <p className="text-sm bg-gray-50 p-2 rounded border mt-1">
                          {template.subject}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email Content:</Label>
                        <Textarea
                          value={template.content}
                          readOnly
                          rows={12}
                          className="font-mono text-sm resize-none mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleCopyToClipboard(template.content)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Content
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(template.content, `${key}-email.txt`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resume-tips" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumeTips.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {category.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Premium Resume Optimization
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered resume analysis and personalized improvement suggestions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Resume Analysis Features</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• ATS compatibility scoring</li>
                        <li>• Keyword optimization suggestions</li>
                        <li>• Industry-specific recommendations</li>
                        <li>• Formatting and design feedback</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Template Library</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• 50+ professional templates</li>
                        <li>• Industry-specific designs</li>
                        <li>• Mobile-optimized layouts</li>
                        <li>• Export in multiple formats</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Template Customizer
                  </CardTitle>
                  <CardDescription>
                    Create personalized templates with your information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Your Information</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="John Doe" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" placeholder="(555) 123-4567" />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn Profile</Label>
                          <Input id="linkedin" placeholder="https://linkedin.com/in/johndoe" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Job Details</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input id="company" placeholder="TechCorp Inc." />
                        </div>
                        <div>
                          <Label htmlFor="position">Position Title</Label>
                          <Input id="position" placeholder="Software Engineer" />
                        </div>
                        <div>
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-1">0-1 years</SelectItem>
                              <SelectItem value="1-3">1-3 years</SelectItem>
                              <SelectItem value="3-5">3-5 years</SelectItem>
                              <SelectItem value="5-10">5-10 years</SelectItem>
                              <SelectItem value="10+">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full">
                      Generate Personalized Template
                    </Button>
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
