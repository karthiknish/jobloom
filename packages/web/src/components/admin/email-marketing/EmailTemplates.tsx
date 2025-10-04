"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Tag,
  FileText,
  Crown,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { EmailTemplate } from "@/config/emailTemplates";

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  loading: boolean;
  onTemplatesChange: (templates: EmailTemplate[]) => void;
  onSendTestEmail: () => void;
}

export function EmailTemplates({ 
  templates, 
  loading, 
  onTemplatesChange, 
  onSendTestEmail 
}: EmailTemplatesProps) {
  const { user } = useFirebaseAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "marketing" as EmailTemplate['category'],
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [] as string[],
    tags: [] as string[],
    active: true
  });

  const fetchTemplates = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        onTemplatesChange(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const saveTemplate = async () => {
    try {
      const token = await user?.getIdToken();
      const method = editingTemplate ? "PUT" : "POST";
      const url = editingTemplate 
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : "/api/admin/email-templates";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateForm),
      });

      if (res.ok) {
        showSuccess("Template saved", "Email template has been saved successfully.");
        setShowTemplateDialog(false);
        setEditingTemplate(null);
        resetTemplateForm();
        fetchTemplates();
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error: any) {
      showError("Save failed", error.message || "Unable to save template.");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showSuccess("Template deleted", "Email template has been deleted successfully.");
        fetchTemplates();
      } else {
        throw new Error("Failed to delete template");
      }
    } catch (error: any) {
      showError("Delete failed", error.message || "Unable to delete template.");
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      category: "marketing",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: [],
      tags: [],
      active: true
    });
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables,
      tags: template.tags,
      active: template.active
    });
    setShowTemplateDialog(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access email marketing.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onSendTestEmail}
          >
            <Mail className="h-5 w-5 mr-2" />
            Test Email
          </Button>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-xl">
                <Plus className="h-5 w-5 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </DialogTitle>
                <DialogDescription>
                  Design your email template with HTML and text content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Welcome Newsletter"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={templateForm.category}
                      onValueChange={(value: EmailTemplate['category']) => 
                        setTemplateForm(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Welcome email for new subscribers"
                  />
                </div>

                <div>
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Welcome to HireAll! 🎉"
                  />
                </div>

                <div>
                  <Label htmlFor="template-html">HTML Content</Label>
                  <Textarea
                    id="template-html"
                    value={templateForm.htmlContent}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="<html>...</html>"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="template-text">Text Content</Label>
                  <Textarea
                    id="template-text"
                    value={templateForm.textContent}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, textContent: e.target.value }))}
                    placeholder="Plain text version of your email"
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-active"
                    checked={templateForm.active}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="template-active">Active</Label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTemplateDialog(false);
                      setEditingTemplate(null);
                      resetTemplateForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate}>
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.active && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                  <p className="text-sm truncate">{template.subject}</p>
                </div>

                {template.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">Create your first email template to get started.</p>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  );
}
