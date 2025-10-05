import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getAdminAuth } from "@/firebase/admin";
import { sendEmail } from "@/lib/resend";

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

    const { to, subject, html, text } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, html' 
      }, { status: 400 });
    }

    console.log('🧪 Testing Resend email sending...');
    console.log('To:', to);
    console.log('Subject:', subject);

    const result = await sendEmail({
      to,
      subject,
      html,
      text
    });

    if (result.success) {
      console.log('✅ Email sent successfully:', result.messageId);
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test API failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}