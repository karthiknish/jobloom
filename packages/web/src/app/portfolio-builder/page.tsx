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
      showSuccess("Portfolio saved successfully!");
    } catch (e: any) {
      showError(e.message || "Failed to save portfolio");
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


  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio Builder</h1>
              <p className="mt-2 text-primary-foreground/80">
                Create a stunning portfolio website to showcase your work
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>
              <Button onClick={savePortfolio} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Template
                    </CardTitle>
                    <CardDescription>Choose a design template for your portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolioTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setPortfolio(prev => ({ ...prev, templateId: template.id }))}
                          className={cn(
                            "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                            portfolio.templateId === template.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
                          {template.popular && (
                            <Badge variant="secondary" className="mt-2 text-xs">Popular</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Customization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Theme Customization
                    </CardTitle>
                    <CardDescription>Customize colors, fonts, and spacing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={portfolio.theme.primaryColor}
                          onChange={(e) => setPortfolio(prev => ({
                            ...prev,
                            theme: { ...prev.theme, primaryColor: e.target.value }
                          }))}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={portfolio.theme.secondaryColor}
                          onChange={(e) => setPortfolio(prev => ({
                            ...prev,
                            theme: { ...prev.theme, secondaryColor: e.target.value }
                          }))}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={portfolio.theme.fontFamily}
                        onValueChange={(value) => setPortfolio(prev => ({
                          ...prev,
                          theme: { ...prev.theme, fontFamily: value }
                        }))}
                      >
                        <SelectTrigger>
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
                      <Label>Font Size</Label>
                      <Select
                        value={portfolio.theme.fontSize}
                        onValueChange={(value: any) => setPortfolio(prev => ({
                          ...prev,
                          theme: { ...prev.theme, fontSize: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential details about your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Portfolio Title</Label>
                    <Input
                      id="title"
                      value={portfolio.title}
                      onChange={(e) => setPortfolio(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="My Portfolio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={portfolio.description}
                      onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A brief description of what you do..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Portfolio Sections</h3>
                  <p className="text-sm text-muted-foreground">Add and arrange sections for your portfolio</p>
                </div>
                <Button onClick={() => setShowSectionSelector(true)}>
                  <Plus className="h-4 w-4 mr-2" />
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
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSectionSelector(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Add Section</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowSectionSelector(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Choose a section type to add to your portfolio</p>
                      </div>
                      <ScrollArea className="max-h-96">
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {sectionTypes.map(sectionType => (
                            <button
                              key={sectionType.id}
                              onClick={() => addSection(sectionType.type)}
                              className="p-4 border rounded-lg text-left hover:border-primary/50 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <sectionType.icon className="h-8 w-8 text-primary mt-1" />
                                <div>
                                  <div className="font-medium">{sectionType.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">{sectionType.description}</div>
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
                      className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="cursor-move">
                          <Move className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={section.visible}
                          onCheckedChange={(checked) => updateSection(section.id, { visible: checked })}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{section.title}</h4>
                          <Badge variant="outline" className="text-xs">
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
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSection(section.id, {
                            order: Math.min(portfolio.sections.length - 1, section.order + 1)
                          })}
                          disabled={index === portfolio.sections.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                      Search Engine Optimization
                    </CardTitle>
                  <CardDescription>Optimize your portfolio for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={portfolio.seo.metaTitle}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaTitle: e.target.value }
                      }))}
                      placeholder="Your Name - Portfolio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={portfolio.seo.metaDescription}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value }
                      }))}
                      placeholder="Professional portfolio showcasing my work and experience"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Keywords</Label>
                    <Input
                      value={portfolio.seo.keywords.join(', ')}
                      onChange={(e) => setPortfolio(prev => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        }
                      }))}
                      placeholder="web developer, react, javascript"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separate keywords with commas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Privacy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Access</CardTitle>
                    <CardDescription>Control who can view your portfolio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public Portfolio</Label>
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
                      <div>
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <div className="flex gap-2">
                          <Input
                            id="subdomain"
                            value={portfolio.subdomain || ''}
                            onChange={(e) => setPortfolio(prev => ({ ...prev, subdomain: e.target.value }))}
                            placeholder="yourname"
                          />
                          <span className="flex items-center text-sm text-muted-foreground">.hireall.com</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Password Protection</Label>
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
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={portfolio.settings.password}
                          onChange={(e) => setPortfolio(prev => ({
                            ...prev,
                            settings: { ...prev.settings, password: e.target.value }
                          }))}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Social links and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries({
                      email: 'Email',
                      linkedin: 'LinkedIn',
                      github: 'GitHub',
                      twitter: 'Twitter',
                      instagram: 'Instagram',
                      youtube: 'YouTube',
                      website: 'Website'
                    }).map(([key, label]) => (
                      <div key={key}>
                        <Label htmlFor={key}>{label}</Label>
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
