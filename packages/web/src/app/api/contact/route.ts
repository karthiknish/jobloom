import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { checkForSpam, recordSubmission } from "@/lib/spam-detection";

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  spamScore?: number;
  isSpam?: boolean;
  ip?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, subject, honeypot, loadedAt, submittedAt } = body;

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || request.headers.get("x-real-ip") 
      || "unknown";

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, message" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check for spam
    const spamCheck = checkForSpam(
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        subject: subject?.trim(),
        honeypot,
        loadedAt: loadedAt ? Number(loadedAt) : undefined,
        submittedAt: submittedAt ? Number(submittedAt) : Date.now(),
      },
      ip
    );

    // Block high-confidence spam immediately
    if (spamCheck.shouldBlock) {
      console.warn(`[Contact] Spam blocked from ${ip}:`, spamCheck.reasons);
      // Return success to avoid giving spammers feedback
      return NextResponse.json({
        success: true,
        message: "Thank you for your message. We'll be in touch soon.",
        contactId: "blocked",
      });
    }

    // Record submission for rate limiting
    recordSubmission(ip);

    const db = getAdminDb();
    
    // Create contact submission (flagged if suspected spam)
    const contactRef = db.collection('contacts').doc();
    const contactData: Partial<Contact> & { spamReasons?: string[] } = {
      id: contactRef.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      subject: subject?.trim() || "General Inquiry",
      status: spamCheck.isSpam ? "spam" : "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spamScore: spamCheck.score,
      isSpam: spamCheck.isSpam,
      ip: ip !== "unknown" ? ip : undefined,
    };

    // Add spam reasons for admin review
    if (spamCheck.isSpam && spamCheck.reasons.length > 0) {
      contactData.spamReasons = spamCheck.reasons;
    }

    await contactRef.set(contactData);

    // Log spam detection for monitoring
    if (spamCheck.score > 0) {
      console.log(`[Contact] Submission from ${ip} - Score: ${spamCheck.score}, Spam: ${spamCheck.isSpam}, Reasons: ${spamCheck.reasons.join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      message: "Contact submission created successfully",
      contactId: contactRef.id
    });

  } catch (error) {
    console.error("Contact submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.collection('contacts').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    const contacts: Contact[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      contacts.push({
        id: doc.id,
        ...data
      } as Contact);
    });

    return NextResponse.json({
      success: true,
      contacts,
      total: contacts.length
    });

  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
