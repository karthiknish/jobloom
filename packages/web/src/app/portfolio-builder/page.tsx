"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Layout,
  MessageSquare,
  Users,
  Briefcase,
  GraduationCap,
  Code2,
  Camera,
  FileText,
  Globe,
  BarChart3,
  Settings,
  Eye,
  Save,
  Plus,
  Trash2,
  Move,
  Edit,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubdomainSettings } from "@/components/account/SubdomainSettings";
import { cn } from "@/lib/utils";
import { portfolioTemplates } from "@/config/portfolioTemplates";
import { showSuccess, showError } from "@/components/ui/Toast";

// Portfolio data structure
interface PortfolioSection {
  id: string;
  type: 'hero' | 'about' | 'experience' | 'projects' | 'education' | 'skills' | 'testimonials' | 'contact' | 'blog' | 'gallery' | 'custom';
  title: string;
  content: any;
  order: number;
  visible: boolean;
}

interface PortfolioData {
  id?: string;
  templateId: string;
  title: string;
  description: string;
  subdomain?: string;
  customDomain?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
    spacing: 'compact' | 'normal' | 'spacious';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  };
  sections: PortfolioSection[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
    email?: string;
  };
  analytics: {
    googleAnalytics?: string;
    facebookPixel?: string;
  };
  settings: {
    isPublic: boolean;
    showContactForm: boolean;
    allowDownloads: boolean;
    password?: string;
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  helper?: string;
  completed: boolean;
  actionHint?: string;
}

// Section types and their default content
const sectionDefaults: Record<PortfolioSection['type'], any> = {
  hero: {
    headline: "Welcome to my portfolio",
    subheadline: "I'm a creative professional ready to bring your ideas to life",
    backgroundImage: "",
    ctaText: "Get In Touch",
    ctaLink: "#contact"
  },
  about: {
    content: "Tell your story here. Share your background, passions, and what drives you.",
    image: "",
    skills: []
  },
  experience: {
    items: [{
      id: "1",
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: []
    }]
  },
  projects: {
    items: [{
      id: "1",
      title: "",
      description: "",
      image: "",
      technologies: [],
      link: "",
      github: "",
      featured: false
    }]
  },
  education: {
    items: [{
      id: "1",
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
      honors: ""
    }]
  },
  skills: {
    categories: [
      { name: "Technical", skills: [] },
      { name: "Soft Skills", skills: [] },
      { name: "Tools", skills: [] }
    ]
  },
  testimonials: {
    items: [{
      id: "1",
      name: "",
      role: "",
      company: "",
      content: "",
      image: "",
      rating: 5
    }]
  },
  contact: {
    email: "",
    phone: "",
    location: "",
    message: "Let's work together!"
  },
  blog: {
    posts: [{
      id: "1",
      title: "",
      excerpt: "",
      content: "",
      image: "",
      date: "",
      tags: []
    }]
  },
  gallery: {
    images: [{
      id: "1",
      src: "",
      alt: "",
      caption: "",
      category: ""
    }]
  },
  custom: {
    content: "",
    layout: "text"
  }
};

// Available section types
const sectionTypes = [
  { id: 'hero', type: 'hero' as const, name: 'Hero Section', icon: Eye, description: 'Main banner with headline and CTA' },
  { id: 'about', type: 'about' as const, name: 'About Me', icon: Users, description: 'Personal introduction and background' },
  { id: 'experience', type: 'experience' as const, name: 'Experience', icon: Briefcase, description: 'Work history and achievements' },
  { id: 'projects', type: 'projects' as const, name: 'Projects', icon: Code2, description: 'Portfolio of work and case studies' },
  { id: 'education', type: 'education' as const, name: 'Education', icon: GraduationCap, description: 'Academic background' },
  { id: 'skills', type: 'skills' as const, name: 'Skills', icon: BarChart3, description: 'Technical and soft skills' },
  { id: 'testimonials', type: 'testimonials' as const, name: 'Testimonials', icon: MessageSquare, description: 'Client reviews and feedback' },
  { id: 'contact', type: 'contact' as const, name: 'Contact', icon: MessageSquare, description: 'Contact information and form' },
  { id: 'blog', type: 'blog' as const, name: 'Blog', icon: FileText, description: 'Articles and insights' },
  { id: 'gallery', type: 'gallery' as const, name: 'Gallery', icon: Camera, description: 'Photo and media gallery' },
  { id: 'custom', type: 'custom' as const, name: 'Custom Section', icon: Layout, description: 'Fully customizable content' }
];

