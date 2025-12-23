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
  Filter,
  Copy,
  Download,
  Upload,
  TestTube,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { EmailTemplate } from "@/config/emailTemplates";
import { apiClient } from "@/lib/api/client";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  useRestoreFocus(showTemplateDialog);
  useRestoreFocus(!!previewTemplate);
  const [activeTab, setActiveTab] = useState("templates");

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "marketing" as EmailTemplate['category'],
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [] as string[],
    tags: [] as string[],
    active: true,
  });

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get category counts
  const categoryCounts = templates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { value: "all", label: "All Templates", count: templates.length },
    { value: "marketing", label: "Marketing", count: categoryCounts.marketing || 0 },
    { value: "newsletter", label: "Newsletter", count: categoryCounts.newsletter || 0 },
    { value: "onboarding", label: "Onboarding", count: categoryCounts.onboarding || 0 },
    { value: "promotional", label: "Promotional", count: categoryCounts.promotional || 0 },
    { value: "announcement", label: "Announcement", count: categoryCounts.announcement || 0 },
  ];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      description: "",
      category: "marketing",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: [],
      tags: [],
      active: true,
    });
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
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
      active: template.active,
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      // Validation
      if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
        showError("Please fill in all required fields");
        return;
      }

      const templateData = {
        ...templateForm,
        id: editingTemplate?.id || `template-${Date.now()}`,
        createdAt: editingTemplate?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Save to API using apiClient
      const savedTemplate = editingTemplate
        ? await apiClient.put<EmailTemplate>('/api/admin/email-templates', templateData)
        : await apiClient.post<EmailTemplate>('/api/admin/email-templates', templateData);
      
      if (editingTemplate) {
        onTemplatesChange(templates.map(t => t.id === editingTemplate.id ? savedTemplate : t));
        showSuccess("Template updated successfully");
      } else {
        onTemplatesChange([...templates, savedTemplate]);
        showSuccess("Template created successfully");
      }

      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Error saving template:', error);
      showError("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/email-templates/${templateId}`);

      onTemplatesChange(templates.filter(t => t.id !== templateId));
      showSuccess("Template deleted successfully");
    } catch (error) {
      console.error('Error deleting template:', error);
      showError("Failed to delete template");
    }
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onTemplatesChange([...templates, duplicatedTemplate]);
    showSuccess("Template duplicated successfully");
  };

  const handleSendTest = async (templateId: string) => {
    try {
      await apiClient.post('/api/admin/email-templates/test', { templateId });

      showSuccess("Test email sent successfully");
    } catch (error) {
      console.error('Error sending test email:', error);
      showError("Failed to send test email");
    }
  };

  const getCategoryIcon = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'marketing': return <Zap className="h-4 w-4" />;
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'onboarding': return <Crown className="h-4 w-4" />;
      case 'promotional': return <Tag className="h-4 w-4" />;
      case 'announcement': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'marketing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'newsletter': return 'bg-green-100 text-green-800 border-green-200';
      case 'onboarding': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'promotional': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'announcement': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border-gray-200">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:ring-blue-500"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 border-gray-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.value as EmailTemplate['category'])}
                    <span>{category.label}</span>
                    <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-600">
                      {category.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="group hover:shadow-lg border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(template.category)}>
                        {getCategoryIcon(template.category)}
                        <span className="ml-1 capitalize">{template.category}</span>
                      </Badge>
                      {template.active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-1 text-gray-900">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-500">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Subject</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{template.subject}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs border-gray-200 text-gray-600">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendTest(template.id)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="border-gray-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No templates found"
          description={
            searchTerm || selectedCategory !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first email template."
          }
          actions={
            !searchTerm && selectedCategory === "all"
              ? [{ label: "Create Template", onClick: handleCreateTemplate, icon: Plus }]
              : []
          }
        />
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Design your email template with HTML and text versions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value as EmailTemplate['category'] })}
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Brief description of the template"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Welcome to our platform!"
              />
            </div>
            
            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">HTML Content</TabsTrigger>
                <TabsTrigger value="text">Text Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="space-y-2">
                <Label htmlFor="htmlContent">HTML Template *</Label>
                <Textarea
                  id="htmlContent"
                  value={templateForm.htmlContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                  placeholder="<!DOCTYPE html>..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
              
              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="textContent">Text Template</Label>
                <Textarea
                  id="textContent"
                  value={templateForm.textContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                  placeholder="Plain text version..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={templateForm.active}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, active: checked })}
              />
              <Label htmlFor="active">Template is active</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Subject: {previewTemplate.subject}</h4>
                <div className="flex gap-2 mb-4">
                  <Badge className={getCategoryColor(previewTemplate.category)}>
                    {previewTemplate.category}
                  </Badge>
                  {previewTemplate.active ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="html-preview" className="w-full">
                <TabsList>
                  <TabsTrigger value="html-preview">HTML Preview</TabsTrigger>
                  <TabsTrigger value="text-preview">Text Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html-preview">
                  <div className="border rounded-lg">
                    <iframe
                      srcDoc={previewTemplate.htmlContent}
                      className="w-full h-96 border-0"
                      title="Email Preview"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="text-preview">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm">
                      {previewTemplate.textContent || "No text content available"}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
