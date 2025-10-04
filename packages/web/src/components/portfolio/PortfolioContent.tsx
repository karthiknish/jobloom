"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PortfolioData } from "@/types/portfolio";

interface PortfolioContentProps {
  portfolio: PortfolioData;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioData>>;
}

export function PortfolioContent({ portfolio, setPortfolio }: PortfolioContentProps) {
  return (
    <Tabs defaultValue="design" className="space-y-8">
      <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:flex">
        <TabsTrigger value="design" className="text-sm">Design</TabsTrigger>
        <TabsTrigger value="content" className="text-sm">Content</TabsTrigger>
        <TabsTrigger value="sections" className="text-sm">Sections</TabsTrigger>
        <TabsTrigger value="seo" className="text-sm">SEO</TabsTrigger>
        <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
      </TabsList>

      {/* Design Tab */}
      <TabsContent value="design" className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Content */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Hero Section Content</CardTitle>
              <CardDescription className="text-base">Customize your main banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="headline" className="text-base font-medium">Headline</Label>
                <Input
                  id="headline"
                  value={portfolio.sections.find(s => s.type === 'hero')?.content?.headline || ''}
                  onChange={(e) => {
                    const heroSection = portfolio.sections.find(s => s.type === 'hero');
                    if (heroSection) {
                      const updatedSections = portfolio.sections.map(s =>
                        s.type === 'hero'
                          ? { ...s, content: { ...s.content, headline: e.target.value } }
                          : s
                      );
                      setPortfolio(prev => ({ ...prev, sections: updatedSections }));
                    }
                  }}
                  placeholder="Welcome to my portfolio"
                  className="h-11 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subheadline" className="text-base font-medium">Subheadline</Label>
                <Textarea
                  id="subheadline"
                  value={portfolio.sections.find(s => s.type === 'hero')?.content?.subheadline || ''}
                  onChange={(e) => {
                    const heroSection = portfolio.sections.find(s => s.type === 'hero');
                    if (heroSection) {
                      const updatedSections = portfolio.sections.map(s =>
                        s.type === 'hero'
                          ? { ...s, content: { ...s.content, subheadline: e.target.value } }
                          : s
                      );
                      setPortfolio(prev => ({ ...prev, sections: updatedSections }));
                    }
                  }}
                  placeholder="I'm a creative professional ready to bring your ideas to life"
                  rows={2}
                  className="text-base resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Content Tab */}
      <TabsContent value="content" className="space-y-8">
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Content Management</CardTitle>
            <CardDescription className="text-base">Manage your portfolio content</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground">Content management features will be added here.</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sections Tab */}
      <TabsContent value="sections" className="space-y-8">
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Section Management</CardTitle>
            <CardDescription className="text-base">Manage your portfolio sections</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground">Section management features will be added here.</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SEO Tab */}
      <TabsContent value="seo" className="space-y-8">
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">SEO Settings</CardTitle>
            <CardDescription className="text-base">Optimize your portfolio for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-base font-medium">Meta Title</Label>
              <Input
                id="metaTitle"
                value={portfolio.seo.metaTitle}
                onChange={(e) => setPortfolio(prev => ({
                  ...prev,
                  seo: { ...prev.seo, metaTitle: e.target.value }
                }))}
                placeholder="John Doe - Full Stack Developer Portfolio"
                className="h-11 text-base"
              />
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
                placeholder="A brief description for search engines"
                rows={3}
                className="text-base resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-8">
        <div className="space-y-6">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Portfolio Settings</CardTitle>
              <CardDescription className="text-base">Configure your portfolio settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-base font-medium">Contact Email</Label>
                <Input
                  id="contactEmail"
                  value={portfolio.socialLinks.email || ''}
                  onChange={(e) => setPortfolio(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, email: e.target.value }
                  }))}
                  placeholder="your@email.com"
                  className="h-11 text-base"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
