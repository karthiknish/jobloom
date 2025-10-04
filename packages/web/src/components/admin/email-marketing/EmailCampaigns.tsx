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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      customEmails: [] as string[]
    },
    schedule: {
      type: "immediate" as 'immediate' | 'scheduled',
      sendAt: ""
    }
  });

  const fetchCampaigns = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/email-campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        onCampaignsChange(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
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

  const resetCampaignForm = () => {
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
        customEmails: []
      },
      schedule: {
        type: "immediate",
        sendAt: ""
      }
    });
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
                    placeholder="noreply@hireall.app"
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

      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-4">Create your first email campaign to get started.</p>
          <Button onClick={() => setShowCampaignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      )}
    </div>
  );
}
