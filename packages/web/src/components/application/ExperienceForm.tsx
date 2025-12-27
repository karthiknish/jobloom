"use client";

import React from "react";
import { Plus, Trash2, Briefcase, Building2, MapPin, Calendar, Award, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ResumeData } from "./types";
import { generateResumeId } from "./utils";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const experienceSchema = z.object({
  experience: z.array(z.object({
    id: z.string(),
    company: z.string().min(1, "Company is required"),
    position: z.string().min(1, "Position is required"),
    location: z.string(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string(),
    current: z.boolean(),
    description: z.string().min(1, "Description is required"),
    achievements: z.array(z.string()).min(1, "At least one achievement is required"),
  }))
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  data: ResumeData['experience'];
  onChange: (data: ResumeData['experience']) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      experience: data,
    },
    mode: "onChange",
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const watchFieldArray = useWatch({
    control: form.control,
    name: "experience",
  });

  React.useEffect(() => {
    const currentValues = form.getValues("experience");
    if (JSON.stringify(data) !== JSON.stringify(currentValues)) {
      form.reset({ experience: data });
    }
  }, [data, form]);

  React.useEffect(() => {
    if (watchFieldArray) {
      // Ensure we don't have undefined values that cause stringify mismatch
      const cleanedValues = watchFieldArray.map(exp => ({
        ...exp,
        location: exp.location || "",
        endDate: exp.endDate || "",
        description: exp.description || "",
        achievements: exp.achievements || []
      }));

      if (JSON.stringify(data) !== JSON.stringify(cleanedValues)) {
        onChange(cleanedValues as ResumeData['experience']);
      }
    }
  }, [watchFieldArray, onChange, data]);

  const addExperience = () => {
    append({
      id: generateResumeId(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [""]
    });
  };

  const removeExperience = (index: number) => {
    remove(index);
  };

  const addAchievement = (expIndex: number) => {
    const experienceItem = fields[expIndex];
    // This is a bit tricky since achievements is a sub-array not managed by useFieldArray directly here
    // But we can update the whole object
    const currentAchievements = form.getValues(`experience.${expIndex}.achievements`);
    form.setValue(`experience.${expIndex}.achievements`, [...currentAchievements, ""], { shouldDirty: true });
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const currentAchievements = form.getValues(`experience.${expIndex}.achievements`);
    const updated = [...currentAchievements];
    updated[achIndex] = value;
    form.setValue(`experience.${expIndex}.achievements`, updated, { shouldDirty: true });
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const currentAchievements = form.getValues(`experience.${expIndex}.achievements`);
    const updated = currentAchievements.filter((_, i) => i !== achIndex);
    form.setValue(`experience.${expIndex}.achievements`, updated, { shouldDirty: true });
  };

  // Calculate experience completeness
  const getExperienceCompleteness = (exp: any) => {
    const fields = [exp.position, exp.company, exp.startDate, exp.description];
    const filledFields = fields.filter((f: any) => f && f.trim().length > 0).length;
    const hasAchievements = exp.achievements.some((a: any) => a.trim().length > 0);
    return Math.round(((filledFields / fields.length) * 80) + (hasAchievements ? 20 : 0));
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
      {/* Header with tips */}
      {data.length === 0 && (
        <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Add Your Work Experience</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start with your most recent position. Include key achievements with measurable results to stand out.
          </p>
          <Button onClick={addExperience} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Experience
          </Button>
        </div>
      )}

      {fields.map((exp, index) => {
        const completeness = getExperienceCompleteness(exp);
        return (
          <div
            key={exp.id}
            className={cn(
              "relative border rounded-xl overflow-hidden motion-surface",
              "hover:shadow-md hover:border-primary/20",
              exp.current && "ring-2 ring-ring border-primary/30"
            )}
          >
            {/* Card Header Logic with completeness display */}
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {exp.position || "New Position"}
                      {exp.current && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {exp.company || "Company Name"} {exp.location && `• ${exp.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <span className={cn(
                      "text-xs font-medium",
                      completeness >= 80 ? "text-green-600" : completeness >= 50 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {completeness}% complete
                    </span>
                    <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          completeness >= 80 ? "bg-green-500" : completeness >= 50 ? "bg-amber-500" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Card Content with FormFields */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`experience.${index}.position`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        Position <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Software Engineer"
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experience.${index}.company`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Company <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Tech Company Inc."
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`experience.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="San Francisco, CA"
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experience.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Start Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Jan 2020"
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experience.${index}.endDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        End Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={exp.current ? "Present" : "Dec 2022"}
                          disabled={exp.current}
                          className={cn("bg-background", exp.current && "opacity-50")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`experience.${index}.current`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="flex items-center gap-2 cursor-pointer pb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      I currently work here
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`experience.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your role, responsibilities, and the impact you made..."
                        rows={3}
                        className="bg-background resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    Key Achievements
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAchievement(index)}
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Achievement
                  </Button>
                </div>

                <div className="space-y-2">
                  {exp.achievements.map((achievement: string, achIndex: number) => (
                    <div key={achIndex} className="flex gap-2 items-start">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5">
                        <span className="text-xs font-medium text-amber-700">
                          {achIndex + 1}
                        </span>
                      </div>
                      <Input
                        value={achievement}
                        onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                        placeholder="Increased team productivity by 30% by implementing..."
                        className="flex-1 bg-background"
                      />
                      {exp.achievements.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAchievement(index, achIndex)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <strong>Pro tip:</strong> Use the STAR method (Situation, Task, Action, Result) and include specific numbers. Example: &ldquo;Reduced page load time by 40%, improving user retention by 15%&rdquo;
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {data.length > 0 && (
        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Experience
        </Button>
      )}

      {fields.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          List experiences in reverse chronological order (most recent first)
        </p>
      )}
    </div>
    </Form>
  );
}