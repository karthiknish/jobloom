"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, GraduationCap as _GraduationCap, Briefcase as _Briefcase, Target as _Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VisaCriteriaSettingsProps {
  formData: {
    preferences: {
      ukFiltersEnabled: boolean;
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

export function VisaCriteriaSettings({ formData, onInputChange }: VisaCriteriaSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="card-premium-elevated border-0 bg-surface">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              UK Skilled Worker Visa Criteria
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Configure your eligibility status for enhanced visa analysis
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="ukFiltersEnabledSetting" className="text-base font-semibold text-foreground">
                    Enable UK Visa Analysis
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on detailed UK visa eligibility assessment for job listings
                  </p>
                </div>
                <Switch
                  id="ukFiltersEnabledSetting"
                  checked={formData.preferences.ukFiltersEnabled || false}
                  onCheckedChange={(checked) => {
                    onInputChange("preferences", "ukFiltersEnabled", checked);
                    // Also sync with sponsor button preference
                    if (checked) {
                      onInputChange("preferences", "showSponsorButton", true);
                    }
                  }}
                />
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This information helps our extension provide more accurate visa eligibility assessments. Your data is stored securely and used only for visa analysis.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Age Category</Label>
                <Select
                  value={formData.preferences.ageCategory || "adult"}
                  onValueChange={(value) => onInputChange("preferences", "ageCategory", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select age category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student (16-17)</SelectItem>
                    <SelectItem value="youngAdult">Young Adult (18-25)</SelectItem>
                    <SelectItem value="adult">Adult (26-45)</SelectItem>
                    <SelectItem value="experienced">Experienced Professional (46+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Education Status</Label>
                <Select
                  value={formData.preferences.educationStatus || "none"}
                  onValueChange={(value) => onInputChange("preferences", "educationStatus", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select education status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="master">Master&apos;s Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">PhD Status</Label>
                <Select
                  value={formData.preferences.phdStatus || "none"}
                  onValueChange={(value) => onInputChange("preferences", "phdStatus", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select PhD status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Applicable</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Professional Status</Label>
                <Select
                  value={formData.preferences.professionalStatus || "none"}
                  onValueChange={(value) => onInputChange("preferences", "professionalStatus", value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select professional status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Employed</SelectItem>
                    <SelectItem value="entry-level">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="junior">Junior (2-5 years)</SelectItem>
                    <SelectItem value="mid-level">Mid-Level (5-10 years)</SelectItem>
                    <SelectItem value="senior">Senior (10+ years)</SelectItem>
                    <SelectItem value="expert">Expert (15+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Minimum Salary (£/year)
                </Label>
                <Input
                  type="number"
                  value={formData.preferences.minimumSalary}
                  onChange={(e) => onInputChange("preferences", "minimumSalary", e.target.value)}
                  placeholder="38700"
                  className="input-premium"
                />
                <p className="text-sm text-muted-foreground">
                  UK skilled worker visa minimum salary requirement
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Eligibility Summary</h3>
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">
                    Age Category: <span className="font-medium text-foreground capitalize">{formData.preferences.ageCategory || 'Not Set'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    formData.preferences.educationStatus !== 'none' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-muted-foreground">
                    Education: <span className="font-medium text-foreground capitalize">{formData.preferences.educationStatus || 'Not Set'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    formData.preferences.minimumSalary >= 38700 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-muted-foreground">
                    Salary: <span className="font-medium text-foreground">£{formData.preferences.minimumSalary.toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