const CHECKLIST_TAB_MAP: Record<string, string> = {
  "choose-template": "design",
  "hero-content": "content",
  "projects": "sections",
  "about-section": "sections",
  "contact-details": "sections",
  seo: "seo",
  social: "settings",
  publish: "settings",
};

const ShareableLink = ({ label, href }: { label: string; href: string }) => (
  <a
    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {label}
    <ExternalLink className="h-3.5 w-3.5" />
  </a>
);

export default function PortfolioBuilderPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("design");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioData>({
    templateId: "minimalist",
    title: "",
    description: "",
    theme: {
      primaryColor: "var(--primary)",
      secondaryColor: "var(--secondary)",
      fontFamily: "Inter",
      fontSize: "medium",
      spacing: "normal",
      borderRadius: "medium"
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: []
    },
    sections: [
      {
        id: "hero",
        type: "hero",
        title: "Hero",
        content: sectionDefaults.hero,
        order: 0,
        visible: true
      }
    ],
    socialLinks: {},
    analytics: {},
    settings: {
      isPublic: false,
      showContactForm: true,
      allowDownloads: false
    }
  });

  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [portfolioProgress, setPortfolioProgress] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [statusCard, setStatusCard] = useState<{ title: string; description: string; icon: ReactNode; accent: string }>(
    () => ({
      title: "Draft Portfolio",
      description: "Fill out your content, publish settings, and preview before sharing.",
      icon: <CircleDashed className="h-5 w-5" />,
      accent: "border-border/70"
    })
  );
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const completionFlags = useMemo(() => {
    const heroSection = portfolio.sections.find((section) => section.type === "hero");
    const hasHeadline = Boolean(heroSection?.content?.headline);
    const hasDescription = Boolean(heroSection?.content?.subheadline || portfolio.description);
    const hasProjects = portfolio.sections.some(
      (section) => section.type === "projects" && section.content?.items?.some((item: any) => item.title || item.description)
    );
    const hasAbout = portfolio.sections.some(
      (section) => section.type === "about" && (section.content?.content || section.content?.skills?.length)
    );
    const hasContact = portfolio.sections.some(
      (section) => section.type === "contact" && (section.content?.email || section.content?.message)
    );
    const hasTemplate = Boolean(portfolio.templateId);
    const hasPublicLink = Boolean(portfolio.settings.isPublic && (portfolio.subdomain || portfolio.customDomain));
    const hasSeoFields = Boolean(portfolio.seo.metaTitle && portfolio.seo.metaDescription);
    const hasSocialLinks = Object.values(portfolio.socialLinks).some(Boolean);

    return {
      hasHero: hasHeadline,
      hasDescription,
      hasProjects,
      hasAbout,
      hasContact,
      hasTemplate,
      hasPublicLink,
      hasSeoFields,
      hasSocialLinks,
    };
  }, [portfolio]);

  useEffect(() => {
    const items: ChecklistItem[] = [
      {
        id: "choose-template",
        label: "Select a template",
        helper: "Pick a design foundation that matches your personal brand.",
        actionHint: completionFlags.hasTemplate ? undefined : "Open the Design tab to choose one.",
        completed: completionFlags.hasTemplate,
      },
      {
        id: "hero-content",
        label: "Fill hero headline and intro",
        helper: "Lead with a clear value statement so visitors know who you are.",
        actionHint: completionFlags.hasHero ? undefined : "Add a headline inside the hero section.",
        completed: completionFlags.hasHero && completionFlags.hasDescription,
      },
      {
        id: "projects",
        label: "Showcase at least one project",
        helper: "Highlight work you're proud of with descriptions and links.",
        actionHint: completionFlags.hasProjects ? undefined : "Add a project card in the sections tab.",
        completed: completionFlags.hasProjects,
      },
      {
        id: "about-section",
        label: "Share your story",
        helper: "Add an about section with a narrative or bio to give context.",
        actionHint: completionFlags.hasAbout ? undefined : "Enable and fill the About section.",
        completed: completionFlags.hasAbout,
      },
      {
        id: "contact-details",
        label: "Add contact or call-to-action",
        helper: "Let recruiters reach out by including contact info or form.",
        actionHint: completionFlags.hasContact ? undefined : "Add your email or enable the contact form.",
        completed: completionFlags.hasContact,
      },
      {
        id: "seo",
        label: "Write SEO title & description",
        helper: "Improve search visibility with a meta title and description.",
        actionHint: completionFlags.hasSeoFields ? undefined : "Fill the SEO tab fields.",
        completed: completionFlags.hasSeoFields,
      },
      {
        id: "social",
        label: "Link social profiles",
        helper: "Add LinkedIn, GitHub, or other profiles for deeper insight.",
        actionHint: completionFlags.hasSocialLinks ? undefined : "Add links in the settings tab.",
        completed: completionFlags.hasSocialLinks,
      },
      {
        id: "publish",
        label: "Publish with a subdomain",
        helper: "Turn on public access and reserve a subdomain to share your site.",
        actionHint: completionFlags.hasPublicLink ? undefined : "Toggle public mode and claim a subdomain below.",
        completed: completionFlags.hasPublicLink,
      },
    ];

    setChecklist(items);

    const completedCount = items.filter((item) => item.completed).length;
    setPortfolioProgress(Math.round((completedCount / items.length) * 100));

    setStatusCard(() => {
      if (completionFlags.hasPublicLink) {
        return {
          title: "Portfolio Published",
          description: "Your site is live. Share the link with recruiters and track performance.",
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          accent: "border-emerald-200/80",
        };
      }

      if (completedCount >= 4) {
        return {
          title: "Ready to Publish",
          description: "Great content! Reserve a subdomain to make your portfolio public.",
          icon: <Sparkles className="h-5 w-5 text-primary" />,
          accent: "border-primary/40",
        };
      }

      return {
        title: "Draft Portfolio",
        description: "Fill out your content, publish settings, and preview before sharing.",
        icon: <CircleDashed className="h-5 w-5 text-muted-foreground" />,
        accent: "border-border/70",
      };
    });
  }, [completionFlags]);

  // Load portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/site", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (e: any) {
      console.error("Failed to load portfolio:", e);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access portfolio builder.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  // Preview mode component
  if (previewMode) {
    return (
      <div className="min-h-screen bg-background">
        {/* Preview Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Preview Mode
                </div>
                <span className="text-sm text-muted-foreground">
                  Template: {portfolioTemplates.find(t => t.id === portfolio.templateId)?.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section Preview */}
            {portfolio.sections.find(s => s.type === 'hero' && s.visible) && (
              <section className="text-center py-16 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                  {portfolio.sections.find(s => s.type === 'hero')?.content?.headline || "Your Portfolio"}
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  {portfolio.sections.find(s => s.type === 'hero')?.content?.subheadline || "Your professional description"}
                </p>
                <Button size="lg">
                  {portfolio.sections.find(s => s.type === 'hero')?.content?.ctaText || "Get In Touch"}
                </Button>
              </section>
            )}

            {/* About Section Preview */}
            {portfolio.sections.find(s => s.type === 'about' && s.visible) && (
              <section className="py-12">
                <h2 className="text-3xl font-bold mb-6">About Me</h2>
                <div className="prose prose-lg max-w-none">
                  <p>
                    {portfolio.sections.find(s => s.type === 'about')?.content?.content || 
                     "Your about section content will appear here."}
                  </p>
                </div>
              </section>
            )}

            {/* Contact Section Preview */}
            {portfolio.sections.find(s => s.type === 'contact' && s.visible) && (
              <section className="py-12 bg-muted/30 rounded-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center">Get In Touch</h2>
                <div className="text-center space-y-4">
                  <p className="text-lg">
                    {portfolio.sections.find(s => s.type === 'contact')?.content?.message || 
                     "Let's work together!"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    {portfolio.sections.find(s => s.type === 'contact')?.content?.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{portfolio.sections.find(s => s.type === 'contact')?.content?.email}</span>
                      </div>
                    )}
                    {portfolio.sections.find(s => s.type === 'contact')?.content?.phone && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Phone:</span>
                        <span>{portfolio.sections.find(s => s.type === 'contact')?.content?.phone}</span>
                      </div>
                    )}
                    {portfolio.sections.find(s => s.type === 'contact')?.content?.location && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Location:</span>
                        <span>{portfolio.sections.find(s => s.type === 'contact')?.content?.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Other sections placeholder */}
            {portfolio.sections.filter(s => s.visible && !['hero', 'about', 'contact'].includes(s.type)).length > 0 && (
              <section className="py-12">
                <h2 className="text-3xl font-bold mb-6">More Sections</h2>
                <div className="grid gap-4">
                  {portfolio.sections
                    .filter(s => s.visible && !['hero', 'about', 'contact'].includes(s.type))
                    .map(section => (
                      <Card key={section.id} className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                        <p className="text-muted-foreground">
                          {sectionTypes.find(t => t.id === section.type)?.description}
                        </p>
                      </Card>
                    ))}
                </div>
              </section>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Save portfolio data
  const savePortfolio = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(portfolio),
      });
      if (!res.ok) throw new Error("Failed to save portfolio");
      showSuccess("Portfolio saved!", "Your portfolio has been updated successfully.");
    } catch (e: any) {
      showError("Save failed", e.message || "Unable to save portfolio. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Add new section
  const addSection = (type: PortfolioSection['type']) => {
    const newSection: PortfolioSection = {
      id: `${type}-${Date.now()}`,
      type,
      title: sectionTypes.find(s => s.id === type)?.name || type,
      content: { ...sectionDefaults[type] },
      order: portfolio.sections.length,
      visible: true
    };
    setPortfolio(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setShowSectionSelector(false);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  // Update section
  const updateSection = (sectionId: string, updates: Partial<PortfolioSection>) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }));
  };

  // Update section content
  const updateSectionContent = (sectionId: string, content: any) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      )
    }));
  };


  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-xl"
      >
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Portfolio Builder</h1>
              <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
                Create a stunning portfolio website to showcase your work and attract opportunities
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
              >
                <Eye className="h-5 w-5 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>
              <Button 
                size="lg"
                onClick={savePortfolio} 
                disabled={saving}
                className="bg-white text-primary hover:bg-white/90 transition-all duration-200 shadow-lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Progress and Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Portfolio Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-bold text-primary">{portfolioProgress}%</span>
                </div>
                <Progress value={portfolioProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {portfolioProgress === 100 ? '🎉 Your portfolio is complete!' : `${checklist.filter(item => item.completed).length} of ${checklist.length} tasks completed`}
                </p>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className={`shadow-lg border-0 ${statusCard.accent}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {statusCard.icon}
                  {statusCard.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{statusCard.description}</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("design")}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Change Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("sections")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? "Edit Mode" : "Preview"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="design" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200">Design</TabsTrigger>
              <TabsTrigger value="content" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200">Content</TabsTrigger>
              <TabsTrigger value="sections" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200">Sections</TabsTrigger>
              <TabsTrigger value="seo" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200">SEO</TabsTrigger>
              <TabsTrigger value="settings" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200">Settings</TabsTrigger>
            </TabsList>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Template Selection */}
                <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="h-6 w-6 text-primary" />
                      </div>
                      Template Selection
                    </CardTitle>
                    <CardDescription className="text-base">Choose a design template that matches your professional brand</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolioTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setPortfolio(prev => ({ ...prev, templateId: template.id }))}
                          className={cn(
                            "p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                            portfolio.templateId === template.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg"
                              : "border-border hover:border-primary/50 bg-card"
                          )}
                        >
                          <div className="font-semibold text-base">{template.name}</div>
                          <div className="text-sm text-muted-foreground mt-2 leading-relaxed">{template.description}</div>
                          {template.popular && (
                            <Badge variant="secondary" className="mt-3 text-xs font-medium">Popular</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Customization */}
                <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      Theme Customization
                    </CardTitle>
                    <CardDescription className="text-base">Personalize colors, fonts, and visual styling</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-0">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Color Scheme</Label>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={portfolio.theme.primaryColor}
                              onChange={(e) => setPortfolio(prev => ({
                                ...prev,
                                theme: { ...prev.theme, primaryColor: e.target.value }
                              }))}
                              className="h-12 w-20 rounded-lg border-2"
                            />
                            <span className="text-sm text-muted-foreground font-mono">{portfolio.theme.primaryColor}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondaryColor" className="text-sm font-medium">Secondary Color</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="secondaryColor"
                              type="color"
                              value={portfolio.theme.secondaryColor}
                              onChange={(e) => setPortfolio(prev => ({
                                ...prev,
                                theme: { ...prev.theme, secondaryColor: e.target.value }
                              }))}
                              className="h-12 w-20 rounded-lg border-2"
                            />
                            <span className="text-sm text-muted-foreground font-mono">{portfolio.theme.secondaryColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Typography</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Font Family</Label>
                          <Select
                            value={portfolio.theme.fontFamily}
                            onValueChange={(value) => setPortfolio(prev => ({
                              ...prev,
                              theme: { ...prev.theme, fontFamily: value }
                            }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter (Modern)</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                              <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                              <SelectItem value="Open Sans">Open Sans (Friendly)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Font Size</Label>
                          <Select
                            value={portfolio.theme.fontSize}
                            onValueChange={(value: any) => setPortfolio(prev => ({
                              ...prev,
                              theme: { ...prev.theme, fontSize: value }
                            }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-8">
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Portfolio Information</CardTitle>
                  <CardDescription className="text-base">Essential details that define your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">Portfolio Title</Label>
                    <Input
                      id="title"
                      value={portfolio.title}
                      onChange={(e) => setPortfolio(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="My Professional Portfolio"
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={portfolio.description}
                      onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A compelling description of your work, expertise, and what makes you unique..."
                      rows={4}
                      className="text-base resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Portfolio Sections</h3>
                  <p className="text-base text-muted-foreground">Add and arrange sections to build your portfolio</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => setShowSectionSelector(true)}
                  className="shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Section
                </Button>
              </div>

              {/* Section Selector Modal */}
              <AnimatePresence>
                {showSectionSelector && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowSectionSelector(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-6 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">Add New Section</h3>
                            <p className="text-base text-muted-foreground mt-1">Choose a section type to enhance your portfolio</p>
                          </div>
                          <Button variant="ghost" size="lg" onClick={() => setShowSectionSelector(false)} className="rounded-full">
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sectionTypes.map(sectionType => (
                            <button
                              key={sectionType.id}
                              onClick={() => addSection(sectionType.type)}
                              className="p-5 border-2 rounded-xl text-left hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-card group"
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                  <sectionType.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-base">{sectionType.name}</div>
                                  <div className="text-sm text-muted-foreground mt-2 leading-relaxed">{sectionType.description}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sections List */}
              <div className="space-y-4">
                {portfolio.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <motion.div
                      key={section.id}
                      layout
                      className="flex items-center gap-4 p-5 border-2 rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="cursor-move hover:bg-muted rounded-lg">
                          <Move className="h-5 w-5" />
                        </Button>
                        <Switch
                          checked={section.visible}
                          onCheckedChange={(checked) => updateSection(section.id, { visible: checked })}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-base">{section.title}</h4>
                          <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                            {sectionTypes.find(s => s.id === section.type)?.name}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSection(section.id, {
                            order: Math.max(0, section.order - 1)
                          })}
                          disabled={index === 0}
                          className="hover:bg-muted rounded-lg"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSection(section.id, {
                            order: Math.min(portfolio.sections.length - 1, section.order + 1)
                          })}
                          disabled={index === portfolio.sections.length - 1}
                          className="hover:bg-muted rounded-lg"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                          className="hover:bg-muted rounded-lg"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* Section Editor */}
              <AnimatePresence>
                {editingSection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className="mt-4 shadow-lg border-0">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Edit {portfolio.sections.find(s => s.id === editingSection)?.title}
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingSection(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const section = portfolio.sections.find(s => s.id === editingSection);
                          if (!section) return null;

                          switch (section.type) {
                            case 'hero':
                              return (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Headline</Label>
                                    <Input
                                      value={section.content.headline || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        headline: e.target.value
                                      })}
                                      placeholder="Welcome to my portfolio"
                                    />
                                  </div>
                                  <div>
                                    <Label>Subheadline</Label>
                                    <Textarea
                                      value={section.content.subheadline || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        subheadline: e.target.value
                                      })}
                                      placeholder="I'm a creative professional ready to bring your ideas to life"
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <Label>CTA Text</Label>
                                    <Input
                                      value={section.content.ctaText || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        ctaText: e.target.value
                                      })}
                                      placeholder="Get In Touch"
                                    />
                                  </div>
                                </div>
                              );
                            case 'about':
                              return (
                                <div className="space-y-4">
                                  <div>
                                    <Label>About Content</Label>
                                    <Textarea
                                      value={section.content.content || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        content: e.target.value
                                      })}
                                      placeholder="Tell your story here. Share your background, passions, and what drives you."
                                      rows={6}
                                    />
                                  </div>
                                </div>
                              );
                            case 'contact':
                              return (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Email</Label>
                                    <Input
                                      value={section.content.email || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        email: e.target.value
                                      })}
                                      placeholder="your@email.com"
                                    />
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <Input
                                      value={section.content.phone || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        phone: e.target.value
                                      })}
                                      placeholder="+1 (555) 123-4567"
                                    />
                                  </div>
                                  <div>
                                    <Label>Location</Label>
                                    <Input
                                      value={section.content.location || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        location: e.target.value
                                      })}
                                      placeholder="San Francisco, CA"
                                    />
                                  </div>
                                  <div>
                                    <Label>Message</Label>
                                    <Textarea
                                      value={section.content.message || ''}
                                      onChange={(e) => updateSectionContent(editingSection, {
                                        ...section.content,
                                        message: e.target.value
                                      })}
                                      placeholder="Let's work together!"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              );
                            default:
                              return (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p>Editor for {section.type} sections coming soon!</p>
                                </div>
                              );
                          }
                        })()}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-8">
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    Search Engine Optimization
                  </CardTitle>
                  <CardDescription className="text-base">Optimize your portfolio for better search visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle" className="text-base font-medium">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={portfolio.seo.metaTitle}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaTitle: e.target.value }
                      }))}
                      placeholder="Your Name - Professional Portfolio"
                      className="h-11 text-base"
                    />
                    <p className="text-sm text-muted-foreground">Appears in search results and browser tabs (50-60 characters recommended)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription" className="text-base font-medium">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={portfolio.seo.metaDescription}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value }
                      }))}
                      placeholder="Professional portfolio showcasing my work, skills, and experience in web development and design."
                      rows={4}
                      className="text-base resize-none"
                    />
                    <p className="text-sm text-muted-foreground">Summary shown in search results (150-160 characters recommended)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Keywords</Label>
                    <Input
                      value={portfolio.seo.keywords.join(', ')}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        }
                      }))}
                      placeholder="web developer, react, javascript, portfolio, UI/UX"
                      className="h-11 text-base"
                    />
                    <p className="text-sm text-muted-foreground">Separate keywords with commas. Focus on your core skills and expertise.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Privacy Settings */}
                <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Privacy & Access</CardTitle>
                    <CardDescription className="text-base">Control who can view your portfolio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Public Portfolio</Label>
                        <p className="text-sm text-muted-foreground">Make your portfolio visible to everyone</p>
                      </div>
                      <Switch
                        checked={portfolio.settings.isPublic}
                        onCheckedChange={(checked) => setPortfolio(prev => ({
                          ...prev,
                          settings: { ...prev.settings, isPublic: checked }
                        }))}
                      />
                    </div>

                    {portfolio.settings.isPublic && (
                      <div className="space-y-2">
                        <Label htmlFor="subdomain" className="text-base font-medium">Subdomain</Label>
                        <div className="flex gap-3">
                          <Input
                            id="subdomain"
                            value={portfolio.subdomain || ''}
                            onChange={(e) => setPortfolio(prev => ({ ...prev, subdomain: e.target.value }))}
                            placeholder="yourname"
                            className="h-11 text-base flex-1"
                          />
                          <span className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 rounded-lg border">.hireall.com</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Password Protection</Label>
                        <p className="text-sm text-muted-foreground">Require password to view portfolio</p>
                      </div>
                      <Switch
                        checked={!!portfolio.settings.password}
                        onCheckedChange={(checked) => setPortfolio(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            password: checked ? 'password123' : undefined
                          }
                        }))}
                      />
                    </div>

                    {portfolio.settings.password && (
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-base font-medium">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={portfolio.settings.password}
                          onChange={(e) => setPortfolio(prev => ({
                            ...prev,
                            settings: { ...prev.settings, password: e.target.value }
                          }))}
                          className="h-11 text-base"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Settings */}
                <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                    <CardDescription className="text-base">Social links and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {Object.entries({
                      email: 'Email',
                      linkedin: 'LinkedIn',
                      github: 'GitHub',
                      twitter: 'Twitter',
                      instagram: 'Instagram',
                      youtube: 'YouTube',
                      website: 'Website'
                    }).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-base font-medium">{label}</Label>
                        <Input
                          id={key}
                          value={portfolio.socialLinks[key as keyof typeof portfolio.socialLinks] || ''}
                          onChange={(e) => setPortfolio(prev => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              [key]: e.target.value
                            }
                          }))}
                          placeholder={key === 'email' ? 'your@email.com' : 'https://...'}
                          className="h-11 text-base"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </div>
  );
}
