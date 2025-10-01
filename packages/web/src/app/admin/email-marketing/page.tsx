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
  Copy,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Filter,
  Search,
  Calendar,
  Tag,
  FileText,
  Settings,
  TrendingUp,
  MousePointer,
  MailOpen,
  UserX
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { EmailTemplate, EmailCampaign } from "@/config/emailTemplates";

export default function EmailMarketingPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);

  // Form states
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

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    templateId: "",
    subject: "",
    fromEmail: "noreply@hireall.com",
    fromName: "HireAll Team",
    replyTo: "",
    recipients: {
      type: "all" as 'all' | 'segment' | 'custom',
      segment: "",
      customEmails: [] as string[]
    },
    schedule: {
      type: "immediate" as 'immediate' | 'scheduled',
      sendAt: ""
    }
  });

  // Fetch data
  useEffect(() => {
    if (!user) return;
    fetchTemplates();
    fetchCampaigns();
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
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

  const createCampaign = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campaignForm),
      });

      if (res.ok) {
        showSuccess("Campaign created", "Email campaign has been created successfully.");
        setShowCampaignDialog(false);
        resetCampaignForm();
        fetchCampaigns();
        setActiveTab("campaigns");
      } else {
        throw new Error("Failed to create campaign");
      }
    } catch (error: any) {
      showError("Create failed", error.message || "Unable to create campaign.");
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      setSendingCampaign(campaignId);
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/email-campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess("Campaign sent", `Campaign sent to ${data.sent} recipients.`);
        fetchCampaigns();
      } else {
        throw new Error("Failed to send campaign");
      }
    } catch (error: any) {
      showError("Send failed", error.message || "Unable to send campaign.");
    } finally {
      setSendingCampaign(null);
    }
  };

  const sendTestEmail = async () => {
    const testEmail = prompt("Enter email address to send test email:");
    if (!testEmail) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: testEmail,
          subject: "🧪 HireAll Email Marketing Test",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">🎉 Email Marketing Test Successful!</h2>
              <p>This is a test email from the HireAll Email Marketing System.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #666; margin-top: 0;">System Features:</h3>
                <ul style="color: #666;">
                  <li>✅ Resend Integration</li>
                  <li>✅ Template Personalization</li>
                  <li>✅ Bulk Email Sending</li>
                  <li>✅ Campaign Analytics</li>
                  <li>✅ User Segmentation</li>
                </ul>
              </div>
              <p style="color: #666; font-size: 14px;">
                If you received this email, the email marketing system is working correctly!
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated test email from HireAll.
              </p>
            </div>
          `,
          text: `
            Email Marketing Test Successful!
            
            This is a test email from the HireAll Email Marketing System.
            
            System Features:
            - Resend Integration
            - Template Personalization
            - Bulk Email Sending
            - Campaign Analytics
            - User Segmentation
            
            If you received this email, the email marketing system is working correctly!
            
            This is an automated test email from HireAll.
          `
        })
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess("Test email sent", `Test email sent to ${testEmail}`);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to send test email");
      }
    } catch (error: any) {
      showError("Test failed", error.message || "Unable to send test email.");
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

  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      templateId: "",
      subject: "",
      fromEmail: "noreply@hireall.com",
      fromName: "HireAll Team",
      replyTo: "",
      recipients: {
        type: "all",
        segment: "",
        customEmails: []
      },
      schedule: {
        type: "immediate",
        sendAt: ""
      }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sending':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
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
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-xl"
      >
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Email Marketing</h1>
              <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
                Create and manage email campaigns to engage with your users
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={sendTestEmail}
              >
                <Mail className="h-5 w-5 mr-2" />
                Test Email
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status !== 'draft').length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + c.metrics.opened, 0) > 0 
                      ? Math.round((campaigns.reduce((sum, c) => sum + c.metrics.opened, 0) / 
                          campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MailOpen className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="templates" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Send className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
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
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Email Campaigns</h3>
                <p className="text-muted-foreground">Manage and track your email campaigns</p>
              </div>
              <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                      Set up your email campaign details and recipients
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={campaignForm.name}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Monthly Newsletter"
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaign-template">Template</Label>
                        <Select
                          value={campaignForm.templateId}
                          onValueChange={(value) => setCampaignForm(prev => ({ ...prev, templateId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.filter(t => t.active).map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="campaign-subject">Subject Line</Label>
                      <Input
                        id="campaign-subject"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Your Monthly Career Insights"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="from-email">From Email</Label>
                        <Input
                          id="from-email"
                          value={campaignForm.fromEmail}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                          placeholder="noreply@hireall.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="from-name">From Name</Label>
                        <Input
                          id="from-name"
                          value={campaignForm.fromName}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, fromName: e.target.value }))}
                          placeholder="HireAll Team"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Recipients</Label>
                      <Select
                        value={campaignForm.recipients.type}
                        onValueChange={(value: 'all' | 'segment' | 'custom') => 
                          setCampaignForm(prev => ({
                            ...prev,
                            recipients: { ...prev.recipients, type: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="segment">User Segment</SelectItem>
                          <SelectItem value="custom">Custom Emails</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCampaignDialog(false);
                          resetCampaignForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createCampaign}>
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(campaign.status)}
                              <Badge variant="outline" className="text-xs">
                                {campaign.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {campaign.recipients.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Metrics */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-semibold">{campaign.metrics.sent}</p>
                              <p className="text-muted-foreground">Sent</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{campaign.metrics.opened}</p>
                              <p className="text-muted-foreground">Opened</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{campaign.metrics.clicked}</p>
                              <p className="text-muted-foreground">Clicked</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => sendCampaign(campaign.id)}
                                disabled={sendingCampaign === campaign.id}
                              >
                                {sendingCampaign === campaign.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send
                                  </>
                                )}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}