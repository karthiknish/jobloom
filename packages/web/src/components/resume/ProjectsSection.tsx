"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Plus, Trash2, FolderGit2, Link as LinkIcon, Cpu, Layout, FileText, Github } from "lucide-react";
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

const projectSchema = z.object({
  projects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(10, "Description should be at least 10 characters"),
    technologies: z.string().min(1, "At least one technology is required"),
    link: z.string().optional().or(z.literal("")),
    github: z.string().optional().or(z.literal("")),
  }))
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  github: string;
}

interface ProjectsSectionProps {
  data: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

export function ProjectsSection({ data, onChange }: ProjectsSectionProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projects: data.map(item => ({
        ...item,
        technologies: item.technologies.join(", ")
      })),
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projects",
  });

  const watchProjects = useWatch({
    control: form.control,
    name: "projects",
  });

  useEffect(() => {
    const currentValues = form.getValues("projects");
    const normalizedData = data.map(item => ({
      ...item,
      technologies: Array.isArray(item.technologies) ? item.technologies.join(", ") : item.technologies
    }));

    if (JSON.stringify(normalizedData) !== JSON.stringify(currentValues)) {
      form.reset({ projects: normalizedData });
    }
  }, [data, form]);

  useEffect(() => {
    if (watchProjects) {
      const items = watchProjects.map(item => ({
        ...item,
        technologies: typeof item.technologies === 'string' 
          ? item.technologies.split(",").map(s => s.trim()).filter(Boolean) 
          : item.technologies,
        link: item.link || "",
        github: item.github || ""
      }));
      
      if (JSON.stringify(data) !== JSON.stringify(items)) {
        onChange(items as ProjectItem[]);
      }
    }
  }, [watchProjects, onChange, data]);

  const addProject = () => {
    append({
      id: generateResumeId(),
      name: "",
      description: "",
      technologies: "",
      link: "",
      github: "",
    });
  };

  const getCompleteness = (item: any) => {
    const required = [item.name, item.description, item.technologies];
    const filled = required.filter(f => f && f.trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  };

  return (
    <Form {...form}>
      <Card className="border-muted/40 shadow-sm bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Projects</CardTitle>
            </div>
          </div>
          <Button size="sm" onClick={addProject} variant="outline" className="h-8 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" /> Add Project
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {fields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-xl border-muted-foreground/20">
              <FolderGit2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No projects listed yet</p>
              <Button variant="link" onClick={addProject}>Add your first project</Button>
            </div>
          )}

          {fields.map((field, index) => {
            const completeness = getCompleteness(watchProjects?.[index] || {});
            return (
              <div key={field.id} className="relative group p-6 border rounded-xl bg-background transition-all hover:shadow-md hover:border-primary/20">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-background border rounded-md text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  Project #{index + 1}
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
                  <FormField
                    control={form.control}
                    name={`projects.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                          Project Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Personal Portfolio Website" className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`projects.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Description <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Built a responsive portfolio using Next.js and Tailwind CSS..."
                            className="bg-background resize-none text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`projects.${index}.technologies`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                          Technologies <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="React, Node.js, Firebase (comma separated)" className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`projects.${index}.link`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Live Link
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://myproject.com" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`projects.${index}.github`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Github className="h-3.5 w-3.5 text-muted-foreground" />
                            GitHub
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="github.com/username/project" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
