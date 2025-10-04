"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PortfolioSEO } from "@/types/portfolio";

interface SEOSettingsProps {
  seo: PortfolioSEO;
  onSEOChange: (seo: PortfolioSEO) => void;
}

export function SEOSettings({ seo, onSEOChange }: SEOSettingsProps) {
  const [metaTitleLength, setMetaTitleLength] = useState(seo.metaTitle.length);
  const [metaDescriptionLength, setMetaDescriptionLength] = useState(seo.metaDescription.length);

  const updateSEO = (updates: Partial<PortfolioSEO>) => {
    onSEOChange({ ...seo, ...updates });
  };

  useEffect(() => {
    setMetaTitleLength(seo.metaTitle.length);
  }, [seo.metaTitle]);

  useEffect(() => {
    setMetaDescriptionLength(seo.metaDescription.length);
  }, [seo.metaDescription]);

  const getTitleColor = () => {
    if (metaTitleLength === 0) return "text-muted-foreground";
    if (metaTitleLength <= 60) return "text-green-600";
    return "text-amber-600";
  };

  const getDescriptionColor = () => {
    if (metaDescriptionLength === 0) return "text-muted-foreground";
    if (metaDescriptionLength <= 160) return "text-green-600";
    return "text-amber-600";
  };

  const getKeywordsCount = () => {
    return seo.keywords.filter(keyword => keyword.trim().length > 0).length;
  };

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GlobeIcon className="h-6 w-6 text-primary" />
          </div>
          Search Engine Optimization
        </CardTitle>
        <CardDescription className="text-base">
          Optimize your portfolio for better search visibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-base font-medium">
                Meta Title
              </Label>
              <Input
                id="metaTitle"
                value={seo.metaTitle}
                onChange={(e) => updateSEO({ metaTitle: e.target.value })}
                placeholder="Your Name - Professional Portfolio"
                className="h-11 text-base"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Appears in search results and browser tabs
                </p>
                <span className={`text-sm font-medium ${getTitleColor()}`}>
                  {metaTitleLength}/60
                </span>
              </div>
              {metaTitleLength > 60 && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Title is longer than recommended 60 characters. Consider shortening it for better SEO.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-base font-medium">
                Meta Description
              </Label>
              <Textarea
                id="metaDescription"
                value={seo.metaDescription}
                onChange={(e) => updateSEO({ metaDescription: e.target.value })}
                placeholder="Professional portfolio showcasing my work, skills, and experience in web development and design."
                rows={4}
                className="text-base resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Summary shown in search results
                </p>
                <span className={`text-sm font-medium ${getDescriptionColor()}`}>
                  {metaDescriptionLength}/160
                </span>
              </div>
              {metaDescriptionLength > 160 && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Description is longer than recommended 160 characters. Consider shortening it for better SEO.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage" className="text-base font-medium">
                Open Graph Image URL
              </Label>
              <Input
                id="ogImage"
                value={seo.ogImage || ''}
                onChange={(e) => updateSEO({ ogImage: e.target.value })}
                placeholder="https://example.com/og-image.jpg"
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Image shown when sharing on social media (1200x630px recommended)
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-base font-medium">
                Keywords
              </Label>
              <Input
                id="keywords"
                value={seo.keywords.join(', ')}
                onChange={(e) => updateSEO({
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                })}
                placeholder="web developer, react, javascript, portfolio, UI/UX"
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Separate keywords with commas. Focus on your core skills and expertise.
              </p>
              <div className="flex items-center justify-between">
                <span></span>
                <Badge variant="outline" className="text-xs">
                  {getKeywordsCount()} keywords
                </Badge>
              </div>
            </div>

            <KeywordsDisplay 
              keywords={seo.keywords} 
              onRemoveKeyword={(index) => {
                const newKeywords = seo.keywords.filter((_, i) => i !== index);
                updateSEO({ keywords: newKeywords });
              }}
            />

            <SEOPreview seo={seo} />
          </div>
        </div>

        <SEOGuidelines />
      </CardContent>
    </Card>
  );
}

interface KeywordsDisplayProps {
  keywords: string[];
  onRemoveKeyword: (index: number) => void;
}

function KeywordsDisplay({ keywords, onRemoveKeyword }: KeywordsDisplayProps) {
  if (keywords.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Active Keywords</Label>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-3 py-1 text-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={() => onRemoveKeyword(index)}
          >
            {keyword}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface SEOPreviewProps {
  seo: PortfolioSEO;
}

function SEOPreview({ seo }: SEOPreviewProps) {
  const displayTitle = seo.metaTitle || "Your Portfolio Title";
  const displayDescription = seo.metaDescription || "Your portfolio description will appear here in search results.";
  const displayUrl = "yourname.hireall.app";

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Search Result Preview</Label>
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="space-y-2">
          <div className="text-blue-800 text-lg font-medium hover:underline cursor-pointer">
            {displayTitle}
          </div>
          <div className="text-green-700 text-sm">
            {displayUrl}
          </div>
          <div className="text-gray-600 text-sm">
            {displayDescription}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        This is how your portfolio might appear in Google search results.
      </p>
    </div>
  );
}

function SEOGuidelines() {
  const guidelines = [
    {
      title: "Title Best Practices",
      tips: [
        "Keep under 60 characters",
        "Include your name and profession",
        "Use unique, descriptive titles",
        "Include relevant keywords naturally"
      ]
    },
    {
      title: "Description Tips",
      tips: [
        "Keep between 150-160 characters",
        "Write compelling descriptions that encourage clicks",
        "Include your main value proposition",
        "Use action-oriented language"
      ]
    },
    {
      title: "Keyword Strategy",
      tips: [
        "Focus on 5-10 relevant keywords",
        "Include location-specific terms if applicable",
        "Use terms your target audience would search for",
        "Avoid keyword stuffing"
      ]
    }
  ];

  return (
    <div className="space-y-4 pt-4 border-t">
      <Label className="text-base font-medium">SEO Guidelines</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guidelines.map((guideline, index) => (
          <div key={index} className="space-y-2">
            <h4 className="font-medium text-sm">{guideline.title}</h4>
            <ul className="space-y-1">
              {guideline.tips.map((tip, tipIndex) => (
                <li key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Globe icon component to avoid SSR issues
function GlobeIcon({ className }: { className?: string }) {
  const { Globe } = require('lucide-react');
  return <Globe className={className} />;
}
