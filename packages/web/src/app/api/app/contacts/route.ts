import { NextRequest, NextResponse } from "next/server";

// POST /api/app/contacts - Create contact form submission
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // For now, just log the contact submission
    // In a real implementation, this would save to Firestore or send an email
    console.log("Contact form submission:", data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}