import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/firebase/admin";
import { EmailCampaign } from "@/config/emailTemplates";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const campaignsRef = db.collection('emailCampaigns');
    const campaignsSnap = await campaignsRef.orderBy('createdAt', 'desc').get();
    
    const campaigns = campaignsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(campaigns);

  } catch (error) {
    console.error('Email campaigns GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const campaignData = await request.json();

    // Validate required fields
    if (!campaignData.name || !campaignData.templateId || !campaignData.subject) {
      return NextResponse.json(
        { error: 'Name, template ID, and subject are required' },
        { status: 400 }
      );
    }

    // Verify template exists
    const templateDoc = await db.collection('emailTemplates').doc(campaignData.templateId).get();
    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const campaignRef = db.collection('emailCampaigns').doc();
    const newCampaign: EmailCampaign = {
      id: campaignRef.id,
      name: campaignData.name,
      templateId: campaignData.templateId,
      subject: campaignData.subject,
      fromEmail: campaignData.fromEmail || 'noreply@hireall.app',
      fromName: campaignData.fromName || 'HireAll Team',
      replyTo: campaignData.replyTo,
      recipients: campaignData.recipients || { type: 'all' },
      schedule: campaignData.schedule || { type: 'immediate' },
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

    return NextResponse.json(newCampaign, { status: 201 });

  } catch (error) {
    console.error('Email campaigns POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create email campaign' },
      { status: 500 }
    );
  }
}