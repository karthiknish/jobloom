import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { EmailCampaign } from "@/config/emailTemplates";
import { withApi, z } from "@/lib/api/withApi";

const emailCampaignCreateSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  subject: z.string().min(1),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  recipients: z.object({
    type: z.enum(['all', 'segment', 'custom']),
    segment: z.string().optional(),
    customEmails: z.array(z.string().email()).optional(),
  }).optional(),
  schedule: z.object({
    type: z.enum(['immediate', 'scheduled']),
    sendAt: z.string().optional(), // ISO string
  }).optional(),
});

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async () => {
  const db = getAdminDb();
  const campaignsRef = db.collection('emailCampaigns');
  const campaignsSnap = await campaignsRef.orderBy('createdAt', 'desc').get();
  
  const campaigns = campaignsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return campaigns;
});

export const POST = withApi({
  auth: "admin",
  rateLimit: "admin",
  bodySchema: emailCampaignCreateSchema,
}, async ({ body }) => {
  const db = getAdminDb();
  const campaignData = body;

  // Verify template exists
  const templateDoc = await db.collection('emailTemplates').doc(campaignData.templateId).get();
  if (!templateDoc.exists) {
    throw { code: 'NOT_FOUND', message: 'Template not found', status: 404 };
  }

  const campaignRef = db.collection('emailCampaigns').doc();
  
  const recipients = campaignData.recipients || { type: 'all' as const };
  const schedule = campaignData.schedule 
    ? { 
        type: campaignData.schedule.type, 
        sendAt: campaignData.schedule.sendAt ? new Date(campaignData.schedule.sendAt) : undefined 
      } 
    : { type: 'immediate' as const };

  const newCampaign: EmailCampaign = {
    id: campaignRef.id,
    name: campaignData.name,
    templateId: campaignData.templateId,
    subject: campaignData.subject,
    fromEmail: campaignData.fromEmail || 'noreply@hireall.app',
    fromName: campaignData.fromName || 'HireAll Team',
    replyTo: campaignData.replyTo,
    recipients,
    schedule,
    status: 'draft',
    metrics: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await campaignRef.set({
    ...newCampaign,
    createdAt: newCampaign.createdAt.toISOString(),
    updatedAt: newCampaign.updatedAt.toISOString(),
    schedule: newCampaign.schedule ? {
      ...newCampaign.schedule,
      sendAt: newCampaign.schedule.sendAt?.toISOString()
    } : undefined
  });

  return newCampaign;
});
