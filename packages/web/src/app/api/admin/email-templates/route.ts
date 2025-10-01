import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { defaultEmailTemplates, EmailTemplate } from "@/config/emailTemplates";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get templates from Firestore or return defaults
    const templatesRef = db.collection('emailTemplates');
    const templatesSnap = await templatesRef.get();
    
    if (templatesSnap.empty) {
      // Initialize with default templates
      const batch = db.batch();
      defaultEmailTemplates.forEach(template => {
        const docRef = templatesRef.doc(template.id);
        batch.set(docRef, {
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        });
      });
      await batch.commit();
      
      return NextResponse.json(defaultEmailTemplates);
    }

    const templates = templatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(templates);

  } catch (error) {
    console.error('Email templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
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
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const templateData = await request.json();

    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.htmlContent) {
      return NextResponse.json(
        { error: 'Name, subject, and HTML content are required' },
        { status: 400 }
      );
    }

    const templateRef = db.collection('emailTemplates').doc();
    const newTemplate: EmailTemplate = {
      id: templateRef.id,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'marketing',
      subject: templateData.subject,
      htmlContent: templateData.htmlContent,
      textContent: templateData.textContent || '',
      variables: templateData.variables || [],
      preview: templateData.preview || '',
      tags: templateData.tags || [],
      active: templateData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await templateRef.set({
      ...newTemplate,
      createdAt: newTemplate.createdAt.toISOString(),
      updatedAt: newTemplate.updatedAt.toISOString()
    });

    return NextResponse.json(newTemplate, { status: 201 });

  } catch (error) {
    console.error('Email templates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}