import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getAdminFirestore } from "@/firebase/admin";

// CORS helper function for LinkedIn extension
function addCorsHeaders(response: NextResponse, origin: string | undefined) {
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

// POST /api/app/follow-ups - Create a new follow-up
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const followUpData = await request.json();
    
    // Validate required fields
    const requiredFields = ['applicationId', 'userId', 'type', 'scheduledDate'];
    for (const field of requiredFields) {
      if (!followUpData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Verify userId matches token
    if (followUpData.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Firestore
    const followUpsCollection = createFirestoreCollection<any>('followUps');

    // Create follow-up object
    const followUpDataToCreate = {
      applicationId: followUpData.applicationId,
      userId: followUpData.userId,
      type: followUpData.type,
      scheduledDate: followUpData.scheduledDate,
      completed: followUpData.completed || false,
      notes: followUpData.notes || '',
    };

    // Create follow-up in Firestore
    const createdFollowUp = await followUpsCollection.create(followUpDataToCreate);

    return NextResponse.json(createdFollowUp._id);
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/app/follow-ups - Get all follow-ups (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Initialize Firestore
    const followUpsCollection = createFirestoreCollection<any>('followUps');

    // Get all follow-ups (admin only)
    const followUps = await followUpsCollection.getAll();

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
