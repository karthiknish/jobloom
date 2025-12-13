import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/app/follow-ups - Create a new follow-up
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const followUpData = await request.json();
      
      // Validate required fields
      const requiredFields = ['applicationId', 'userId', 'type', 'scheduledDate'];
      for (const field of requiredFields) {
        if (!followUpData[field]) {
          return applyCorsHeaders(
            NextResponse.json({ error: `${field} is required` }, { status: 400 }),
            request,
          );
        }
      }

      // Verify userId matches authenticated user
      if (followUpData.userId !== user.uid) {
        return applyCorsHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
          request,
        );
      }

      // Initialize Firestore Admin
      const db = getAdminDb();

      // Create follow-up object
      const followUpDataToCreate = {
        applicationId: followUpData.applicationId,
        userId: followUpData.userId,
        type: followUpData.type,
        scheduledDate: followUpData.scheduledDate,
        completed: followUpData.completed || false,
        notes: followUpData.notes || '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Create follow-up in Firestore
      const docRef = await db.collection('followUps').add(followUpDataToCreate);

      return applyCorsHeaders(NextResponse.json(docRef.id), request);
    } catch (error) {
      console.error("Error creating follow-up:", error);
      return applyCorsHeaders(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request,
      );
    }
  }
);

// GET /api/app/follow-ups - Get all follow-ups for the authenticated user
export const GET = withAuth(
  async (request, { user }) => {
    try {
      // Initialize Firestore Admin
      const db = getAdminDb();

      // Get follow-ups for the user
      const snapshot = await db.collection('followUps').where('userId', '==', user.uid).get();
      const followUps = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));

      return applyCorsHeaders(NextResponse.json(followUps), request);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      return applyCorsHeaders(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request,
      );
    }
  }
);


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}

