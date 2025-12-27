"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from "@/components/ui/form";

interface VisaCriteriaSettingsProps {}

export function VisaCriteriaSettings() {
  const { control, setValue, watch } = useFormContext();
  const formData = watch();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card variant="premium" className="border-0 bg-surface">
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
            <FormField
              control={control}
              name="preferences.ukFiltersEnabled"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base font-semibold text-foreground">
                        Enable UK Visa Analysis
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Turn on detailed UK visa eligibility assessment for job listings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            setValue("preferences.showSponsorButton", true, { shouldDirty: true });
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This information helps our extension provide more accurate visa eligibility assessments. Your data is stored securely and used only for visa analysis.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <FormField
                control={control}
                name="preferences.ageCategory"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">Age Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select age category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student (16-17)</SelectItem>
                        <SelectItem value="youngAdult">Young Adult (18-25)</SelectItem>
                        <SelectItem value="adult">Adult (26-45)</SelectItem>
                        <SelectItem value="experienced">Experienced Professional (46+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="preferences.educationStatus"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">Education Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select education status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="master">Master&apos;s Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="preferences.phdStatus"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">PhD Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select PhD status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not Applicable</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="preferences.professionalStatus"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">Professional Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select professional status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not Employed</SelectItem>
                        <SelectItem value="entry-level">Entry Level (0-2 years)</SelectItem>
                        <SelectItem value="junior">Junior (2-5 years)</SelectItem>
                        <SelectItem value="mid-level">Mid-Level (5-10 years)</SelectItem>
                        <SelectItem value="senior">Senior (10+ years)</SelectItem>
                        <SelectItem value="expert">Expert (15+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="preferences.minimumSalary"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Minimum Salary (£/year)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          field.onChange(val);
                        }}
                        placeholder="38700"
                        className="input-premium"
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-muted-foreground">
                      UK skilled worker visa minimum salary requirement
                    </FormDescription>
                  </FormItem>
                )}
              />
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
                    (formData.preferences.minimumSalary || 0) >= 38700 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-muted-foreground">
                    Salary: <span className="font-medium text-foreground">£{(formData.preferences.minimumSalary || 0).toLocaleString()}</span>
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
