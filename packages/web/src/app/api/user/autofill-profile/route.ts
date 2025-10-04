import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Get user's autofill profile from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const autofillProfile = userData?.autofillProfile || null;

    return NextResponse.json({
      success: true,
      data: autofillProfile,
      message: autofillProfile ? "Autofill profile found" : "No autofill profile found"
    });

  } catch (error: any) {
    console.error("Error fetching autofill profile:", error);
    
    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        { error: "Authentication token has expired" },
        { status: 401 }
      );
    }
    
    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json(
        { error: "Authentication token has been revoked" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch autofill profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate the autofill profile data
    const autofillProfile = validateAutofillProfile(body);
    
    if (!autofillProfile) {
      return NextResponse.json(
        { error: "Invalid autofill profile data" },
        { status: 400 }
      );
    }

    // Save to Firestore
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
      autofillProfile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Log the activity
    await db.collection("users").doc(uid).collection("activity").add({
      type: "autofill_profile_updated",
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: autofillProfile,
      message: "Autofill profile saved successfully"
    });

  } catch (error: any) {
    console.error("Error saving autofill profile:", error);
    
    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        { error: "Authentication token has expired" },
        { status: 401 }
      );
    }
    
    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json(
        { error: "Authentication token has been revoked" },
        { status: 401 }
      );
    }

    if (error.code === "permission-denied") {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save autofill profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Delete autofill profile from Firestore
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      autofillProfile: null,
      updatedAt: new Date().toISOString(),
    });

    // Log the activity
    await db.collection("users").doc(uid).collection("activity").add({
      type: "autofill_profile_deleted",
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Autofill profile deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting autofill profile:", error);
    
    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        { error: "Authentication token has expired" },
        { status: 401 }
      );
    }
    
    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json(
        { error: "Authentication token has been revoked" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete autofill profile" },
      { status: 500 }
    );
  }
}

function validateAutofillProfile(data: any): any {
  if (!data || typeof data !== "object") {
    return null;
  }

  // Basic structure validation
  const requiredStructure = {
    personalInfo: {
      firstName: "string",
      lastName: "string",
      email: "string",
      phone: "string",
      address: "string",
      city: "string",
      state: "string",
      zipCode: "string",
      country: "string",
    },
    professional: {
      currentTitle: "string",
      experience: "string",
      education: "string",
      skills: "string",
      linkedinUrl: "string",
      portfolioUrl: "string",
      githubUrl: "string",
    },
    preferences: {
      salaryExpectation: "string",
      availableStartDate: "string",
      workAuthorization: "string",
      relocate: "boolean",
      coverLetter: "string",
    },
  };

  // Check if all required sections exist
  if (!data.personalInfo || !data.professional || !data.preferences) {
    return null;
  }

  // Sanitize and validate data
  const sanitizedData = {
    personalInfo: {
      firstName: String(data.personalInfo.firstName || "").trim(),
      lastName: String(data.personalInfo.lastName || "").trim(),
      email: String(data.personalInfo.email || "").trim().toLowerCase(),
      phone: String(data.personalInfo.phone || "").trim(),
      address: String(data.personalInfo.address || "").trim(),
      city: String(data.personalInfo.city || "").trim(),
      state: String(data.personalInfo.state || "").trim(),
      zipCode: String(data.personalInfo.zipCode || "").trim(),
      country: String(data.personalInfo.country || "").trim(),
    },
    professional: {
      currentTitle: String(data.professional.currentTitle || "").trim(),
      experience: String(data.professional.experience || "").trim(),
      education: String(data.professional.education || "").trim(),
      skills: String(data.professional.skills || "").trim(),
      linkedinUrl: String(data.professional.linkedinUrl || "").trim(),
      portfolioUrl: String(data.professional.portfolioUrl || "").trim(),
      githubUrl: String(data.professional.githubUrl || "").trim(),
    },
    preferences: {
      salaryExpectation: String(data.preferences.salaryExpectation || "").trim(),
      availableStartDate: String(data.preferences.availableStartDate || "").trim(),
      workAuthorization: String(data.preferences.workAuthorization || "").trim(),
      relocate: Boolean(data.preferences.relocate),
      coverLetter: String(data.preferences.coverLetter || "").trim(),
    },
  };

  // Basic email validation for personal info
  if (sanitizedData.personalInfo.email && !isValidEmail(sanitizedData.personalInfo.email)) {
    return null;
  }

  return sanitizedData;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
