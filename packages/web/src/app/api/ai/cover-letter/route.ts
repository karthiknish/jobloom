import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";
import { generateCoverLetter } from "@/services/ai/geminiService";

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In development with mock tokens, skip premium check and Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock success response for testing
      return NextResponse.json({ 
        coverLetter: "This is a mock cover letter generated for testing purposes. In a real implementation, this would contain AI-generated content tailored to your resume and the job description.",
        message: 'Cover letter generated successfully (mock)'
      });
    }

    // Check if user is premium
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.subscription?.tier === 'free') {
      return NextResponse.json({ 
        error: 'Premium subscription required for AI cover letter generation' 
      }, { status: 403 });
    }

    const {
      jobTitle,
      companyName,
      jobDescription,
      skills,
      experience,
      tone,
      length,
      atsOptimization,
      keywordFocus,
      deepResearch = false,
    } = await request.json();

    // Validate required fields
    if (!jobTitle || !companyName || !jobDescription) {
      return NextResponse.json({ 
        error: 'Missing required fields: jobTitle, companyName, jobDescription' 
      }, { status: 400 });
    }

    // Normalize skills array
    const normalizedSkills = Array.isArray(skills) ? skills : [];

    // Generate cover letter using AI
    const result = await generateCoverLetter({
      jobTitle,
      companyName,
      jobDescription,
      skills: normalizedSkills,
      experience,
      tone,
      length,
      deepResearch,
    });

    // Store in user's cover letter history
    await db.collection('users').doc(decodedToken.uid).collection('coverLetters').add({
      ...result,
      jobTitle,
      companyName,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
