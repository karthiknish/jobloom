"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  Briefcase,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sparkles,
    items: [
      {
        question: "How do I add my first job application?",
        answer: "Click the 'Add Job' button in your dashboard, fill in the job details like company name, position, and job URL, then click save. You can also import jobs from URLs or use our browser extension for one-click importing.",
      },
      {
        question: "What is the Kanban board?",
        answer: "The Kanban board is a visual way to track your job applications. Drag and drop applications between columns like 'Interested', 'Applied', 'Interview', and 'Offered' to update their status.",
      },
      {
        question: "How do I track my application status?",
        answer: "Each application card shows its current status. Click on any card to update its status, add notes, set follow-up reminders, or view the full job details.",
      },
    ],
  },
  {
    id: "cv-tools",
    title: "CV & Resume Tools",
    icon: FileText,
    items: [
      {
        question: "How does CV analysis work?",
        answer: "Upload your CV and our AI analyzes it for ATS compatibility, keyword optimization, and overall effectiveness. You'll get a score and specific suggestions for improvement.",
      },
      {
        question: "Can I generate tailored resumes?",
        answer: "Yes! Use the AI Resume Generator to create customized resumes for specific job applications. Just paste the job description and our AI will optimize your resume accordingly.",
      },
      {
        question: "What file formats are supported?",
        answer: "We support PDF, DOCX, and DOC files for CV analysis. For best results, we recommend using PDF format.",
      },
    ],
  },
  {
    id: "job-search",
    title: "Job Search",
    icon: Briefcase,
    items: [
      {
        question: "How do I import jobs from job boards?",
        answer: "Use our browser extension to import jobs with one click, or paste the job URL into the 'Import from URL' field. We support major job boards like LinkedIn, Indeed, and Glassdoor.",
      },
      {
        question: "Can I track visa sponsorship?",
        answer: "Yes! We automatically check if companies have a history of sponsoring work visas. Look for the visa sponsorship indicator on job cards.",
      },
      {
        question: "How do I set follow-up reminders?",
        answer: "Open any application, click on 'Set Follow-up', and choose a date. You'll receive a reminder notification when it's time to follow up.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    icon: BarChart3,
    items: [
      {
        question: "What metrics can I track?",
        answer: "Track your application count, response rate, interview rate, and offer rate. View trends over time and compare your performance week-over-week.",
      },
      {
        question: "What is the Weekly Summary?",
        answer: "The Weekly Summary shows your job search activity for the past week, including applications submitted, responses received, and top companies you applied to.",
      },
      {
        question: "How is my CV score calculated?",
        answer: "Your CV score is based on ATS compatibility, keyword relevance, formatting, and content quality. Higher scores indicate better chances of passing automated screening systems.",
      },
    ],
  },
];

const HELP_TABS = [
  { id: "faq", label: "FAQs" },
  { id: "guides", label: "Quick Guides" },
  { id: "contact", label: "Contact" },
];

const QUICK_LINKS = [
  { label: "Documentation", url: "/docs", icon: Book },
  { label: "Contact Support", url: "/support", icon: Mail },
  { label: "Feature Requests", url: "/feedback", icon: MessageCircle },
];

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");

  const filteredFAQs = FAQ_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Help Center
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-4 border-b">
            {/* Mobile Dropdown */}
            <div className="sm:hidden py-2">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-10 bg-white border-border/50 shadow-sm rounded-lg px-4">
                  <span className="text-sm font-medium text-foreground">
                    {HELP_TABS.find(t => t.id === activeTab)?.label || "Select Tab"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                  {HELP_TABS.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id} className="py-2">
                      <span className="font-medium">{tab.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Desktop Tabs */}
            <TabsList className="hidden sm:flex w-full justify-start h-12 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="faq"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                FAQs
              </TabsTrigger>
              <TabsTrigger
                value="guides"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Quick Guides
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Contact
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <TabsContent value="faq" className="p-4 m-0">
              {searchQuery && filteredFAQs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(searchQuery ? filteredFAQs : FAQ_CATEGORIES).map((category) => {
                    const Icon = category.icon;
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Icon className="h-4 w-4" />
                          {category.title}
                        </div>
                        <Accordion type="single" collapsible className="space-y-1">
                          {category.items.map((item, index) => (
                            <AccordionItem
                              key={index}
                              value={`${category.id}-${index}`}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="text-sm text-left hover:no-underline py-3">
                                {item.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground pb-3">
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="guides" className="p-4 m-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Import Your First Job", description: "Learn how to add jobs to your tracker", time: "2 min" },
                  { title: "Optimize Your CV", description: "Get your CV ready for ATS systems", time: "5 min" },
                  { title: "Use the Kanban Board", description: "Master the visual job tracking", time: "3 min" },
                  { title: "Generate Cover Letters", description: "Create tailored cover letters with AI", time: "4 min" },
                  { title: "Set Up Reminders", description: "Never miss a follow-up again", time: "2 min" },
                  { title: "Analyze Your Progress", description: "Understand your job search metrics", time: "3 min" },
                ].map((guide, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{guide.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {guide.time} read
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="p-4 m-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {QUICK_LINKS.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.url}
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {link.label}
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-1">Need more help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our support team typically responds within 24 hours.
                  </p>
                  <Button size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
