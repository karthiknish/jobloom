"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  FileText,
  Send,
  Users,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { EmailTemplate, EmailCampaign } from "@/config/emailTemplates";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api/client";

// Import components
import { EmailMarketingHeader } from "@/components/admin/email-marketing/EmailMarketingHeader";
import { EmailTemplates } from "@/components/admin/email-marketing/EmailTemplates";
import { EmailCampaigns } from "@/components/admin/email-marketing/EmailCampaigns";
import { EmailList } from "@/components/admin/email-marketing/EmailList";

export default function EmailMarketingPage() {
  const { user } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [emailListStats, setEmailListStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchInitialData();
  }, [user, isAdmin]);

  const fetchInitialData = async () => {
    try {
      // Fetch templates
      const templatesData = await apiClient.get<EmailTemplate[]>("/admin/email-templates");
      setTemplates(templatesData);

      // Fetch campaigns
      const campaignsData = await apiClient.get<EmailCampaign[]>("/admin/email-campaigns");
      setCampaigns(campaignsData);

      // Fetch email list
      const emailListData = await apiClient.get<any>("/admin/email-list");
      setEmailList(emailListData.emailList || []);
      setEmailListStats(emailListData.segments || {});
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
      await apiClient.post("/admin/email-test", {
        to: testEmail,
        subject: "HireAll Email Marketing Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Marketing Test Successful!</h2>
            <p>This is a test email from the HireAll Email Marketing System.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #666; margin-top: 0;">System Features:</h3>
              <ul style="color: #666;">
                <li>Resend Integration</li>
                <li>Template Personalization</li>
                <li>Bulk Email Sending</li>
                <li>Campaign Analytics</li>
                <li>User Segmentation</li>
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
      });

      showSuccess("Test email sent", `Test email sent to ${testEmail}`);
    } catch (error: any) {
      showError("Test failed", error.message || "Unable to send test email.");
    }
  };

  if (adminLoading) {
    return (
      <AdminLayout title="Email Marketing">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs Skeleton */}
          <Skeleton className="h-12 w-full rounded-xl" />
          
          {/* Content Skeleton */}
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout title="Email Marketing">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage email campaigns to engage with your users
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={sendTestEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Test Email
            </Button>
            <Button
              variant="outline"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Templates</CardTitle>
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{templates.length}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Campaigns</CardTitle>
              <div className="p-2 rounded-full bg-green-100">
                <Send className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{campaigns.filter(c => c.status !== 'draft').length}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Sent</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Rate</CardTitle>
              <div className="p-2 rounded-full bg-orange-100">
                <Mail className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {campaigns.reduce((sum, c) => sum + c.metrics.opened, 0) > 0 
                  ? Math.round((campaigns.reduce((sum, c) => sum + c.metrics.opened, 0) / 
                      campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <TabsTrigger value="templates" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-600 data-[state=active]:text-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-600 data-[state=active]:text-foreground">
              <Send className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="email-list" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-600 data-[state=active]:text-foreground">
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
              loading={loading}
              onEmailListChange={setEmailList}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
