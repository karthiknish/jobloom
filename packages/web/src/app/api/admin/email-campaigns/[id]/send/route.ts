import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getAdminAuth } from "@/firebase/admin";
import { sendBulkEmails, personalizeTemplate, personalizeSubject } from "@/lib/resend";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const campaignRef = db.collection('emailCampaigns').doc(params.id);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaignDoc.data();
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if campaign is already sent or sending
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json({ error: 'Campaign already sent or currently sending' }, { status: 400 });
    }

    // Get template
    const templateDoc = await db.collection('emailTemplates').doc(campaign.templateId).get();
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templateDoc.data();
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get recipients
    let recipients: string[] = [];
    
    if (campaign.recipients.type === 'all') {
      // Get all users who have opted in to emails
      const usersSnap = await db.collection('users')
        .where('emailPreferences.marketing', '==', true)
        .get();
      recipients = usersSnap.docs.map((doc: any) => doc.data().email).filter(Boolean);
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
      recipients = usersSnap.docs.map((doc: any) => doc.data().email).filter(Boolean);
    } else if (campaign.recipients.type === 'custom' && campaign.recipients.customEmails) {
      recipients = campaign.recipients.customEmails;
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Update campaign status to sending
    await campaignRef.update({
      status: 'sending',
      updatedAt: new Date().toISOString()
    });

    // Prepare emails for bulk sending
    const emails = [];
    
    for (const email of recipients) {
      try {
        // Get user data for personalization
        const userDoc = await db.collection('users').where('email', '==', email).limit(1).get();
        const userData = userDoc.docs[0]?.data();
        
        // Prepare personalization variables
        const variables = {
          firstName: userData?.displayName || userData?.firstName || 'there',
          email: email,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
          ...userData
        };
        
        // Personalize content
        const personalizedHtml = personalizeTemplate(template.htmlContent, variables);
        const personalizedText = personalizeTemplate(template.textContent, variables);
        const personalizedSubject = personalizeSubject(campaign.subject, variables);
        
        emails.push({
          to: email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: campaign.fromEmail,
          replyTo: campaign.replyToEmail
        });
        
      } catch (error) {
        console.error(`Failed to prepare email for ${email}:`, error);
      }
    }

    // Send emails using Resend
    console.log(`Sending ${emails.length} emails via Resend...`);
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
          campaignId: params.id,
          to: email.to,
          subject: email.subject,
          fromEmail: email.from,
          htmlContent: email.html,
          textContent: email.text,
          status: result.success ? 'sent' : 'failed',
          messageId: result.messageId,
          error: result.error,
          sentAt: new Date().toISOString(),
          userId: (await db.collection('users').where('email', '==', email.to).limit(1).get()).docs[0]?.id
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

    return NextResponse.json({
      message: 'Campaign sent successfully',
      sent: sentCount,
      errors: errorCount
    });

  } catch (updateError) {
    console.error('Failed to update campaign status:', updateError);
    
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}