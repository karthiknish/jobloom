"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  FileText,
  Send,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { EmailTemplate, EmailCampaign } from "@/config/emailTemplates";

// Import components
import { EmailMarketingHeader } from "@/components/admin/email-marketing/EmailMarketingHeader";
import { EmailTemplates } from "@/components/admin/email-marketing/EmailTemplates";
import { EmailCampaigns } from "@/components/admin/email-marketing/EmailCampaigns";
import { EmailList } from "@/components/admin/email-marketing/EmailList";

export default function EmailMarketingPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [emailListStats, setEmailListStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const token = await user?.getIdToken();
      
      // Fetch templates
      const templatesRes = await fetch("/api/admin/email-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }

      // Fetch campaigns
      const campaignsRes = await fetch("/api/admin/email-campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      }

      // Fetch email list
      const emailListRes = await fetch("/api/admin/email-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (emailListRes.ok) {
        const emailListData = await emailListRes.json();
        setEmailList(emailListData.emailList || []);
        setEmailListStats(emailListData.segments || {});
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
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
      <EmailMarketingHeader 
        onSendTestEmail={sendTestEmail}
        templates={templates}
        campaigns={campaigns}
      />

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
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="templates" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Send className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="email-list" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              Email List
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <EmailTemplates 
              templates={templates}
              loading={loading}
              onTemplatesChange={setTemplates}
              onSendTestEmail={sendTestEmail}
            />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <EmailCampaigns 
              campaigns={campaigns}
              templates={templates}
              loading={loading}
              onCampaignsChange={setCampaigns}
            />
          </TabsContent>

          {/* Email List Tab */}
          <TabsContent value="email-list">
            <EmailList 
              emailList={emailList}
              emailListStats={emailListStats}
              loading={loading}
              onEmailListChange={setEmailList}
              onStatsChange={setEmailListStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
