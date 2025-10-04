"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Palette, BarChart3, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ChecklistItem, PortfolioData } from "@/types/portfolio";

interface PortfolioFormProps {
  portfolio: PortfolioData;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioData>>;
  portfolioProgress: number;
  checklist: ChecklistItem[];
  statusCard: {
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
  };
  portfolioTemplates: Array<{
    id: string;
    name: string;
    description: string;
    popular?: boolean;
  }>;
}

export function PortfolioForm({
  portfolio,
  setPortfolio,
  portfolioProgress,
  checklist,
  statusCard,
  portfolioTemplates
}: PortfolioFormProps) {
  const [activeTab, setActiveTab] = useState("design");

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{statusCard.title}</h2>
            <p className="text-muted-foreground text-lg">{statusCard.description}</p>
          </div>
          <div className={`p-4 rounded-2xl ${statusCard.accent}`}>
            {statusCard.icon}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Portfolio Progress</span>
            <span className="text-sm font-bold">{portfolioProgress}%</span>
          </div>
          <Progress value={portfolioProgress} className="h-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border transition-all duration-200",
                  item.completed
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-muted/30 border-border"
                )}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <CircleDashed className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn("text-sm", item.completed ? "text-green-700 dark:text-green-300" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Portfolio Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Portfolio Information</CardTitle>
              <CardDescription className="text-base">Basic information about your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">Portfolio Title</Label>
                <Input
                  id="title"
                  value={portfolio.title}
                  onChange={(e) => setPortfolio(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="John Doe - Full Stack Developer"
                  className="h-11 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={portfolio.description}
                  onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your professional background and what you do..."
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-base font-medium">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={portfolio.subdomain ? `${portfolio.subdomain}.hireall.app` : 'Not claimed yet'}
                    readOnly
                    className="h-11 text-base"
                  />
                  <p className="text-sm text-muted-foreground">Claim or manage your subdomain in the Settings tab.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain" className="text-base font-medium">Custom Domain (Optional)</Label>
                  <Input
                    id="customDomain"
                    value={portfolio.customDomain || ''}
                    onChange={(e) => setPortfolio(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="portfolio.example.com"
                    className="h-11 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Template Selection */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                Template Selection
              </CardTitle>
              <CardDescription className="text-base">Choose a design template</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {portfolioTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setPortfolio(prev => ({ ...prev, templateId: template.id }))}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                      portfolio.templateId === template.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                  >
                    <div className="font-semibold text-base">{template.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{template.description}</div>
                    {template.popular && (
                      <Badge variant="secondary" className="mt-2 text-xs font-medium">Popular</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
