import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getAdminAuth } from "@/firebase/admin";

export async function GET(
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

    const templateDoc = await db.collection('emailTemplates').doc(params.id).get();
    
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: templateDoc.id,
      ...templateDoc.data()
    });

  } catch (error) {
    console.error('Email template GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const updateData = await request.json();
    
    const templateRef = db.collection('emailTemplates').doc(params.id);
    const templateDoc = await templateRef.get();
    
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updatedTemplate = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await templateRef.update(updatedTemplate);

    return NextResponse.json({
      id: params.id,
      ...updatedTemplate
    });

  } catch (error) {
    console.error('Email template PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const templateRef = db.collection('emailTemplates').doc(params.id);
    const templateDoc = await templateRef.get();
    
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await templateRef.delete();

    return NextResponse.json({ message: 'Template deleted successfully' });

  } catch (error) {
    console.error('Email template DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}