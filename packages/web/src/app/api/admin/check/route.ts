import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";

// GET /api/admin/check - Check if current user is admin
export async function GET(request: NextRequest) {
  try {
    console.log('Admin check API called');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      hasServiceAccount: !!(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT),
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    });

    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      console.log('No decoded token - unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Decoded token received:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      hasUid: !!decodedToken.uid,
      uidLength: decodedToken.uid?.length
    });

    // Check if user is admin from Firestore using admin SDK
    console.log('Calling isUserAdmin with userId:', decodedToken.uid);
    const isAdmin = await isUserAdmin(decodedToken.uid);
    console.log('isUserAdmin result:', isAdmin);

    return NextResponse.json({
      isAdmin,
      userId: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
