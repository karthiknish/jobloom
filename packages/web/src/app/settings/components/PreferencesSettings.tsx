"use client";

import { Bell, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Save } from "lucide-react";

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlertsEnabled: boolean;
  jobKeywords: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  salaryRange: {
    min?: number;
    max?: number;
  };
}

interface PreferencesSettingsProps {
  preferences: UserPreferences;
  saving: boolean;
  updatePreference: (key: keyof UserPreferences, value: any) => void;
  savePreferences: () => void;
}

export function PreferencesSettings({
  preferences,
  saving,
  updatePreference,
  savePreferences
}: PreferencesSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications and updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Browser push notifications
                </p>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Job Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new job opportunities
                </p>
              </div>
              <Switch
                checked={preferences.jobAlertsEnabled}
                onCheckedChange={(checked) => updatePreference('jobAlertsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Preferences */}
        <FeatureGate
          feature="customAlerts"
          showUpgradePrompt={false}
          fallback={
            <Card className="h-full border-dashed border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  Personalised job alerts
                </CardTitle>
                <CardDescription>Upgrade to set job keywords, preferred companies, and salary bands for tailored alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                >
                  <a href={`/upgrade?feature=customAlerts`}>Upgrade to unlock</a>
                </Button>
              </CardContent>
            </Card>
          }
        >
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                Set your job search preferences to receive personalized recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Job Keywords</Label>
                    <Textarea
                      placeholder="e.g., React, Node.js, Senior, Frontend"
                      value={preferences.jobKeywords.join(', ')}
                      onChange={(e) => updatePreference('jobKeywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter keywords separated by commas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Companies</Label>
                    <Textarea
                      placeholder="e.g., Google, Microsoft, Apple"
                      value={preferences.preferredCompanies.join(', ')}
                      onChange={(e) => updatePreference('preferredCompanies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Locations</Label>
                    <Textarea
                      placeholder="e.g., San Francisco, Remote, New York"
                      value={preferences.preferredLocations.join(', ')}
                      onChange={(e) => updatePreference('preferredLocations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Min Salary ($)</Label>
                      <Input
                        type="number"
                        placeholder="80000"
                        value={preferences.salaryRange.min || ''}
                        onChange={(e) => updatePreference('salaryRange', {
                          ...preferences.salaryRange,
                          min: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Salary ($)</Label>
                      <Input
                        type="number"
                        placeholder="150000"
                        value={preferences.salaryRange.max || ''}
                        onChange={(e) => updatePreference('salaryRange', {
                          ...preferences.salaryRange,
                          max: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>

      {/* Save Preferences */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}