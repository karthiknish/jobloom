"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Send, Settings, User, Monitor, Globe, Shield, Smartphone, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface PreferencesSettingsProps {}

export function PreferencesSettings() {
  const { control, setValue, watch } = useFormContext();
  const formData = watch();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <Card variant="premium" className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            General Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience and job searching defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Appearance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="preferences.theme"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                      Visual Theme
                      <HelpTooltip content="Choose between light or dark mode, or follow your system settings." />
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="input-premium bg-background">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Core Feature Defaults */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Search & Automation
            </h3>
            <div className="space-y-3">
              <FormField
                control={control}
                name="preferences.autoDetectJobs"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Auto-Detect Jobs
                        <HelpTooltip content="Automatically identifies job listings on sites like LinkedIn and Indeed to show the 'Import' button." />
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Recognize jobs automatically on job boards
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="preferences.locationPreference"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Primary Location
                        <HelpTooltip content="Sets the default region for sponsorship and salary analysis." />
                      </FormLabel>
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-[180px] input-premium bg-background">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="eu">European Union</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="global">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Advanced Disclosure */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-primary hover:text-primary/80 p-0 h-auto font-semibold"
            >
              {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            </Button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 space-y-6 pt-6 border-t border-border/50"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Extension Controls
                  </h3>
                  <div className="space-y-3">
                    <FormField
                      control={control}
                      name="preferences.showSponsorButton"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                              Sponsor Check Button
                              <HelpTooltip content="Toggles the visibility of the primary action button on job cards." />
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked && formData.preferences.ukFiltersEnabled) {
                                  setValue("preferences.ukFiltersEnabled", false, { shouldDirty: true });
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Job Match Tuning
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="preferences.minimumSalary"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-muted/5">
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                            Min Salary Baseline
                            <HelpTooltip content="Jobs below this value will be flagged." />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="input-premium bg-background"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="preferences.ageCategory"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-muted/5">
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                            Experience Bracket
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="input-premium bg-background">
                                <SelectValue placeholder="Select age category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="graduate">Recent Graduate</SelectItem>
                              <SelectItem value="adult">Adult</SelectItem>
                              <SelectItem value="experienced">Experienced</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
