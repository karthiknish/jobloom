"use client";

import type { ReactElement } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Code2, Palette, Briefcase, Rocket, Camera, Users, GraduationCap } from "lucide-react";
import { portfolioTemplates } from "@/config/portfolioTemplates";
import type { PortfolioTemplateMeta } from "@/config/portfolioTemplates";

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplateId, onTemplateChange }: TemplateSelectorProps) {
  const getIconComponent = (iconName: string): ReactElement => {
    // Dynamic import to avoid SSR issues
    const icons = {
      Sparkles,
      Code2,
      Palette,
      Briefcase,
      Rocket,
      Camera,
      Users,
      GraduationCap,
    };
    const Icon = icons[iconName as keyof typeof icons] || Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (category: PortfolioTemplateMeta['category']) => {
    const colors = {
      minimal: 'bg-blue-100 text-blue-800',
      creative: 'bg-purple-100 text-purple-800',
      professional: 'bg-green-100 text-green-800',
      modern: 'bg-orange-100 text-orange-800',
      bold: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getIconComponent("Palette")}
          </div>
          Template Selection
        </CardTitle>
        <CardDescription className="text-base">
          Choose a design template that matches your professional brand
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portfolioTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onTemplateChange(template.id)}
              getCategoryColor={getCategoryColor}
              getIconComponent={getIconComponent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TemplateCardProps {
  template: PortfolioTemplateMeta;
  isSelected: boolean;
  onSelect: () => void;
  getCategoryColor: (category: PortfolioTemplateMeta['category']) => string;
  getIconComponent: (iconName: string) => ReactElement;
}

function TemplateCard({ 
  template, 
  isSelected, 
  onSelect, 
  getCategoryColor, 
  getIconComponent 
}: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg"
          : "border-border hover:border-primary/50 bg-card"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            {getIconComponent(template.icon)}
          </div>
          <div className="flex flex-col gap-2">
            <Badge 
              variant="secondary" 
              className={cn("text-xs font-medium", getCategoryColor(template.category))}
            >
              {template.category}
            </Badge>
            {template.popular && (
              <Badge variant="default" className="text-xs font-medium">
                Popular
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="font-semibold text-base">{template.name}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {template.description}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Features:</div>
          <div className="flex flex-wrap gap-1">
            {template.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground"
              >
                {feature}
              </span>
            ))}
            {template.features.length > 3 && (
              <span className="inline-block px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                +{template.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Layout:</div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Hero: {template.layouts.hero}</span>
            <span>Sections: {template.layouts.sections}</span>
            <span>Footer: {template.layouts.footer}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
