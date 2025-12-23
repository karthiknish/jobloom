import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { sendBulkEmails, personalizeTemplate, personalizeSubject } from "@/lib/email";

const paramsSchema = z.object({
  id: z.string(),
});

export const POST = withApi({
  auth: 'admin',
  rateLimit: 'blog-admin',
  paramsSchema,
}, async ({ params }) => {
  const { id } = params;
  const db = getAdminDb();
  const campaignRef = db.collection('emailCampaigns').doc(id);

  // Transactionally mark campaign as sending to avoid double-send on concurrent requests.
  const campaign = await db.runTransaction(async (tx) => {
    const campaignDoc = await tx.get(campaignRef);
    if (!campaignDoc.exists) {
      return null;
    }
    const data = campaignDoc.data() as any;
    if (!data) {
      return null;
    }
    if (data.status === 'sent' || data.status === 'sending') {
      return { __blocked: true, status: data.status };
    }
    tx.update(campaignRef, { status: 'sending', updatedAt: new Date().toISOString() });
    return data;
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }
  if ((campaign as any).__blocked) {
    throw new Error('Campaign already sent or currently sending');
  }

  // Get template
  const templateDoc = await db.collection('emailTemplates').doc(campaign.templateId).get();
  if (!templateDoc.exists) {
    throw new Error('Template not found');
  }

  const template = templateDoc.data();
  if (!template) {
    throw new Error('Template not found');
  }

  // Get recipients
  let recipients: Array<{ userId?: string; email: string; displayName?: string; firstName?: string }> = [];
  
  if (campaign.recipients.type === 'all') {
    // Get all users who have opted in to emails
    const usersSnap = await db.collection('users')
      .where('emailPreferences.marketing', '==', true)
      .get();
    recipients = usersSnap.docs
      .map((doc: any) => ({ userId: doc.id, ...(doc.data() || {}) }))
      .map((u: any) => ({
        userId: u.userId,
        email: u.email,
        displayName: u.displayName,
        firstName: u.firstName,
      }))
      .filter((r: any) => typeof r.email === 'string' && r.email);
  } else if (campaign.recipients.type === 'segment') {
    // Get users by segment (you can customize this logic)
    const segment = campaign.recipients.segment;
    let query: any = db.collection('users').where('emailPreferences.marketing', '==', true);
    
    if (segment === 'active') {
      query = query.where('lastLoginAt', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    } else if (segment === 'premium') {
      query = query.where('subscription.status', '==', 'active');
    } else if (segment === 'inactive') {
      query = query.where('lastLoginAt', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    }
    
    const usersSnap = await query.get();
    recipients = usersSnap.docs
      .map((doc: any) => ({ userId: doc.id, ...(doc.data() || {}) }))
      .map((u: any) => ({
        userId: u.userId,
        email: u.email,
        displayName: u.displayName,
        firstName: u.firstName,
      }))
      .filter((r: any) => typeof r.email === 'string' && r.email);
  } else if (campaign.recipients.type === 'custom' && campaign.recipients.customEmails) {
    recipients = campaign.recipients.customEmails
      .filter((e: any) => typeof e === 'string')
      .map((email: string) => ({ email }));
  }

  // De-dupe emails
  const seen = new Set<string>();
  recipients = recipients.filter((r) => {
    const normalized = r.email.trim().toLowerCase();
    if (!normalized) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    r.email = normalized;
    return true;
  });

  if (recipients.length === 0) {
    throw new Error('No recipients found');
  }

  // Prepare emails for bulk sending
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireall.app';
  const emails: Array<any> = [];
  
  for (const recipient of recipients) {
    try {
      // Prepare personalization variables
      const variables = {
        firstName: recipient.displayName || recipient.firstName || 'there',
        email: recipient.email,
        dashboardUrl: `${appBaseUrl}/dashboard`,
        unsubscribeUrl: `${appBaseUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`,
      };
      
      // Personalize content
      const personalizedHtml = personalizeTemplate(template.htmlContent, variables, { escapeHtml: true });
      const personalizedText = personalizeTemplate(template.textContent, variables, { escapeHtml: false });
      const personalizedSubject = personalizeSubject(campaign.subject, variables);
      
      emails.push({
        to: recipient.email,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        from: campaign.fromEmail,
        replyTo: campaign.replyToEmail,
        __userId: recipient.userId ?? null
      });
      
    } catch (error) {
      console.error(`Failed to prepare email for ${recipient.email}:`, error);
    }
  }

  // Send emails using Brevo
  console.log(`Sending ${emails.length} emails via Brevo...`);
  const { results, summary } = await sendBulkEmails(emails, {
    batchSize: 100,
    delayBetweenBatches: 1000
  });

  // Track email results in Firestore
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const email = emails[i];
    
    try {
      await db.collection('emailLogs').add({
        campaignId: id,
        to: email.to,
        subject: email.subject,
        fromEmail: email.from,
        htmlContent: email.html,
        textContent: email.text,
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        userId: email.__userId
      });
    } catch (logError) {
      console.error('Failed to log email:', logError);
    }
  }

  const sentCount = summary.sent;
  const errorCount = summary.failed;

  // Update campaign metrics
  await campaignRef.update({
    status: 'sent',
    metrics: {
      sent: sentCount,
      delivered: sentCount - errorCount,
      opened: 0,
      clicked: 0,
      bounced: errorCount,
      unsubscribed: 0
    },
    sentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return {
    message: 'Campaign sent successfully',
    sent: sentCount,
    errors: errorCount
  };
});
