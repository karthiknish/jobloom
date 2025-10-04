"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Save,
  Palette,
  Settings,
  BarChart3,
  Plus,
  Sparkles,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { TemplateSelector } from "@/components/portfolio/TemplateSelector";
import { ThemeCustomizer } from "@/components/portfolio/ThemeCustomizer";
import { SectionsManager } from "@/components/portfolio/SectionsManager";
import { SEOSettings } from "@/components/portfolio/SEOSettings";
import { PortfolioSettings } from "@/components/portfolio/PortfolioSettings";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function PortfolioBuilderPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("design");
  const [previewMode, setPreviewMode] = useState(false);

  const {
    portfolio,
    saving,
    portfolioProgress,
    checklist,
    completionFlags,
    savePortfolio,
    addSection,
    removeSection,
    updateSection,
    updateSectionContent,
    updatePortfolio,
    getAvailableSectionTypes,
  } = usePortfolio();

  const statusCard = useMemo(() => {
    if (completionFlags.hasPublicLink) {
      return {
        title: "Portfolio Published",
        description: "Your site is live. Share the link with recruiters and track performance.",
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        accent: "border-emerald-200/80",
      };
    }

    const completedCount = checklist.filter((item) => item.completed).length;
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
  }, [completionFlags, checklist]);

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

  if (previewMode) {
    return <PortfolioPreview portfolio={portfolio} onExitPreview={() => setPreviewMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {portfolioProgress === 100 ? "🎉 Your portfolio is complete!" : `${checklist.filter(item => item.completed).length} of ${checklist.length} tasks completed`}
                </p>
              </CardContent>
            </Card>

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

            <TabsContent value="design" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TemplateSelector
                  selectedTemplateId={portfolio.templateId}
                  onTemplateChange={(templateId) => updatePortfolio({ templateId })}
                />
                <ThemeCustomizer
                  theme={portfolio.theme}
                  onThemeChange={(theme) => updatePortfolio({ theme })}
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-8">
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Portfolio Information</CardTitle>
                  <CardDescription className="text-base">
                    Essential details that define your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">Portfolio Title</Label>
                    <Input
                      id="title"
                      value={portfolio.title}
                      onChange={(e) => updatePortfolio({ title: e.target.value })}
                      placeholder="My Professional Portfolio"
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={portfolio.description}
                      onChange={(e) => updatePortfolio({ description: e.target.value })}
                      placeholder="A compelling description of your work, expertise, and what makes you unique..."
                      rows={4}
                      className="text-base resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-8">
              <SectionsManager
                sections={portfolio.sections}
                availableSectionTypes={getAvailableSectionTypes()}
                onAddSection={addSection}
                onRemoveSection={removeSection}
                onUpdateSection={updateSection}
                onUpdateSectionContent={updateSectionContent}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-8">
              <SEOSettings
                seo={portfolio.seo}
                onSEOChange={(seo) => updatePortfolio({ seo })}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <PortfolioSettings
                settings={portfolio.settings}
                socialLinks={portfolio.socialLinks}
                analytics={portfolio.analytics}
                subdomain={portfolio.subdomain}
                onSettingsChange={(settings) => updatePortfolio({ settings })}
                onSocialLinksChange={(socialLinks) => updatePortfolio({ socialLinks })}
                onAnalyticsChange={(analytics) => updatePortfolio({ analytics })}
                onSubdomainChange={(subdomain) => updatePortfolio({ subdomain })}
              />
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </div>
  );
}

interface PortfolioPreviewProps {
  portfolio: any;
  onExitPreview: () => void;
}

function PortfolioPreview({ portfolio, onExitPreview }: PortfolioPreviewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Preview Mode
              </div>
              <span className="text-sm text-muted-foreground">
                Template: {portfolio.templateId}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onExitPreview}
            >
              Back to Editor
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {portfolio.sections.find((s: any) => s.type === "hero" && s.visible) && (
            <section className="text-center py-16 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {portfolio.sections.find((s: any) => s.type === "hero")?.content?.headline || "Your Portfolio"}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {portfolio.sections.find((s: any) => s.type === "hero")?.content?.subheadline || "Your professional description"}
              </p>
              <Button size="lg">
                {portfolio.sections.find((s: any) => s.type === "hero")?.content?.ctaText || "Get In Touch"}
              </Button>
            </section>
          )}

          {portfolio.sections.find((s: any) => s.type === "about" && s.visible) && (
            <section className="py-12">
              <h2 className="text-3xl font-bold mb-6">About Me</h2>
              <div className="prose prose-lg max-w-none">
                <p>
                  {portfolio.sections.find((s: any) => s.type === "about")?.content?.content || 
                   "Your about section content will appear here."}
                </p>
              </div>
            </section>
          )}

          {portfolio.sections.find((s: any) => s.type === "contact" && s.visible) && (
            <section className="py-12 bg-muted/30 rounded-2xl">
              <h2 className="text-3xl font-bold mb-6 text-center">Get In Touch</h2>
              <div className="text-center space-y-4">
                <p className="text-lg">
                  {portfolio.sections.find((s: any) => s.type === "contact")?.content?.message || 
                   "Let's work together!"}
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  {portfolio.sections.find((s: any) => s.type === "contact")?.content?.email && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Email:</span>
                      <span>{portfolio.sections.find((s: any) => s.type === "contact")?.content?.email}</span>
                    </div>
                  )}
                  {portfolio.sections.find((s: any) => s.type === "contact")?.content?.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Phone:</span>
                      <span>{portfolio.sections.find((s: any) => s.type === "contact")?.content?.phone}</span>
                    </div>
                  )}
                  {portfolio.sections.find((s: any) => s.type === "contact")?.content?.location && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Location:</span>
                      <span>{portfolio.sections.find((s: any) => s.type === "contact")?.content?.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {portfolio.sections.filter((s: any) => s.visible && !["hero", "about", "contact"].includes(s.type)).length > 0 && (
            <section className="py-12">
              <h2 className="text-3xl font-bold mb-6">More Sections</h2>
              <div className="grid gap-4">
                {portfolio.sections
                  .filter((s: any) => s.visible && !["hero", "about", "contact"].includes(s.type))
                  .map((section: any) => (
                    <Card key={section.id} className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                      <p className="text-muted-foreground">
                        {section.type} section content will appear here.
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
