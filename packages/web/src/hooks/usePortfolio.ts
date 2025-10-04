"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import type { 
  PortfolioData, 
  PortfolioSection, 
  ChecklistItem,
  SectionType 
} from "@/types/portfolio";
import { showSuccess, showError } from "@/components/ui/Toast";

// Available section types with imports deferred to avoid SSR issues
const getSectionTypes = (): SectionType[] => {
  // Dynamic imports to avoid SSR issues with lucide-react
  const icons = {
    Eye: require('lucide-react').Eye,
    Users: require('lucide-react').Users,
    Briefcase: require('lucide-react').Briefcase,
    Code2: require('lucide-react').Code2,
    GraduationCap: require('lucide-react').GraduationCap,
    BarChart3: require('lucide-react').BarChart3,
    MessageSquare: require('lucide-react').MessageSquare,
    Layout: require('lucide-react').Layout,
    FileText: require('lucide-react').FileText,
    Camera: require('lucide-react').Camera,
  };

  return [
    { id: 'hero', type: 'hero' as const, name: 'Hero Section', icon: icons.Eye, description: 'Main banner with headline and CTA' },
    { id: 'about', type: 'about' as const, name: 'About Me', icon: icons.Users, description: 'Personal introduction and background' },
    { id: 'experience', type: 'experience' as const, name: 'Experience', icon: icons.Briefcase, description: 'Work history and achievements' },
    { id: 'projects', type: 'projects' as const, name: 'Projects', icon: icons.Code2, description: 'Portfolio of work and case studies' },
    { id: 'education', type: 'education' as const, name: 'Education', icon: icons.GraduationCap, description: 'Academic background' },
    { id: 'skills', type: 'skills' as const, name: 'Skills', icon: icons.BarChart3, description: 'Technical and soft skills' },
    { id: 'testimonials', type: 'testimonials' as const, name: 'Testimonials', icon: icons.MessageSquare, description: 'Client reviews and feedback' },
    { id: 'contact', type: 'contact' as const, name: 'Contact', icon: icons.MessageSquare, description: 'Contact information and form' },
    { id: 'blog', type: 'blog' as const, name: 'Blog', icon: icons.FileText, description: 'Articles and insights' },
    { id: 'gallery', type: 'gallery' as const, name: 'Gallery', icon: icons.Camera, description: 'Photo and media gallery' },
    { id: 'custom', type: 'custom' as const, name: 'Custom Section', icon: icons.Layout, description: 'Fully customizable content' }
  ];
};

export const usePortfolio = () => {
  const { user } = useFirebaseAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData>(() => ({
    templateId: "minimalist",
    title: "",
    description: "",
    subdomain: undefined,
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
        content: {
          headline: "Welcome to my portfolio",
          subheadline: "I'm a creative professional ready to bring your ideas to life",
          backgroundImage: "",
          ctaText: "Get In Touch",
          ctaLink: "#contact"
        },
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
  }));

  const [saving, setSaving] = useState(false);
  const [portfolioProgress, setPortfolioProgress] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Calculate completion flags
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

  // Update checklist and progress
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

  // Save portfolio data
  const savePortfolio = useCallback(async () => {
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
  }, [user, portfolio]);

  // Add new section
  const addSection = useCallback((type: PortfolioSection['type']) => {
    const sectionDefaults = require('@/types/portfolio').sectionDefaults;
    const sectionTypes = getSectionTypes();
    
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
  }, [portfolio.sections.length]);

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  }, []);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<PortfolioSection>) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }));
  }, []);

  // Update section content
  const updateSectionContent = useCallback((sectionId: string, content: any) => {
    setPortfolio(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      )
    }));
  }, []);

  // Update portfolio data
  const updatePortfolio = useCallback((updates: Partial<PortfolioData>) => {
    setPortfolio(prev => ({ ...prev, ...updates }));
  }, []);

  // Get section types
  const getAvailableSectionTypes = useCallback(() => {
    return getSectionTypes();
  }, []);

  // Initialize portfolio on mount
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    // State
    portfolio,
    saving,
    portfolioProgress,
    checklist,
    completionFlags,
    
    // Actions
    fetchPortfolio,
    savePortfolio,
    addSection,
    removeSection,
    updateSection,
    updateSectionContent,
    updatePortfolio,
    getAvailableSectionTypes,
  };
};
