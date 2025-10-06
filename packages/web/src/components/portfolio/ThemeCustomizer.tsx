"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import type { PortfolioTheme } from "@/types/portfolio";

interface ThemeCustomizerProps {
  theme: PortfolioTheme;
  onThemeChange: (theme: PortfolioTheme) => void;
}

export function ThemeCustomizer({ theme, onThemeChange }: ThemeCustomizerProps) {
  const updateTheme = (updates: Partial<PortfolioTheme>) => {
    onThemeChange({ ...theme, ...updates });
  };

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          Theme Customization
        </CardTitle>
        <CardDescription className="text-base">
          Personalize colors, fonts, and visual styling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-0">
        <ColorSchemeSection theme={theme} updateTheme={updateTheme} />
        <TypographySection theme={theme} updateTheme={updateTheme} />
        <LayoutSection theme={theme} updateTheme={updateTheme} />
      </CardContent>
    </Card>
  );
}

interface ColorSchemeSectionProps {
  theme: PortfolioTheme;
  updateTheme: (updates: Partial<PortfolioTheme>) => void;
}

function ColorSchemeSection({ theme, updateTheme }: ColorSchemeSectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Color Scheme</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="primaryColor"
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="h-12 w-20 rounded-lg border-2"
            />
            <span className="text-sm text-muted-foreground font-mono">{theme.primaryColor}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryColor" className="text-sm font-medium">Secondary Color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="secondaryColor"
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
              className="h-12 w-20 rounded-lg border-2"
            />
            <span className="text-sm text-muted-foreground font-mono">{theme.secondaryColor}</span>
          </div>
        </div>
      </div>
      
      <ColorPresets updateTheme={updateTheme} />
    </div>
  );
}

function ColorPresets({ updateTheme }: { updateTheme: (updates: Partial<PortfolioTheme>) => void }) {
  const presets = [
    {
      name: "Ocean Blue",
      primary: "#0ea5e9",
      secondary: "#0284c7",
    },
    {
      name: "Forest Green",
      primary: "#10b981",
      secondary: "#059669",
    },
    {
      name: "Royal Purple",
      primary: "#8b5cf6",
      secondary: "#7c3aed",
    },
    {
      name: "Sunset Orange",
      primary: "#f97316",
      secondary: "#ea580c",
    },
    {
      name: "Ruby Red",
      primary: "#ef4444",
      secondary: "#dc2626",
    },
    {
      name: "Slate Gray",
      primary: "#64748b",
      secondary: "#475569",
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Color Presets</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => updateTheme({ 
              primaryColor: preset.primary, 
              secondaryColor: preset.secondary 
            })}
            className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex gap-1">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: preset.primary }}
              />
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: preset.secondary }}
              />
            </div>
            <span className="text-xs">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface TypographySectionProps {
  theme: PortfolioTheme;
  updateTheme: (updates: Partial<PortfolioTheme>) => void;
}

function TypographySection({ theme, updateTheme }: TypographySectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Typography</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Family</Label>
          <Select
            value={theme.fontFamily}
            onValueChange={(value) => updateTheme({ fontFamily: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter (Modern)</SelectItem>
              <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
              <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
              <SelectItem value="Open Sans">Open Sans (Friendly)</SelectItem>
              <SelectItem value="Lato">Lato (Professional)</SelectItem>
              <SelectItem value="Montserrat">Montserrat (Bold)</SelectItem>
              <SelectItem value="Poppins">Poppins (Playful)</SelectItem>
              <SelectItem value="Raleway">Raleway (Sophisticated)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Size</Label>
          <Select
            value={theme.fontSize}
            onValueChange={(value: PortfolioTheme['fontSize']) => updateTheme({ fontSize: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (Compact)</SelectItem>
              <SelectItem value="medium">Medium (Default)</SelectItem>
              <SelectItem value="large">Large (Readable)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

interface LayoutSectionProps {
  theme: PortfolioTheme;
  updateTheme: (updates: Partial<PortfolioTheme>) => void;
}

function LayoutSection({ theme, updateTheme }: LayoutSectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Layout & Spacing</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Spacing</Label>
          <Select
            value={theme.spacing}
            onValueChange={(value: PortfolioTheme['spacing']) => updateTheme({ spacing: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Border Radius</Label>
          <Select
            value={theme.borderRadius}
            onValueChange={(value: PortfolioTheme['borderRadius']) => updateTheme({ borderRadius: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Sharp)</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <LayoutPreview theme={theme} />
    </div>
  );
}

function LayoutPreview({ theme }: { theme: PortfolioTheme }) {
  const getSpacingValue = () => {
    switch (theme.spacing) {
      case 'compact': return 'p-2';
      case 'normal': return 'p-4';
      case 'spacious': return 'p-6';
      default: return 'p-4';
    }
  };

  const getBorderRadiusValue = () => {
    switch (theme.borderRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded-sm';
      case 'medium': return 'rounded-lg';
      case 'large': return 'rounded-xl';
      default: return 'rounded-lg';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Preview</Label>
      <div className={`border-2 ${getSpacingValue()} ${getBorderRadiusValue()}`} 
           style={{ 
             borderColor: theme.primaryColor,
             backgroundColor: `${theme.primaryColor}10`
           }}>
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded" 
               style={{ backgroundColor: theme.primaryColor }} />
          <div className="h-3 w-1/2 rounded" 
               style={{ backgroundColor: theme.secondaryColor }} />
          <div className="h-3 w-2/3 rounded" 
               style={{ backgroundColor: theme.secondaryColor, opacity: 0.7 }} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        This is how your spacing and border radius settings will look.
      </p>
    </div>
  );
}

// Settings icon component to avoid SSR issues
function SettingsIcon({ className }: { className?: string }) {
  return <Settings className={className} />;
}
