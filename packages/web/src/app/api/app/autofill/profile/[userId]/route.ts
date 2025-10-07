import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params;
  try {
    const userId = params.userId;

    if (!userId) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        ),
        request,
      );
    }

    // Get the user's autofill profile
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
        request,
      );
    }

    const userData = userDoc.data();
    const autofillProfile = userData?.autofillProfile || null;

    if (!autofillProfile) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "No autofill profile found" },
          { status: 404 }
        ),
        request,
      );
    }

    // Only return non-sensitive data for extension use
    const sanitizedProfile = {
      personalInfo: {
        firstName: autofillProfile.personalInfo.firstName || "",
        lastName: autofillProfile.personalInfo.lastName || "",
        email: autofillProfile.personalInfo.email || "",
        phone: autofillProfile.personalInfo.phone || "",
        address: autofillProfile.personalInfo.address || "",
        city: autofillProfile.personalInfo.city || "",
        state: autofillProfile.personalInfo.state || "",
        zipCode: autofillProfile.personalInfo.zipCode || "",
        country: autofillProfile.personalInfo.country || "",
      },
      professional: {
        currentTitle: autofillProfile.professional.currentTitle || "",
        experience: autofillProfile.professional.experience || "",
        education: autofillProfile.professional.education || "",
        skills: autofillProfile.professional.skills || "",
        linkedinUrl: autofillProfile.professional.linkedinUrl || "",
        portfolioUrl: autofillProfile.professional.portfolioUrl || "",
        githubUrl: autofillProfile.professional.githubUrl || "",
      },
      preferences: {
        salaryExpectation: autofillProfile.preferences.salaryExpectation || "",
        availableStartDate: autofillProfile.preferences.availableStartDate || "",
        workAuthorization: autofillProfile.preferences.workAuthorization || "",
        relocate: autofillProfile.preferences.relocate || false,
        coverLetter: autofillProfile.preferences.coverLetter || "",
      },
    };

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        data: sanitizedProfile,
        message: "Autofill profile retrieved successfully"
      }),
      request,
    );

  } catch (error: any) {
    console.error("Error fetching autofill profile for extension:", error);
    
    return applyCorsHeaders(
      NextResponse.json(
        { error: "Failed to fetch autofill profile" },
        { status: 500 }
      ),
      request,
    );
  }
}



// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
