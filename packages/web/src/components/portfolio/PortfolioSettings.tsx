"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubdomainSettings } from "@/components/account/SubdomainSettings";
import type { 
  PortfolioSettings as PortfolioSettingsType, 
  PortfolioSocialLinks, 
  PortfolioAnalytics 
} from "@/types/portfolio";

interface PortfolioSettingsProps {
  settings: PortfolioSettingsType;
  socialLinks: PortfolioSocialLinks;
  analytics: PortfolioAnalytics;
  subdomain?: string;
  onSettingsChange: (settings: PortfolioSettingsType) => void;
  onSocialLinksChange: (socialLinks: PortfolioSocialLinks) => void;
  onAnalyticsChange: (analytics: PortfolioAnalytics) => void;
  onSubdomainChange: (subdomain: string) => void;
}

export function PortfolioSettings({
  settings,
  socialLinks,
  analytics,
  subdomain,
  onSettingsChange,
  onSocialLinksChange,
  onAnalyticsChange,
  onSubdomainChange,
}: PortfolioSettingsProps) {
  const [analyticsTab, setAnalyticsTab] = useState("google");

  const updateSettings = (updates: Partial<PortfolioSettingsType>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateSocialLinks = (updates: Partial<PortfolioSocialLinks>) => {
    onSocialLinksChange({ ...socialLinks, ...updates });
  };

  const updateAnalytics = (updates: Partial<PortfolioAnalytics>) => {
    onAnalyticsChange({ ...analytics, ...updates });
  };

  const getSocialPlatformCount = () => {
    return Object.values(socialLinks).filter(link => link && link.trim().length > 0).length;
  };

  const getConnectedPlatforms = () => {
    return Object.entries(socialLinks)
      .filter(([_, link]) => link && link.trim().length > 0)
      .map(([platform]) => platform);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Privacy & Publishing */}
      <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Privacy & Publishing</CardTitle>
          <CardDescription className="text-base">
            Control who can view your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-base font-medium">Public Portfolio</Label>
              <p className="text-sm text-muted-foreground">
                Make your portfolio visible to everyone
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => updateSettings({ isPublic: checked })}
            />
          </div>

          {settings.isPublic && (
            <div className="space-y-4">
              <SubdomainSettings 
                initialSubdomain={subdomain}
                onSubdomainAssigned={onSubdomainChange}
              />
              
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Contact Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow visitors to send you messages
                  </p>
                </div>
                <Switch
                  checked={settings.showContactForm}
                  onCheckedChange={(checked) => updateSettings({ showContactForm: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Allow Downloads</Label>
                  <p className="text-sm text-muted-foreground">
                    Let visitors download your resume or portfolio
                  </p>
                </div>
                <Switch
                  checked={settings.allowDownloads}
                  onCheckedChange={(checked) => updateSettings({ allowDownloads: checked })}
                />
              </div>
            </div>
          )}

          <PasswordProtectionSection 
            settings={settings} 
            updateSettings={updateSettings} 
          />

          {settings.isPublic && subdomain && (
            <PublishedStatus subdomain={subdomain} />
          )}
        </CardContent>
      </Card>

      {/* Social Links & Analytics */}
      <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Social & Analytics</CardTitle>
          <CardDescription className="text-base">
            Connect your social profiles and track performance
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="social" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="social" className="text-sm">Social Links</TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-6">
              <SocialLinksSection 
                socialLinks={socialLinks} 
                updateSocialLinks={updateSocialLinks}
                connectedCount={getSocialPlatformCount()}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsSection 
                analytics={analytics}
                analyticsTab={analyticsTab}
                setAnalyticsTab={setAnalyticsTab}
                updateAnalytics={updateAnalytics}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface PasswordProtectionSectionProps {
  settings: PortfolioSettingsType;
  updateSettings: (updates: Partial<PortfolioSettingsType>) => void;
}

function PasswordProtectionSection({ settings, updateSettings }: PasswordProtectionSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="space-y-1">
          <Label className="text-base font-medium">Password Protection</Label>
          <p className="text-sm text-muted-foreground">
            Require password to view portfolio
          </p>
        </div>
        <Switch
          checked={!!settings.password}
          onCheckedChange={(checked) => updateSettings({
            password: checked ? 'password123' : undefined
          })}
        />
      </div>

      {settings.password && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            value={settings.password}
            onChange={(e) => updateSettings({ password: e.target.value })}
            placeholder="Enter password"
            className="h-11 text-base"
          />
          <Alert>
            <AlertDescription className="text-sm">
              Share this password with people you want to give access to your portfolio.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

interface PublishedStatusProps {
  subdomain: string;
}

function PublishedStatus({ subdomain }: PublishedStatusProps) {
  const portfolioUrl = `https://${subdomain}.hireall.app`;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border bg-green-50 border-green-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-green-800">Portfolio Published</span>
          </div>
          <p className="text-sm text-green-700">
            Your portfolio is live and accessible to visitors.
          </p>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-green-800">Portfolio URL:</Label>
            <div className="flex items-center gap-2">
              <Input
                value={portfolioUrl}
                readOnly
                className="h-9 text-sm bg-white border-green-300"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(portfolioUrl)}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SocialLinksSectionProps {
  socialLinks: PortfolioSocialLinks;
  updateSocialLinks: (updates: Partial<PortfolioSocialLinks>) => void;
  connectedCount: number;
}

function SocialLinksSection({ 
  socialLinks, 
  updateSocialLinks, 
  connectedCount 
}: SocialLinksSectionProps) {
  const platforms = [
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
    { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourname' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/yourname' },
    { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
    { key: 'email', label: 'Email', placeholder: 'your@email.com' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Connected Profiles</Label>
        <Badge variant="outline" className="text-xs">
          {connectedCount}/7 connected
        </Badge>
      </div>

      {platforms.map((platform) => (
        <div key={platform.key} className="space-y-2">
          <Label htmlFor={platform.key} className="text-sm font-medium">
            {platform.label}
          </Label>
          <Input
            id={platform.key}
            value={socialLinks[platform.key as keyof PortfolioSocialLinks] || ''}
            onChange={(e) => updateSocialLinks({ 
              [platform.key]: e.target.value 
            })}
            placeholder={platform.placeholder}
            className="h-10"
          />
        </div>
      ))}

      <Alert>
        <AlertDescription className="text-sm">
          Adding social profiles helps visitors learn more about you and increases your online presence.
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface AnalyticsSectionProps {
  analytics: PortfolioAnalytics;
  analyticsTab: string;
  setAnalyticsTab: (tab: string) => void;
  updateAnalytics: (updates: Partial<PortfolioAnalytics>) => void;
}

function AnalyticsSection({ 
  analytics, 
  analyticsTab, 
  setAnalyticsTab, 
  updateAnalytics 
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="google" className="text-sm">Google Analytics</TabsTrigger>
          <TabsTrigger value="facebook" className="text-sm">Facebook Pixel</TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="googleAnalytics" className="text-sm font-medium">
              Google Analytics Tracking ID
            </Label>
            <Input
              id="googleAnalytics"
              value={analytics.googleAnalytics || ''}
              onChange={(e) => updateAnalytics({ googleAnalytics: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Format: G-XXXXXXXXXX (GA4) or UA-XXXXXXXX-X (Universal Analytics)
            </p>
          </div>
          
          {analytics.googleAnalytics && (
            <Alert>
              <AlertDescription className="text-sm">
                Google Analytics is configured. You'll see visitor data in your GA dashboard within 24-48 hours.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="facebook" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebookPixel" className="text-sm font-medium">
              Facebook Pixel ID
            </Label>
            <Input
              id="facebookPixel"
              value={analytics.facebookPixel || ''}
              onChange={(e) => updateAnalytics({ facebookPixel: e.target.value })}
              placeholder="1234567890123456"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Your Facebook Pixel ID for tracking conversions and building custom audiences.
            </p>
          </div>
          
          {analytics.facebookPixel && (
            <Alert>
              <AlertDescription className="text-sm">
                Facebook Pixel is configured. You can track events and build custom audiences in Facebook Ads Manager.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
        <h4 className="font-medium text-sm">Analytics Benefits</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Track visitor numbers and demographics</li>
          <li>• Monitor which sections get the most attention</li>
          <li>• Measure conversion rates and goals</li>
          <li>• Optimize content based on user behavior</li>
        </ul>
      </div>
    </div>
  );
}
