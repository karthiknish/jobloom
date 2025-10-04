"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PreferencesSettingsProps {
  formData: {
    preferences: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      newsletter: boolean;
      marketingEmails: boolean;
      theme: string;
      ukFiltersEnabled: boolean;
      autoDetectJobs: boolean;
      showSponsorButton: boolean;
      ageCategory: string;
      educationStatus: string;
      phdStatus: string;
      professionalStatus: string;
      minimumSalary: number;
      jobCategories: string[];
      locationPreference: string;
    };
  };
  onInputChange: (section: string, field: string, value: any) => void;
}

export function PreferencesSettings({ formData, onInputChange }: PreferencesSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="card-premium border-0 bg-surface">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-foreground">Preferences</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Customize your notification and feature preferences
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailNotifications" className="text-sm font-medium text-foreground">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your applications
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={formData.preferences.emailNotifications}
                  onCheckedChange={(checked) => onInputChange("preferences", "emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="pushNotifications" className="text-sm font-medium text-foreground">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Browser notifications
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={formData.preferences.pushNotifications}
                  onCheckedChange={(checked) => onInputChange("preferences", "pushNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="newsletter" className="text-sm font-medium text-foreground">
                    Newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly job tips and opportunities
                  </p>
                </div>
                <Switch
                  id="newsletter"
                  checked={formData.preferences.newsletter}
                  onCheckedChange={(checked) => onInputChange("preferences", "newsletter", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketingEmails" className="text-sm font-medium text-foreground">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Special offers and promotions
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={formData.preferences.marketingEmails}
                  onCheckedChange={(checked) => onInputChange("preferences", "marketingEmails", checked)}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium text-foreground">Theme</Label>
                <Select
                  value={formData.preferences.theme}
                  onValueChange={(value) => onInputChange("preferences", "theme", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Extension Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="ukFiltersEnabled" className="text-sm font-medium text-foreground">
                    UK Visa Sponsorship Analysis
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed UK visa sponsorship analysis
                  </p>
                </div>
                <Switch
                  id="ukFiltersEnabled"
                  checked={formData.preferences.ukFiltersEnabled || false}
                  onCheckedChange={(checked) => onInputChange("preferences", "ukFiltersEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoDetectJobs" className="text-sm font-medium text-foreground">
                    Auto-Detect Jobs
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect jobs on job sites
                  </p>
                </div>
                <Switch
                  id="autoDetectJobs"
                  checked={formData.preferences.autoDetectJobs || true}
                  onCheckedChange={(checked) => onInputChange("preferences", "autoDetectJobs", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="showSponsorButton" className="text-sm font-medium text-foreground">
                    Sponsor Button on Job Cards
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show the sponsor check button inside the extension on job listings
                  </p>
                </div>
                <Switch
                  id="showSponsorButton"
                  checked={formData.preferences.showSponsorButton ?? true}
                  onCheckedChange={(checked) => onInputChange("preferences", "showSponsorButton", checked)}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Job Preferences</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Age Category</Label>
                <Select
                  value={formData.preferences.ageCategory || "adult"}
                  onValueChange={(value) => onInputChange("preferences", "ageCategory", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select age category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="graduate">Recent Graduate</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Location Preference</Label>
                <Select
                  value={formData.preferences.locationPreference || "uk"}
                  onValueChange={(value) => onInputChange("preferences", "locationPreference", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Minimum Salary</Label>
                <Input
                  type="number"
                  value={formData.preferences.minimumSalary}
                  onChange={(e) => onInputChange("preferences", "minimumSalary", e.target.value)}
                  placeholder="50000"
                  className="input-premium"
                />
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
