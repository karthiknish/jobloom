import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { createFirestoreCollection } from "@/firebase/firestore";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

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

      return applyCorsHeaders(NextResponse.json(createdFollowUp._id), request);
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
      // Initialize Firestore
      const followUpsCollection = createFirestoreCollection<any>('followUps');

      // Get follow-ups (filtered by user on client or make query here if needed)
      const followUps = await followUpsCollection.getAll();

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
