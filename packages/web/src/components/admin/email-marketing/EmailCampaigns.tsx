"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Plus,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Calendar,
  FileText,
  Play,
  Square,
  Eye,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Mail,
  Target,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { EmailCampaign } from "@/config/emailTemplates";

interface EmailCampaignsProps {
  campaigns: EmailCampaign[];
  templates: any[];
  loading: boolean;
  onCampaignsChange: (campaigns: EmailCampaign[]) => void;
}

export function EmailCampaigns({ 
  campaigns, 
  templates, 
  loading, 
  onCampaignsChange 
}: EmailCampaignsProps) {
  const { user } = useFirebaseAuth();
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    templateId: "",
    subject: "",
    fromEmail: "noreply@hireall.app",
    fromName: "HireAll Team",
    replyTo: "",
    recipients: {
      type: "all" as 'all' | 'segment' | 'custom',
      segment: "",
      customEmails: [] as string[],
    },
    schedule: {
      type: "immediate" as 'immediate' | 'scheduled',
      sendAt: undefined as Date | undefined,
    },
  });

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      name: "",
      templateId: "",
      subject: "",
      fromEmail: "noreply@hireall.app",
      fromName: "HireAll Team",
      replyTo: "",
      recipients: {
        type: "all",
        segment: "",
        customEmails: [],
      },
      schedule: {
        type: "immediate",
        sendAt: undefined,
      },
    });
    setShowCampaignDialog(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      templateId: campaign.templateId,
      subject: campaign.subject,
      fromEmail: campaign.fromEmail,
      fromName: campaign.fromName,
      replyTo: campaign.replyTo || "",
      recipients: {
        type: campaign.recipients.type,
        segment: campaign.recipients.segment || "",
        customEmails: campaign.recipients.customEmails || [],
      },
      schedule: {
        type: campaign.schedule?.type || "immediate",
        sendAt: campaign.schedule?.sendAt || undefined,
      },
    });
    setShowCampaignDialog(true);
  };

  const handleSaveCampaign = async () => {
    try {
      if (!campaignForm.name || !campaignForm.templateId || !campaignForm.subject) {
        showError("Please fill in all required fields");
        return;
      }

      const campaignData = {
        ...campaignForm,
        id: editingCampaign?.id || `campaign-${Date.now()}`,
        status: editingCampaign?.status || 'draft',
        metrics: editingCampaign?.metrics || {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
        },
        createdAt: editingCampaign?.createdAt || new Date(),
        updatedAt: new Date(),
        sentAt: editingCampaign?.sentAt,
      };

      const response = await fetch('/api/admin/email-campaigns', {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }

      const savedCampaign = await response.json();
      
      if (editingCampaign) {
        onCampaignsChange(campaigns.map(c => c.id === editingCampaign.id ? savedCampaign : c));
        showSuccess("Campaign updated successfully");
      } else {
        onCampaignsChange([...campaigns, savedCampaign]);
        showSuccess("Campaign created successfully");
      }

      setShowCampaignDialog(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      showError("Failed to save campaign");
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      setSendingCampaign(campaignId);
      
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }

      const updatedCampaign = await response.json();
      onCampaignsChange(campaigns.map(c => c.id === campaignId ? updatedCampaign : c));
      showSuccess("Campaign sent successfully");
    } catch (error) {
      console.error('Error sending campaign:', error);
      showError("Failed to send campaign");
    } finally {
      setSendingCampaign(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      onCampaignsChange(campaigns.filter(c => c.id !== campaignId));
      showSuccess("Campaign deleted successfully");
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showError("Failed to delete campaign");
    }
  };

  const handleDuplicateCampaign = (campaign: EmailCampaign) => {
    const duplicatedCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      name: `${campaign.name} (Copy)`,
      status: 'draft' as EmailCampaign['status'],
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: undefined,
    };
    onCampaignsChange([...campaigns, duplicatedCampaign]);
    showSuccess("Campaign duplicated successfully");
  };

  const getStatusIcon = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'sending': return <Send className="h-4 w-4" />;
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'sent': return 'bg-green-50 text-green-700 border-green-200';
      case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateOpenRate = (metrics: EmailCampaign['metrics']) => {
    if (metrics.delivered === 0) return 0;
    return Math.round((metrics.opened / metrics.delivered) * 100);
  };

  const calculateClickRate = (metrics: EmailCampaign['metrics']) => {
    if (metrics.delivered === 0) return 0;
    return Math.round((metrics.clicked / metrics.delivered) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{campaigns.filter(c => c.status === 'sent').length} sent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{campaigns.filter(c => c.status === 'sending').length} sending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>{campaigns.filter(c => c.status === 'draft').length} draft</span>
            </div>
          </div>
        </div>

        <Button onClick={handleCreateCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="group border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={getStatusColor(campaign.status)}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1 capitalize">{campaign.status}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1 text-gray-900">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-500">
                      {campaign.subject}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Metrics */}
                  {campaign.metrics.sent > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Progress</span>
                        <span>{campaign.metrics.sent} sent</span>
                      </div>
                      <Progress value={(campaign.metrics.sent / 1000) * 100} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3 text-blue-500" />
                          <span>{calculateOpenRate(campaign.metrics)}% open</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Target className="h-3 w-3 text-green-500" />
                          <span>{calculateClickRate(campaign.metrics)}% click</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Campaign Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{campaign.recipients.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <FileText className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {templates.find(t => t.id === campaign.templateId)?.name || 'Unknown template'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCampaign(campaign)}
                      className="flex-1 border-gray-200 hover:bg-white"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    {campaign.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendingCampaign === campaign.id}
                        className="border-gray-200 hover:bg-white"
                      >
                        {sendingCampaign === campaign.id ? (
                          <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateCampaign(campaign)}
                      className="border-gray-200 hover:bg-white"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    {campaign.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCampaign(campaign)}
                        className="border-gray-200 hover:bg-white"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-700 border-gray-200 hover:bg-red-50"
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
      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first email campaign to start engaging with your users
          </p>
          <Button onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create Campaign"}
            </DialogTitle>
            <DialogDescription>
              Set up your email campaign with templates and recipient settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Welcome Campaign"
                />
              </div>
              
              <div>
                <Label htmlFor="templateId">Template *</Label>
                <Select 
                  value={campaignForm.templateId} 
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="Your subject line"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  value={campaignForm.fromEmail}
                  onChange={(e) => setCampaignForm({ ...campaignForm, fromEmail: e.target.value })}
                  placeholder="noreply@hireall.app"
                />
              </div>
              
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={campaignForm.fromName}
                  onChange={(e) => setCampaignForm({ ...campaignForm, fromName: e.target.value })}
                  placeholder="HireAll Team"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="replyTo">Reply To (Optional)</Label>
              <Input
                id="replyTo"
                value={campaignForm.replyTo}
                onChange={(e) => setCampaignForm({ ...campaignForm, replyTo: e.target.value })}
                placeholder="support@hireall.app"
              />
            </div>
            
            <div>
              <Label>Recipients</Label>
              <Select 
                value={campaignForm.recipients.type} 
                onValueChange={(value) => setCampaignForm({ 
                  ...campaignForm, 
                  recipients: { ...campaignForm.recipients, type: value as 'all' | 'segment' | 'custom' }
                })}
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
            
            <div>
              <Label>Schedule</Label>
              <Select 
                value={campaignForm.schedule.type} 
                onValueChange={(value) => setCampaignForm({ 
                  ...campaignForm, 
                  schedule: { ...campaignForm.schedule, type: value as 'immediate' | 'scheduled' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Send Immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCampaign}>
                {editingCampaign ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Preview Dialog */}
      <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Review campaign settings and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {previewCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Campaign Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {previewCampaign.name}</div>
                    <div><strong>Subject:</strong> {previewCampaign.subject}</div>
                    <div><strong>From:</strong> {previewCampaign.fromName} &lt;{previewCampaign.fromEmail}&gt;</div>
                    <div><strong>Recipients:</strong> {previewCampaign.recipients.type}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{previewCampaign.status}</span></div>
                    <div><strong>Created:</strong> {new Date(previewCampaign.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  {previewCampaign.metrics.sent > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Sent:</span>
                        <span className="font-medium">{previewCampaign.metrics.sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivered:</span>
                        <span className="font-medium">{previewCampaign.metrics.delivered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Opened:</span>
                        <span className="font-medium">{previewCampaign.metrics.opened} ({calculateOpenRate(previewCampaign.metrics)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clicked:</span>
                        <span className="font-medium">{previewCampaign.metrics.clicked} ({calculateClickRate(previewCampaign.metrics)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bounced:</span>
                        <span className="font-medium">{previewCampaign.metrics.bounced}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unsubscribed:</span>
                        <span className="font-medium">{previewCampaign.metrics.unsubscribed}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No metrics available yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
