import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

// CORS helper function for LinkedIn extension
function addCorsHeaders(response, origin) {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || 
      requestOrigin.includes('hireall.app') || 
      requestOrigin.includes('vercel.app') || 
      requestOrigin.includes('netlify.app'))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params;
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the user's autofill profile
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const autofillProfile = userData?.autofillProfile || null;

    if (!autofillProfile) {
      return NextResponse.json(
        { error: "No autofill profile found" },
        { status: 404 }
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

    return NextResponse.json({
      success: true,
      data: sanitizedProfile,
      message: "Autofill profile retrieved successfully"
    });

  } catch (error: any) {
    console.error("Error fetching autofill profile for extension:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch autofill profile" },
      { status: 500 }
    );
  }
}



// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
