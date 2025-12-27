"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, Trash2, School, Award, Calendar, BookOpen, GraduationCap as DegreeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateResumeId } from "@/components/application/utils";
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
} from "@/components/ui/form";

const educationSchema = z.object({
  education: z.array(z.object({
    id: z.string(),
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    field: z.string().min(1, "Field of study is required"),
    graduationDate: z.string().min(1, "Graduation date is required"),
    gpa: z.string().optional().or(z.literal("")),
    honors: z.string().optional().or(z.literal("")),
  }))
});

type EducationFormValues = z.infer<typeof educationSchema>;

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  honors?: string;
}

interface EducationSectionProps {
  data: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export function EducationSection({ data, onChange }: EducationSectionProps) {
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      education: data,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const watchEducation = useWatch({
    control: form.control,
    name: "education",
  });

  useEffect(() => {
    const currentValues = form.getValues("education");
    if (JSON.stringify(data) !== JSON.stringify(currentValues)) {
      form.reset({ education: data });
    }
  }, [data, form]);

  useEffect(() => {
    if (watchEducation) {
      const cleanedEducation = watchEducation.map(edu => ({
        ...edu,
        gpa: edu?.gpa || "",
        honors: edu?.honors || "",
        institution: edu?.institution || "",
        degree: edu?.degree || "",
        field: edu?.field || "",
        graduationDate: edu?.graduationDate || ""
      }));

      if (JSON.stringify(data) !== JSON.stringify(cleanedEducation)) {
        onChange(cleanedEducation as EducationItem[]);
      }
    }
  }, [watchEducation, onChange, data]);

  const addEducation = () => {
    append({
      id: generateResumeId(),
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
      honors: "",
    });
  };

  const getCompleteness = (item: any) => {
    const required = [item.institution, item.degree, item.field, item.graduationDate];
    const filled = required.filter(f => f && f.trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  };

  return (
    <Form {...form}>
      <Card className="border-muted/40 shadow-sm bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Education</CardTitle>
            </div>
          </div>
          <Button size="sm" onClick={addEducation} variant="outline" className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Add Education
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {fields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-xl border-muted-foreground/20">
              <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No education entries yet</p>
              <Button variant="link" onClick={addEducation}>Add your first degree</Button>
            </div>
          )}

          {fields.map((field, index) => {
            const completeness = getCompleteness(watchEducation?.[index] || {});
            return (
              <div key={field.id} className="relative group p-6 border rounded-xl bg-background transition-all hover:shadow-md hover:border-primary/20">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-background border rounded-md text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  Education Entry #{index + 1}
                  {completeness > 0 && (
                    <span className={cn(
                      "flex items-center gap-1",
                      completeness === 100 ? "text-green-600" : "text-amber-600"
                    )}>
                      • {completeness}% Complete
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.institution`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <School className="h-3.5 w-3.5 text-muted-foreground" />
                            Institution <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="University of California, Berkeley" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.degree`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DegreeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Degree <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bachelor of Science" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.field`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            Field of Study <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Computer Science" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.graduationDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            Graduation <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="May 2022" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.gpa`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Award className="h-3.5 w-3.5 text-muted-foreground" />
                            GPA (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="3.8/4.0" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`education.${index}.honors`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Honors / Awards / Activities</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder="Dean's List, Cum Laude, President of Computer Science Society..."
                            className="bg-background resize-none text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border shadow-sm text-destructive hover:text-white hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </Form>
  );
}
