import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { cert } from "firebase-admin/app";
import * as admin from "firebase-admin";
import type { ContactSubmission } from "../../../../types/api";

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  };

  admin.initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID!,
  });
}

// Initialize Firestore
const db = getFirestore();

// POST /api/app/contacts - Create contact form submission
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "name, email, and message are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Validate message length
    if (data.message.length < 10) {
      return NextResponse.json(
        {
          error: "Message too short",
          details: "Please provide a message with at least 10 characters",
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (data.name.length < 2) {
      return NextResponse.json(
        {
          error: "Name too short",
          details: "Please provide a name with at least 2 characters",
        },
        { status: 400 }
      );
    }

    // Create contact submission object
    const contactSubmission: Omit<ContactSubmission, "_id"> = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      message: data.message.trim(),
      subject: data.subject?.trim() || "General Inquiry",
      status: "new",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to Firestore
    const docRef = await db.collection("contacts").add(contactSubmission);

    console.log("Contact form submission saved to Firestore:", {
      id: docRef.id,
      name: contactSubmission.name,
      email: contactSubmission.email,
      subject: contactSubmission.subject,
      messageLength: contactSubmission.message.length,
    });

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      contactId: docRef.id,
    });
  } catch (error) {
    console.error("Error creating contact:", error);

    // Check for specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("PERMISSION_DENIED")) {
        return NextResponse.json(
          {
            error: "Permission denied",
            details: "Unable to save contact submission",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: "Failed to save contact submission",
      },
      { status: 500 }
    );
  }
}

// GET /api/app/contacts - Get all contact submissions (admin only)
export async function GET(_request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, this endpoint is not protected

    // Fetch from Firestore
    const snapshot = await db
      .collection("contacts")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const contacts: ContactSubmission[] = [];
    snapshot.forEach((doc) => {
      contacts.push({
        _id: doc.id,
        ...doc.data(),
      } as ContactSubmission);
    });

    console.log(`Fetched ${contacts.length} contacts from Firestore`);

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "Failed to fetch contact submissions",
      },
      { status: 500 }
    );
  }
}